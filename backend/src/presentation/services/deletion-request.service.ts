import {
	DeletionRequestModel,
	ProjectModel,
	DeletionRequestState,
	NotificationType,
	DELETION_REQUEST_STATES,
	ProjectState,
} from "../../data";
import { CustomError } from "../../domain";
import { DelitionRequestEntity } from "../../domain/entities/delition-request.entity";
import { ApproveDeletionRequestDto } from "../../domain/dtos/deletion-request/approve-deletion-request.dto";
import { DenyDeletionRequestDto } from "../../domain/dtos/deletion-request/deny-deletion-request.dto";
import { Types } from "mongoose";
import { notificationService } from "./notification.service";

export class DeletionRequestService {
	constructor() {
		// Dependencies can be injected here if needed
	}

	// Get all deletion requests
	async getAllDeletionRequests() {
		try {
			const deletionRequests = await DeletionRequestModel.find()
				.sort({ registeredAt: "asc" })
				.populate({
					path: "project",
					select: "title description owner collaborators",
					populate: [
						{ path: "owner", select: "email name lastName" },
						{ path: "collaborators", select: "email name lastName" },
					],
				})
				.populate("requestingUser", "email name lastName")
				.populate("reviewer", "email name lastName")
				.lean()
				.exec();

			const deletionRequestEntities = deletionRequests.map((request) =>
				DelitionRequestEntity.fromObject(request),
			);

			return {
				count: deletionRequestEntities.length,
				deletionRequests: deletionRequestEntities,
			};
		} catch (error) {
			console.error(`Error fetching deletion requests: ${error}`);
			throw CustomError.internalServer(
				`Ha ocurrido un error al obtener las solicitudes de eliminación.`,
			);
		}
	}

	// Get a specific deletion request by ID
	async getDeletionRequestById(deletionRequestId: string) {
		try {
			const deletionRequest = await DeletionRequestModel.findById(
				deletionRequestId,
			)
				.populate({
					path: "project",
					select: "title description owner collaborators",
					populate: [
						{ path: "owner", select: "email name" },
						{ path: "collaborators", select: "email name" },
					],
				})
				.populate("requestingUser", "email name")
				.populate("reviewer", "email name")
				.exec();

			console.log("deletionRequest", deletionRequest);
			if (!deletionRequest) {
				throw CustomError.badRequest("Deletion request not found");
			}

			const deletionRequestEntity =
				DelitionRequestEntity.fromObject(deletionRequest);

			return {
				deletionRequest: deletionRequestEntity,
			};
		} catch (error) {
			if (error instanceof CustomError) throw error;
			throw CustomError.internalServer(
				`Error fetching deletion request: ${error}`,
			);
		}
	}

	// Get deletion requests by project ID
	async getDeletionRequestsByProject(projectId: string) {
		try {
			const deletionRequests = await DeletionRequestModel.find({
				project: projectId,
			})
				.populate({
					path: "project",
					select: "title description owner collaborators",
					populate: [
						{ path: "owner", select: "email name" },
						{ path: "collaborators", select: "email name" },
					],
				})
				.populate("requestingUser", "email name")
				.populate("reviewer", "email name")
				.exec();

			const deletionRequestEntities = deletionRequests.map((request) =>
				DelitionRequestEntity.fromObject(request),
			);

			return {
				count: deletionRequestEntities.length,
				deletionRequests: deletionRequestEntities,
			};
		} catch (error) {
			throw CustomError.internalServer(
				`Error fetching deletion requests for project: ${error}`,
			);
		}
	}

	// Approve a deletion request
	async approveDeletionRequest(approveDto: ApproveDeletionRequestDto) {
		const { deletionRequestId, reviewer, reviewedAt } = approveDto;

		// Find the deletion request
		const deletionRequest =
			await DeletionRequestModel.findById(deletionRequestId);
		if (!deletionRequest) {
			throw CustomError.notFound(
				"No se pudo encontrar la solicitud de eliminación.",
			);
		}

		// Check if already processed
		if (deletionRequest.state !== DeletionRequestState.PENDING) {
			throw CustomError.conflict(
				"La solicitud de eliminación ya ha sido evaluada.",
			);
		}

		let projectTitle = "";

		try {
			// Update Deletion Request
			deletionRequest.state = DeletionRequestState.APPROVED;
			deletionRequest.reviewer = new Types.ObjectId(reviewer);
			deletionRequest.reviewedAt = reviewedAt;

			// Save with session
			await deletionRequest.save();

			// Update Project
			const project = await ProjectModel.findById(deletionRequest.project);
			projectTitle = project!.title;
			project!.state = ProjectState.DELETED;
			await project!.save();
		} catch (error) {
			console.error(`Error approving deletion request: ${error}`);
			throw CustomError.internalServer(
				"Se ha producido un error al aprobar la solicitud de eliminación. Por favor, inténtelo de nuevo más tarde.",
			);
		}

		try {
			const requestingUserId = deletionRequest.requestingUser.toString();
			await notificationService.createNotification({
				recipientId: requestingUserId,
				type: NotificationType.DELETION_REQUEST_APPROVED,
				title: "Solicitud de eliminación aprobada",
				message: `Tu solicitud de eliminación del proyecto "${projectTitle}" ha sido aprobada. El proyecto ha sido marcado como eliminado.`,
				// link: "/dashboard/",
				relatedProjectId: deletionRequest.project.toString(),
				triggeredById: reviewer,
			});
		} catch (notifError) {
			console.error(
				"Error notifying requesting user of deletion approval:",
				notifError,
			);
		}

		const deletionRequestEntity =
			DelitionRequestEntity.fromObject(deletionRequest);

		return {
			message: "La solicitud de eliminación se ha aprobado exitosamente.",
			deletionRequest: deletionRequestEntity,
		};
	}

	async denyDeletionRequest(denyDto: DenyDeletionRequestDto) {
		const { deletionRequestId, reviewer, reviewedAt } = denyDto;

		const deletionRequest =
			await DeletionRequestModel.findById(deletionRequestId);
		if (!deletionRequest) {
			throw CustomError.notFound(
				"No se pudo encontrar la solicitud de eliminación.",
			);
		}

		if (deletionRequest.state !== DeletionRequestState.PENDING) {
			throw CustomError.conflict(
				"La solicitud de eliminación ya ha sido evaluada.",
			);
		}

		let projectTitle = "";

		try {
			deletionRequest.state = DeletionRequestState.DENIED;
			deletionRequest.reviewer = new Types.ObjectId(reviewer);
			deletionRequest.reviewedAt = reviewedAt;
			await deletionRequest.save();

			const project = await ProjectModel.findById(deletionRequest.project);
			projectTitle = project!.title;
			project!.state = ProjectState.CREATED;
			await project!.save();
		} catch (error) {
			console.error(`Error denying deletion request: ${error}`);
			throw CustomError.internalServer(
				"Se ha producido un error al denegar la solicitud de eliminación. Por favor, inténtelo de nuevo más tarde.",
			);
		}

		try {
			const requestingUserId = deletionRequest.requestingUser.toString();
			await notificationService.createNotification({
				recipientId: requestingUserId,
				type: NotificationType.DELETION_REQUEST_DENIED,
				title: "Solicitud de eliminación denegada",
				message: `Tu solicitud de eliminación del proyecto "${projectTitle}" ha sido denegada.`,
				relatedProjectId: deletionRequest.project.toString(),
				triggeredById: reviewer,
			});
		} catch (notifError) {
			console.error(
				"Error notifying requesting user of deletion denial:",
				notifError,
			);
		}

		const deletionRequestEntity =
			DelitionRequestEntity.fromObject(deletionRequest);

		return {
			message: "La solicitud de eliminación ha sido denegada exitosamente.",
			deletionRequest: deletionRequestEntity,
		};
	}

	// Get deletion requests by state
	async getDeletionRequestsByState(state: string) {
		try {
			if (!DELETION_REQUEST_STATES.includes(state as any)) {
				throw CustomError.badRequest("Invalid state provided");
			}

			const deletionRequests = await DeletionRequestModel.find({ state })
				.populate({
					path: "project",
					select: "title description owner collaborators",
					populate: [
						{ path: "owner", select: "email name" },
						{ path: "collaborators", select: "email name" },
					],
				})
				.populate("requestingUser", "email name")
				.populate("reviewer", "email name")
				.exec();

			const deletionRequestEntities = deletionRequests.map((request) =>
				DelitionRequestEntity.fromObject(request),
			);

			return {
				count: deletionRequestEntities.length,
				deletionRequests: deletionRequestEntities,
			};
		} catch (error) {
			if (error instanceof CustomError) throw error;
			throw CustomError.internalServer(
				`Error fetching deletion requests by state: ${error}`,
			);
		}
	}
}
