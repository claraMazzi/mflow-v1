import {
	DeletionRequestModel,
	ProjectModel,
	ProjectStateEnum,
	UserModel,
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

export class ProjectService {
	constructor(
		private readonly emailService: EmailService,
		private readonly webServiceUrl: string,
		private readonly frontEndUrl: string
	) {
		// If you need any dependencies, inject them here (e.g., email service, etc.)
	}

	private sendEmailInvitationLink = async ({
		email,
		senderId,
		projectId,
	}: {
		senderId: string;
		projectId: string;
		email: string;
	}) => {
		const token = await jwtAdapter.generateToken(
			{ senderId: senderId, projectId: projectId, recipient: email },
			"7d"
		);

		if (!token) throw CustomError.internalServer("Error getting token");
		//link de retorno
		const link = `${this.frontEndUrl}/share/projects/?token=${token}`;

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
			throw CustomError.internalServer("Error sending sharing email");
	};

	//get user active projects
	async getUserProjects(owner: string) {
		const projects = await ProjectModel.find({
			owner: owner,
			state: { $ne: ProjectStateEnum.deleted },
		})
			.populate("collaborators")
			.exec();

		if (!projects) throw CustomError.badRequest("User has no Projects");

		const filteredProjects = projects
			.map((p) => ProjectEntity.fromObject(p))
			.filter((item) => item.state !== ProjectStateEnum.deleted);

		if (!filteredProjects.length)
			throw CustomError.badRequest("User has no active Projects");

		return {
			count: filteredProjects.length,
			projects: filteredProjects,
		};
	}

	//get user active shared projects
	async getUserSharedProjects(userId: string) {
		const projects = await ProjectModel.find({
			collaborators: userId,
			state: { $ne: ProjectStateEnum.deleted },
		})
			.populate("collaborators")
			.exec();

		if (!projects) throw CustomError.badRequest("User has no shared Projects");

		const filteredProjects = projects
			.map((p) => ProjectEntity.fromObject(p))
			.filter((item) => item.state !== ProjectStateEnum.deleted);

		if (!filteredProjects.length)
			throw CustomError.badRequest("User has no active Projects");

		return {
			count: filteredProjects.length,
			projects: filteredProjects,
		};
	}

	async getProjectByIdWithVersions({
		projectId,
		userSession,
	}: {
		projectId: string;
		userSession: { userId: string; roles: string[] };
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
				"El proyecto solicitado no pudo ser encontrado en el servidor."
			);

		if (project.state === ProjectStateEnum.deleted)
			throw CustomError.badRequest("El proyecto solicitado fue eliminado.");

		const projectEntity = ProjectEntity.fromObject(project);

		return {
			project: projectEntity,
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
			.populate("collaborators")
			.exec();

		if (!project)
			throw CustomError.notFound(
				"El proyecto solicitado no pudo ser encontrado en el servidor."
			);

		if (project.state == ProjectStateEnum.deleted)
			throw CustomError.badRequest("El proyecto solicitado fue eliminado.");

		const projectEntity = ProjectEntity.fromObject(project);

		return {
			project: projectEntity,
		};
	}

	async createProject(createDto: CreateProjectDto) {
		//1. verificar que no exista un proyecto con el mismo nombre
		const existName = await ProjectModel.findOne({
			title: createDto.title,
			owner: createDto.owner,
		});
		if (existName)
			throw CustomError.conflict(
				"Ya existe un proyecto con el título especificado."
			);

		let project;
		try {
			project = new ProjectModel(createDto);

			await project.save();
		} catch (error) {
			console.error(`Error ocurred while creating a project: `, error);
			throw CustomError.internalServer(
				`Ha ocurrido un error interno en el servidor.`
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

		if (project.state !== ProjectStateEnum.created) {
			throw CustomError.conflict(
				"El proyecto no se encuentra en un estado editable."
			);
		}

		if (!project.owner.equals(requestingUserId)) {
			throw CustomError.forbidden(
				"No puede modificar el proyecto especificado."
			);
		}

		if (title === project.title && description === project.description)
			throw CustomError.badRequest(
				"Debe modificar algun campo para poder actualizar el proyecto."
			);

		const existName = await ProjectModel.findOne({
			_id: { $ne: new mongoose.Types.ObjectId(id) },
			title: title,
			owner: new mongoose.Types.ObjectId(requestingUserId),
		});
		if (existName) {
			throw CustomError.conflict(
				"Ya existe un proyecto con el título especificado."
			);
		}

		try {
			if (title) project.title = title;
			if (description) project.description = description;

			await project.save();
		} catch (error) {
			console.error(`Error ocurred while creating a project: `, error);
			throw CustomError.internalServer(
				`Ha ocurrido un error interno en el servidor.`
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
			case ProjectStateEnum.deleted:
				throw CustomError.badRequest("Project already deleted");

			case ProjectStateEnum.pending:
				try {
					project.state = ProjectStateEnum.deleted;

					await project.save();
					return {
						message: "Project deleted successfully",
					};
				} catch (error) {
					throw CustomError.internalServer(`${error}`);
				}

			case ProjectStateEnum.created:
				throw CustomError.badRequest(
					"To delete a Project you need to request it first"
				);
		}
	}

	async sendProjectCollaborationInvitation(shareProjectDto: ShareProjectDto) {
		const project = await ProjectModel.findOne({
			_id: shareProjectDto.projectId,
		});
		if (!project) throw CustomError.badRequest("Project does not exists");

		const finalCollaboratorsList = new Set<string>();

		for (const email of shareProjectDto.collaborators) {
			const existUser = await UserModel.findOne({ email });

			if (!existUser || !project.collaborators.length) {
				finalCollaboratorsList.add(email);
				continue;
			}

			if (project.owner.equals(existUser.id)) continue;
			if (project.collaborators.includes(existUser.id)) continue;

			finalCollaboratorsList.add(email);
		}

		if (!finalCollaboratorsList.size)
			throw CustomError.badRequest("No new collaborators to invite");

		finalCollaboratorsList.forEach((collaborator) => {
			this.sendEmailInvitationLink({
				email: collaborator,
				senderId: shareProjectDto.senderId,
				projectId: shareProjectDto.projectId,
			});
		});

		return {
			message: "Project shared successfully to new collaborators",
			request: finalCollaboratorsList,
		};
	}

	async getProjectSharingLink(shareProjectDto: ShareProjectLinkDto) {
		const { senderId, projectId } = shareProjectDto;
		const project = await ProjectModel.findOne({
			_id: shareProjectDto.projectId,
		});
		if (!project) throw CustomError.badRequest("Project does not exists");

		const token = await jwtAdapter.generateToken(
			{ senderId: senderId, projectId: projectId },
			"7d"
		);
		if (!token) throw CustomError.internalServer("Error getting token");
		const link = `${this.frontEndUrl}/projects/share/?token=${token}`;

		return {
			message: "Successfully created project sharing link",
			shareLink: link,
		};
	}

	async addCollaboratorToProject(token: string, requester: string) {
		const payload = await jwtAdapter.validateToken(token);
		if (!payload) throw CustomError.unauthorized("Invalid token");

		const { recipient, senderId, projectId } = payload as {
			recipient: string;
			senderId: string;
			projectId: string;
		};

		const recepientEmail = recipient ? recipient : requester;

		if (!projectId)
			throw CustomError.internalServer("Project Id does not exists");

		if (!senderId) throw CustomError.internalServer("Owner user not in token");

		const project = await ProjectModel.findOne({ _id: projectId });
		if (!project) throw CustomError.badRequest("Project does not exists");

		const user = await UserModel.findOne({ email: recepientEmail });

		if (!user)
			throw CustomError.internalServer("User must be registered first");

		if (project.owner.equals(user._id))
			throw CustomError.badRequest("Owner cannot be collaborator");

		if (project.collaborators.includes(user._id))
			throw CustomError.badRequest("User is already a collaborator");

		if (project.state === ProjectStateEnum.deleted)
			throw CustomError.badRequest("Project does not exists - deleted");

		try {
			project.collaborators.push(user._id);
			await project.save();

			const projectEntity = ProjectEntity.fromObject(project);

			return {
				message: "User added as collaborator successfully",
				project: projectEntity,
			};
		} catch (error) {
			throw CustomError.internalServer(`${error}`);
		}
	}

	async getProjectFromInvitationToken(token: string) {
		const payload = await jwtAdapter.validateToken(token);
		if (!payload) throw CustomError.unauthorized("Invalid token");

		const { senderId, projectId } = payload as {
			recipient: string;
			senderId: string;
			projectId: string;
		};

		if (!projectId)
			throw CustomError.internalServer("Project Id does not exists");

		if (!senderId) throw CustomError.internalServer("Owner user not in token");

		const project = await ProjectModel.findOne({ _id: projectId });
		if (!project) throw CustomError.badRequest("Project does not exists");

		return {
			project: project,
		};
	}

	async requestProjectDeletion(
		createDelitionRequestDto: CreateDeletionRequestDto
	) {
		const project = await ProjectModel.findOne({
			_id: createDelitionRequestDto.project,
		});
		if (!project) throw CustomError.badRequest("Project not exists");

		const request = await DeletionRequestModel.findOne({
			project: createDelitionRequestDto.project,
		});
		if (request)
			throw CustomError.badRequest("Deletion request is alredy created");

		try {
			const delitionRequest = new DeletionRequestModel(
				createDelitionRequestDto
			);
			await delitionRequest.save();
			const delitionRequestEntity =
				DelitionRequestEntity.fromObject(delitionRequest);

			project.state = ProjectStateEnum.pending;
			await project.save();

			return {
				message: "Delition request was successful",
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

	async removeCollaborator(projectId: string, userId: string) {
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
