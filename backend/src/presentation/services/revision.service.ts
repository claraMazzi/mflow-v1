import mongoose from "mongoose";
import { VersionModel, VerifierRequestModel, RevisionModel, ProjectModel } from "../../data";
import { CustomError } from "../../domain";
import { RequestRevisionDto } from "../../domain/dtos/revision/request-revision.dto";

type RevisionState = "PENDIENTE" | "EN CURSO" | "FINALIZADA";

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
}

