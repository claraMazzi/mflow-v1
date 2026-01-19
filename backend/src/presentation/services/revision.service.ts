import mongoose from "mongoose";
import { VersionModel, VerifierRequestModel, RevisionModel, ProjectModel } from "../../data";
import { CustomError } from "../../domain";
import { RequestRevisionDto } from "../../domain/dtos/revision/request-revision.dto";
import { VersionImageModel } from "../../data/mongo/models/version-image.model";

type RevisionState = "PENDIENTE" | "EN CURSO" | "FINALIZADA";

export type Correction = {
	_id?: string;
	description: string;
	location: {
		x: number;
		y: number;
		page: number;
	};
	multimediaFilePath?: string;
};

export class RevisionService {
	async getRevisionsByState(verifierId: string, state: RevisionState) {
		try {
			// Get revisions for this verifier with the specified state
			const revisions = await RevisionModel.find({
				verifier: new mongoose.Types.ObjectId(verifierId),
				state: state,
			})
				.populate({
					path: "version",
					select: "title",
				})
				.populate({
					path: "verifierRequest",
					populate: {
						path: "requestingUser",
						select: "name lastName email",
					},
				})
				.sort({ createdAt: -1 })
				.lean();

			// For each revision, find the project that contains the version
			const revisionsWithProject = await Promise.all(
				revisions.map(async (revision: any) => {
					const project = await ProjectModel.findOne({
						versions: revision.version?._id,
					})
						.populate("owner", "name lastName email")
						.select("title owner")
						.lean();

					return {
						id: revision._id.toString(),
						project: project
							? {
									id: project._id.toString(),
									name: project.title,
							  }
							: null,
						version: revision.version
							? {
									id: revision.version._id.toString(),
									title: revision.version.title,
							  }
							: null,
						requestingUser: revision.verifierRequest?.requestingUser
							? {
									id: revision.verifierRequest.requestingUser._id.toString(),
									name: `${revision.verifierRequest.requestingUser.name} ${revision.verifierRequest.requestingUser.lastName}`,
									email: revision.verifierRequest.requestingUser.email,
							  }
							: null,
						projectOwner: project?.owner
							? {
									id: (project.owner as any)._id.toString(),
									name: `${(project.owner as any).name} ${(project.owner as any).lastName}`,
									email: (project.owner as any).email,
							  }
							: null,
						state: revision.state,
						finalReview: revision.finalReview,
						createdAt: revision.createdAt,
						updatedAt: revision.updatedAt,
						finishedAt: revision.state === "FINALIZADA" ? revision.updatedAt : null,
					};
				})
			);

			return {
				count: revisionsWithProject.length,
				revisions: revisionsWithProject,
			};
		} catch (error) {
			console.error("Error fetching revisions:", error);
			throw CustomError.internalServer(
				"Se ha producido un error al obtener las revisiones."
			);
		}
	}

	async requestRevision(dto: RequestRevisionDto): Promise<{ message: string }> {
		// Find the version
		const version = await VersionModel.findById(dto.versionId).exec();
		if (!version) {
			throw CustomError.notFound("La versión especificada no existe.");
		}

		// Check if version is in "FINALIZADA" state
		if (version.state !== "FINALIZADA") {
			throw CustomError.badRequest(
				"Solo se puede solicitar revisión de una versión que se encuentra en estado 'FINALIZADA'."
			);
		}

		try {
			if (dto.assignRandomVerifier) {
				// Create VerifierRequest (user wants random verifier assignment)
				const verifierRequest = new VerifierRequestModel({
					requestingUser: new mongoose.Types.ObjectId(dto.requestingUserId),
					reviewer: null,
					assignedVerifier: null,
					version: new mongoose.Types.ObjectId(dto.versionId),
					state: "PENDIENTE",
					assignedAt: null,
				});
				await verifierRequest.save();
			} else if (dto.selectedVerifierId) {
				// Create Revision directly with selected verifier
				const revision = new RevisionModel({
					verifierRequest: null,
					verifier: new mongoose.Types.ObjectId(dto.selectedVerifierId),
					version: new mongoose.Types.ObjectId(dto.versionId),
					finalReview: "",
					state: "PENDIENTE",
					corrections: [],
				});
				await revision.save();

				// Update version with revision reference
				version.revision = revision._id as mongoose.Types.ObjectId;
			}

			// Update version state to "PENDIENTE DE REVISION"
			version.state = "PENDIENTE DE REVISION";
			await version.save();

			return {
				message: "La solicitud de revisión fue creada exitosamente.",
			};
		} catch (error) {
			console.error("Error requesting revision:", error);
			throw CustomError.internalServer(
				"Se ha producido un error, por favor inténtelo de nuevo más tarde."
			);
		}
	}

	async getRevisionById(revisionId: string, userId: string) {
		try {
			const revision = await RevisionModel.findById(revisionId)
				.populate({
					path: "version",
					select: "title conceptualModel state",
				})
				.populate({
					path: "verifier",
					select: "name lastName email",
				})
				.lean();

			if (!revision) {
				throw CustomError.notFound("La revisión especificada no existe.");
			}

			// Check if the user is the verifier
			if (!new mongoose.Types.ObjectId(userId).equals(revision.verifier._id)) {
				throw CustomError.forbidden(
					"No tiene permisos para acceder a esta revisión."
				);
			}

			// Get image infos for the version
			const imageInfos = await VersionImageModel.find({
				version: (revision.version as any)._id,
			})
				.select("url sizeInBytes originalFilename createdAt")
				.lean();

			// Find the project that contains the version
			const project = await ProjectModel.findOne({
				versions: (revision.version as any)._id,
			})
				.select("title owner")
				.populate("owner", "name lastName email")
				.lean();

			return {
				revision: {
					id: (revision._id as mongoose.Types.ObjectId).toString(),
					state: revision.state,
					finalReview: revision.finalReview,
					corrections: (revision.corrections || []).map((c: any) => ({
						_id: c._id?.toString(),
						description: c.description,
						location: c.location,
						multimediaFilePath: c.multimediaFilePath,
					})),
					createdAt: revision.createdAt,
					updatedAt: revision.updatedAt,
					version: {
						id: ((revision.version as any)._id as mongoose.Types.ObjectId).toString(),
						title: (revision.version as any).title,
						state: (revision.version as any).state,
						conceptualModel: (revision.version as any).conceptualModel,
					},
					verifier: {
						id: ((revision.verifier as any)._id as mongoose.Types.ObjectId).toString(),
						name: `${(revision.verifier as any).name} ${(revision.verifier as any).lastName}`,
						email: (revision.verifier as any).email,
					},
					project: project
						? {
								id: (project._id as mongoose.Types.ObjectId).toString(),
								title: project.title,
								owner: {
									id: ((project.owner as any)._id as mongoose.Types.ObjectId).toString(),
									name: `${(project.owner as any).name} ${(project.owner as any).lastName}`,
									email: (project.owner as any).email,
								},
						  }
						: null,
					imageInfos: imageInfos.map((i: any) => ({
						id: i._id.toString(),
						url: i.url,
						sizeInBytes: i.sizeInBytes,
						originalFilename: i.originalFilename,
						createdAt: i.createdAt,
					})),
				},
			};
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			console.error("Error fetching revision:", error);
			throw CustomError.internalServer(
				"Se ha producido un error al obtener la revisión."
			);
		}
	}

	async startRevision(revisionId: string, userId: string) {
		try {
			const revision = await RevisionModel.findById(revisionId);

			if (!revision) {
				throw CustomError.notFound("La revisión especificada no existe.");
			}

			// Check if the user is the verifier
			if (!revision.verifier.equals(userId)) {
				throw CustomError.forbidden(
					"No tiene permisos para iniciar esta revisión."
				);
			}

			// Only allow starting if revision is PENDIENTE
			if (revision.state !== "PENDIENTE") {
				throw CustomError.badRequest(
					"Solo se puede iniciar una revisión que está en estado 'PENDIENTE'."
				);
			}

			revision.state = "EN CURSO";
			await revision.save();

			return {
				message: "La revisión ha sido iniciada exitosamente.",
			};
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			console.error("Error starting revision:", error);
			throw CustomError.internalServer(
				"Se ha producido un error al iniciar la revisión."
			);
		}
	}

	async saveCorrections(
		revisionId: string,
		userId: string,
		corrections: Correction[]
	) {
		try {
			const revision = await RevisionModel.findById(revisionId);

			if (!revision) {
				throw CustomError.notFound("La revisión especificada no existe.");
			}

			// Check if the user is the verifier
			if (!revision.verifier.equals(userId)) {
				throw CustomError.forbidden(
					"No tiene permisos para modificar esta revisión."
				);
			}

			// Only allow modifications if revision is EN CURSO
			if (revision.state !== "EN CURSO") {
				throw CustomError.badRequest(
					"Solo se pueden modificar correcciones de una revisión que está 'EN CURSO'."
				);
			}

			// Update corrections - use findByIdAndUpdate to avoid DocumentArray type issues
			const updatedRevision = await RevisionModel.findByIdAndUpdate(
				revisionId,
				{
					$set: {
						corrections: corrections.map((c) => ({
							description: c.description,
							location: {
								x: c.location.x,
								y: c.location.y,
								page: c.location.page,
							},
							multimediaFilePath: c.multimediaFilePath,
						})),
					},
				},
				{ new: true }
			);

			if (!updatedRevision) {
				throw CustomError.internalServer("Error al actualizar las correcciones.");
			}

			return {
				message: "Las correcciones han sido guardadas exitosamente.",
				corrections: updatedRevision.corrections.map((c: any) => ({
					_id: c._id?.toString(),
					description: c.description,
					location: c.location,
					multimediaFilePath: c.multimediaFilePath,
				})),
			};
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			console.error("Error saving corrections:", error);
			throw CustomError.internalServer(
				"Se ha producido un error al guardar las correcciones."
			);
		}
	}
}

