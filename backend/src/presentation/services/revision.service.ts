import mongoose from "mongoose";
import { VersionModel, VerifierRequestModel, RevisionModel } from "../../data";
import { CustomError } from "../../domain";
import { RequestRevisionDto } from "../../domain/dtos/revision/request-revision.dto";

export class RevisionService {
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

