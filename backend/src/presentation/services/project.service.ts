import {
	DeletionRequestModel,
	DeletionRequestState,
	NotificationType,
	ProjectModel,
	ProjectState,
	UserModel,
	UserRole,
} from "../../data";
import { CustomError, UpdateUserDto } from "../../domain";
import { CreateDeletionRequestDto } from "../../domain/dtos/project/create-deletion-request.dto";
import { CreateProjectDto } from "../../domain/dtos/project/create-project.dto";
import { ShareProjectDto } from "../../domain/dtos/project/share-project.dto";
import { UpdateProjectDto } from "../../domain/dtos/project/update-project.dto";
import { DelitionRequestEntity } from "../../domain/entities/delition-request.entity";
import { ProjectEntity } from "../../domain/entities/project.entity";
import { EmailService } from "./email.service";
import { jwtAdapter } from "../../config";
import { ShareProjectLinkDto } from "../../domain/dtos/project/share-project-link.dto";
import mongoose, { Schema } from "mongoose";
import { ProjectInviteTokenPayload } from "../../types/tokens";
import { notificationService } from "./notification.service";

export class ProjectService {
	constructor(
		private readonly emailService: EmailService,
		private readonly webServiceUrl: string,
		private readonly frontEndUrl: string,
	) {
		// If you need any dependencies, inject them here (e.g., email service, etc.)
	}

	private sendEmailInvitationLink = async ({
		email,
		link,
	}: {
		requestingUser: string;
		projectId: string;
		email: string;
		link: string;
	}) => {
		const html = `<h1>Has sido invitado/a a colaborar en un proyecto!</h1>
      <p> Hace Click en el siguiente <a href=${link}>link</a> para aceptar la invitación </p>
      <p><strong>Recordá que en caso de no tener cuenta primero deberás registrarte para poder acceder a la invitación</strong></p>`;

		const options = {
			to: email,
			subject: "MFLOW - Invitación a colaborar en un proyecto",
			htmlBody: html,
		};

		const isSent = await this.emailService.sendEmail(options);

		if (!isSent)
			throw CustomError.internalServer(
				"Ocurrió un error al enviar el email de invitación al proyecto.",
			);
	};

	async sendProjectCollaborationInvitation(shareProjectDto: ShareProjectDto) {
		const project = await ProjectModel.findOne({
			_id: shareProjectDto.projectId,
			state: { $ne: ProjectState.DELETED },
		});
		if (!project)
			throw CustomError.badRequest(
				"No se pudo encontrar el proyecto especificado.",
			);

		const uniqueEmails = new Set<string>(shareProjectDto.emails);
		const { fullLink, token: shareToken } =
			await this.generateProjectSharingLinkAndToken({
				requestingUser: shareProjectDto.senderId,
				projectId: shareProjectDto.projectId,
			});

		await Promise.all(
			Array.from(uniqueEmails).map((email) =>
				this.sendEmailInvitationLink({
					email,
					requestingUser: shareProjectDto.senderId,
					projectId: shareProjectDto.projectId,
					link: fullLink,
				}),
			),
		);

		// In-app notification for recipients who are already platform users
		for (const email of uniqueEmails) {
			try {
				const user = await UserModel.findOne({
					email,
					deletedAt: null,
				}).exec();
				if (!user) continue;
				if (project.owner.equals(user._id)) continue;
				if (project.collaborators.some((c) => c.equals(user._id))) continue;
				await notificationService.createNotification({
					recipientId: user._id.toString(),
					type: NotificationType.PROJECT_SHARED,
					title: "Te han invitado a un proyecto",
					message: `Te han invitado a colaborar en el proyecto "${project.title}".`,
					link: `/share/projects?token=${shareToken}`,
					relatedProjectId: shareProjectDto.projectId,
					triggeredById: shareProjectDto.senderId,
				});
			} catch (notifError) {
				console.error(
					"Error creating project-share notification for",
					email,
					notifError,
				);
			}
		}

		return {
			message: "Las invitaciones fueron enviadas correctamente.",
			request: uniqueEmails,
		};
	}

	async getProjectSharingLink(shareProjectDto: ShareProjectLinkDto) {
		const { requestingUser, projectId } = shareProjectDto;
		const project = await ProjectModel.findOne({
			_id: projectId,
			state: { $ne: ProjectState.DELETED },
		});
		if (!project)
			throw CustomError.notFound(
				"No se pudo encontrar el proyecto especificado.",
			);

		if (!project.owner.equals(requestingUser))
			throw CustomError.unauthorized(
				"No puedes compartir un proyecto del que no eres propietario.",
			);

		const link = await this.generateProjectSharingLink({
			requestingUser,
			projectId,
		});

		return {
			message: "El link para compartir el proyecto fue generado correctamente.",
			shareLink: link,
		};
	}

	private async generateProjectSharingLink({
		requestingUser,
		projectId,
	}: ProjectInviteTokenPayload) {
		const { fullLink } = await this.generateProjectSharingLinkAndToken({
			requestingUser,
			projectId,
		});
		return fullLink;
	}

	/** Returns { fullLink, token } for emails and in-app notification links. */
	private async generateProjectSharingLinkAndToken({
		requestingUser,
		projectId,
	}: ProjectInviteTokenPayload): Promise<{ fullLink: string; token: string }> {
		const raw = await jwtAdapter.generateToken(
			{ requestingUser, projectId },
			"7d",
		);
		if (typeof raw !== "string") {
			throw CustomError.internalServer(
				"Se produjo un error al generar el link para compartir el proyecto.",
			);
		}
		const token: string = raw;
		return {
			fullLink: `${this.frontEndUrl}/share/projects/?token=${token}`,
			token,
		};
	}

	//get user active projects
	async getUserProjects(owner: string) {
		const projects = await ProjectModel.find({
			owner: owner,
			state: { $ne: ProjectState.DELETED },
		}).exec();

		return {
			count: projects.length,
			projects: projects.map((p) => ProjectEntity.fromObject(p)),
		};
	}

	//get user active shared projects
	async getUserSharedProjects(userId: string) {
		const projects = await ProjectModel.find({
			collaborators: userId,
			state: { $ne: ProjectState.DELETED },
		}).exec();

		return {
			count: projects.length,
			projects: projects.map((p) => ProjectEntity.fromObject(p)),
		};
	}

	async getProjectByIdWithVersions({
		projectId,
		requestingUserSession,
	}: {
		projectId: string;
		requestingUserSession: { userId: string; roles: string[] };
	}) {
		const project = await ProjectModel.findById(projectId)
			.populate({
				path: "versions",
				match: { state: { $ne: "ELIMINADA" } },
				select: ["title", "parentVersion", "state", "updatedAt", "createdAt"],
				populate: {
					path: "parentVersion",
					select: ["title"],
				},
			})
			.exec();

		if (!project)
			throw CustomError.notFound(
				"El proyecto solicitado no existe o fue eliminado.",
			);

		const isOwner = project.owner.equals(requestingUserSession.userId);
		const isCollaborator = project.collaborators.some((c) =>
			c.equals(requestingUserSession.userId),
		);
		const isAdmin = requestingUserSession.roles.includes(UserRole.ADMIN);

		if (!isOwner && !isCollaborator && !isAdmin) {
			throw CustomError.unauthorized(
				"No cuenta con los permisos necesarios para acceder al proyecto especificado.",
			);
		}

		const projectEntity = ProjectEntity.fromObject(project, {
			includeVersions: true,
		});

		return {
			project: projectEntity,
		};
	}

	/**
	 * Returns whether the user has collaborator (or owner/admin) access to the project.
	 * Used to gate access to the project versions list; shared readers only have access to shared versions, not the full list.
	 */
	async canUserAccessProjectVersions({
		projectId,
		userId,
		roles = [],
	}: {
		projectId: string;
		userId: string;
		roles?: string[];
	}): Promise<{ canAccessVersions: boolean }> {
		const project = await ProjectModel.findById(projectId)
			.select("owner collaborators")
			.lean()
			.exec();

		if (!project)
			throw CustomError.notFound(
				"El proyecto solicitado no existe o fue eliminado.",
			);

		const isOwner = (project.owner as any).toString() === userId;
		const isCollaborator = (project.collaborators || []).some(
			(c: any) => c.toString() === userId,
		);

		return {
			canAccessVersions: isOwner || isCollaborator,
		};
	}

	async getProjectByIdWithCollaborators({
		projectId,
		userSession,
	}: {
		projectId: string;
		userSession: { userId: string; roles: string[] };
	}) {
		const project = await ProjectModel.findOne({ _id: projectId })
			.populate({
				path: "collaborators",
				select: ["name", "lastName", "email"],
				match: { deletedAt: null },
			})
			.exec();

		if (!project)
			throw CustomError.notFound(
				"El proyecto solicitado no pudo ser encontrado en el servidor.",
			);

		if (project.state == ProjectState.DELETED)
			throw CustomError.badRequest("El proyecto solicitado fue eliminado.");

		const projectEntity = ProjectEntity.fromObject(project, {
			includeCollaborators: true,
		});

		return {
			project: projectEntity,
		};
	}

	async createProject(createDto: CreateProjectDto) {
		//1. verificar que no exista un proyecto con el mismo nombre
		const existName = await ProjectModel.findOne({
			title: createDto.title,
			owner: createDto.owner,
			state: { $ne: ProjectState.DELETED },
		});
		if (existName)
			throw CustomError.conflict(
				"Ya existe un proyecto con el título especificado.",
			);

		let project;
		try {
			project = new ProjectModel(createDto);

			await project.save();
		} catch (error) {
			console.error(`Error ocurred while creating a project: `, error);
			throw CustomError.internalServer(
				`Ha ocurrido un error interno en el servidor.`,
			);
		}

		const projectEntity = ProjectEntity.fromObject(project);

		return { user: projectEntity };
	}

	async updateProject(projectData: UpdateProjectDto) {
		const { id, title, description, requestingUserId } = projectData;

		const project = await ProjectModel.findOne({ _id: id });

		if (!project)
			throw CustomError.notFound("El proyecto especificado no existe.");

		if (project.state !== ProjectState.CREATED) {
			throw CustomError.conflict(
				"El proyecto no se encuentra en un estado editable.",
			);
		}

		if (!project.owner.equals(requestingUserId)) {
			throw CustomError.forbidden(
				"No puede modificar el proyecto especificado.",
			);
		}

		if (title === project.title && description === project.description)
			throw CustomError.badRequest(
				"Debe modificar algun campo para poder actualizar el proyecto.",
			);

		const existName = await ProjectModel.findOne({
			_id: { $ne: id },
			title: title,
			state: { $ne: ProjectState.DELETED },
			owner: requestingUserId,
		});
		if (existName) {
			throw CustomError.conflict(
				"Ya existe un proyecto con el título especificado.",
			);
		}

		try {
			if (title) project.title = title;
			if (description) project.description = description;

			await project.save();
		} catch (error) {
			console.error(`Error ocurred while creating a project: `, error);
			throw CustomError.internalServer(
				`Ha ocurrido un error interno en el servidor.`,
			);
		}

		const projectEntity = ProjectEntity.fromObject(project);

		return {
			project: projectEntity,
		};
	}

	async deleteProject(projectId: string) {
		const project = await ProjectModel.findOne({ _id: projectId });
		if (!project) throw CustomError.badRequest("Project does not exists");

		switch (project.state) {
			case ProjectState.DELETED:
				throw CustomError.badRequest("Project already deleted");

			case ProjectState.PENDING_DELETION:
				try {
					project.state = ProjectState.DELETED;

					await project.save();
					return {
						message: "Project deleted successfully",
					};
				} catch (error) {
					throw CustomError.internalServer(`${error}`);
				}

			case ProjectState.CREATED:
				throw CustomError.badRequest(
					"To delete a Project you need to request it first",
				);
		}
	}

	async removeCollaboratorFromProject({
		projectId,
		collaboratorToRemove,
		requestingUser,
	}: {
		projectId: string;
		requestingUser: string;
		collaboratorToRemove: string;
	}) {
		const collaborator = await UserModel.findOne({
			_id: collaboratorToRemove,
			deletedAt: null,
		});

		if (!collaborator) {
			throw CustomError.notFound(
				"El colaborador especificado no existe o fue eliminado.",
			);
		}

		const project = await ProjectModel.findOne({
			_id: projectId,
			state: { $ne: ProjectState.DELETED },
		});

		if (!project)
			throw CustomError.notFound(
				"El proyecto especificado no existe o fue eliminado.",
			);

		if (!project.owner.equals(requestingUser))
			throw CustomError.unauthorized(
				"Solo el dueño del proyecto puede remover colaboradores.",
			);

		try {
			await ProjectModel.updateOne(
				{ _id: projectId },
				{ $pull: { collaborators: collaboratorToRemove } },
			);
		} catch (error) {
			console.error(
				`Error occurred while removing collaborator from project: ${error}`,
			);
			throw CustomError.internalServer(
				`Se ha producido un error al remover al colaborador del proyecto. Por favor, inténtelo de nuevo más tarde.`,
			);
		}
	}

	async addCollaboratorToProject(token: string, newCollaboratorUserId: string) {
		const payload = await jwtAdapter.validateToken(token);
		if (!payload)
			throw CustomError.unauthorized("El token de invitación es inválido.");

		const { requestingUser, projectId } = payload as ProjectInviteTokenPayload;

		if (!projectId)
			throw CustomError.internalServer("El token de invitación es inválido.");

		if (!requestingUser)
			throw CustomError.internalServer("El token de invitación es inválido.");

		const project = await ProjectModel.findOne({
			_id: projectId,
			state: { $ne: ProjectState.DELETED },
		});
		if (!project)
			throw CustomError.badRequest(
				"El proyecto asociado a la invitación no existe o fue eliminado.",
			);

		const user = await UserModel.findOne({
			_id: newCollaboratorUserId,
			deletedAt: null,
		});

		if (!user)
			throw CustomError.unauthorized(
				"El usuario debe encontrarse registrado en la plataforma.",
			);

		if (project.owner.equals(user._id))
			throw CustomError.badRequest(
				"El dueño del proyecto no puede ser asignado como colaborador.",
			);

		if (project.collaborators.includes(user._id))
			throw CustomError.badRequest(
				"El usuario ya se encuentra asignado como colaborador en el proyecto.",
			);

		try {
			project.collaborators.push(user._id);
			await project.save();

			try {
				await notificationService.createNotification({
					recipientId: user._id.toString(),
					type: NotificationType.PROJECT_SHARED,
					title: "Te han invitado a un proyecto",
					message: `Te han añadido como colaborador del proyecto "${project.title}".`,
					link: `/dashboard/projects/${projectId}/versions`,
					relatedProjectId: projectId,
					triggeredById: requestingUser,
				});
			} catch (notifError) {
				console.error("Error creating project-share notification:", notifError);
			}

			const projectEntity = ProjectEntity.fromObject(project);

			return {
				message:
					"El usuario fue asignado exitosamente como colaborador en el proyecto.",
				project: projectEntity,
			};
		} catch (error) {
			console.error(
				`Error occurred while adding collaborator to project: ${error}`,
			);
			throw CustomError.internalServer(
				`Se ha producido un error al añadir al usuario como colaborador en el proyecto. Por favor, inténtelo de nuevo más tarde.`,
			);
		}
	}

	async getProjectFromInvitationToken(token: string) {
		const payload = await jwtAdapter.validateToken(token);
		if (!payload)
			throw CustomError.unauthorized("El token de invitación es inválido.");

		const { requestingUser, projectId } = payload as ProjectInviteTokenPayload;

		if (!projectId)
			throw CustomError.internalServer(
				"El token de invitación no contiene el identificador del proyecto.",
			);

		if (!requestingUser)
			throw CustomError.internalServer("El token de invitación es inválido.");

		const project = await ProjectModel.findOne({
			_id: projectId,
			state: { $ne: ProjectState.DELETED },
		});
		if (!project)
			throw CustomError.notFound(
				"El proyecto asociado a la invitación no existe o fue eliminado.",
			);

		return {
			project: project,
		};
	}

	async requestProjectDeletion(
		createDeletionRequestDto: CreateDeletionRequestDto,
	) {
		const project = await ProjectModel.findOne({
			_id: createDeletionRequestDto.project,
			state: { $ne: ProjectState.DELETED },
		});
		if (!project)
			throw CustomError.notFound("El proyecto no existe o fue eliminado.");
		if (project.state !== ProjectState.CREATED)
			throw CustomError.notFound(
				"No se puede crear una solicitud de eliminación para el proyecto especificado.",
			);

		const request = await DeletionRequestModel.findOne({
			project: createDeletionRequestDto.project,
			state: DeletionRequestState.PENDING,
		});
		if (request)
			throw CustomError.badRequest(
				"Este proyecto ya tiene una solicitud de eliminación asociada.",
			);

		try {
			const delitionRequest = new DeletionRequestModel(
				createDeletionRequestDto,
			);
			await delitionRequest.save();
			const delitionRequestEntity =
				DelitionRequestEntity.fromObject(delitionRequest);

			project.state = ProjectState.PENDING_DELETION;
			await project.save();

			return {
				message: "La creación de la solicitud de eliminación fue exitosa.",
				request: delitionRequestEntity,
			};
		} catch (error) {
			throw CustomError.internalServer(`${error}`);
		}
	}

	async getDeletionDetails(projectId: string) {
		const request = await DeletionRequestModel.findOne({ project: projectId });
		if (!request) throw CustomError.badRequest("Request doesn't exist ");

		const requestEntity = DelitionRequestEntity.fromObject(request);

		return {
			request: requestEntity,
		};
	}

	async handleCollaboration(projectId: string, userId: string, action: string) {
		throw new Error("To be implemented");
	}

	async handleDeletionRequest(projectId: string, action: string) {
		throw new Error("To be implemented");
	}

	async getVerificationStatus(projectId: string) {
		throw new Error("To be implemented");
	}

	async updateVerificationStatus(projectId: string, status: string) {
		throw new Error("To be implemented");
	}
}
