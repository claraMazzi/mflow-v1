import { DeletionRequestModel, ProjectModel, ProjectState, NotificationType } from "../../data";
import { CustomError } from "../../domain";
import { DelitionRequestEntity } from "../../domain/entities/delition-request.entity";
import { ApproveDeletionRequestDto } from "../../domain/dtos/deletion-request/approve-deletion-request.dto";
import { DenyDeletionRequestDto } from "../../domain/dtos/deletion-request/deny-deletion-request.dto";
import { Types } from "mongoose";
import { notificationService } from "./notification.service";

const deletionRequestStates = {
  pending: "PENDIENTE",
  approved: "ACEPTADA",
  rejected: "RECHAZADA",
} as const;


export class DeletionRequestService {
  constructor() {
    // Dependencies can be injected here if needed
  }

  // Get all deletion requests
  async getAllDeletionRequests() {
    try {
      const deletionRequests = await DeletionRequestModel.find()
        .populate({
          path: 'project',
          select: 'title description owner collaborators',
          populate: [
            { path: 'owner', select: 'email name' },
            { path: 'collaborators', select: 'email name' }
          ]
        })
        .populate('requestingUser', 'email name')
        .populate('reviewer', 'email name')
        .exec();

        console.log(
          'SERVER ', deletionRequests
        )
      const deletionRequestEntities = deletionRequests.map((request) =>
        DelitionRequestEntity.fromObject(request)
      );

      return {
        count: deletionRequestEntities.length,
        deletionRequests: deletionRequestEntities,
      };
    } catch (error) {
      throw CustomError.internalServer(`Error fetching deletion requests: ${error}`);
    }
  }

  // Get a specific deletion request by ID
  async getDeletionRequestById(deletionRequestId: string) {
    try {
      const deletionRequest = await DeletionRequestModel.findById(deletionRequestId)
        .populate({
          path: 'project',
          select: 'title description owner collaborators',
          populate: [
            { path: 'owner', select: 'email name' },
            { path: 'collaborators', select: 'email name' }
          ]
        })
        .populate('requestingUser', 'email name')
        .populate('reviewer', 'email name')
        .exec();

        console.log('deletionRequest', deletionRequest)
      if (!deletionRequest) {
        throw CustomError.badRequest("Deletion request not found");
      }

      const deletionRequestEntity = DelitionRequestEntity.fromObject(deletionRequest);

      return {
        deletionRequest: deletionRequestEntity,
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServer(`Error fetching deletion request: ${error}`);
    }
  }

  // Get deletion requests by project ID
  async getDeletionRequestsByProject(projectId: string) {
    try {
      const deletionRequests = await DeletionRequestModel.find({ project: projectId })
        .populate({
          path: 'project',
          select: 'title description owner collaborators',
          populate: [
            { path: 'owner', select: 'email name' },
            { path: 'collaborators', select: 'email name' }
          ]
        })
        .populate('requestingUser', 'email name')
        .populate('reviewer', 'email name')
        .exec();

      const deletionRequestEntities = deletionRequests.map((request) =>
        DelitionRequestEntity.fromObject(request)
      );

      return {
        count: deletionRequestEntities.length,
        deletionRequests: deletionRequestEntities,
      };
    } catch (error) {
      throw CustomError.internalServer(`Error fetching deletion requests for project: ${error}`);
    }
  }

  // Approve a deletion request
  async approveDeletionRequest(approveDto: ApproveDeletionRequestDto) {
    try {
      const { deletionRequestId, reviewer, reviewedAt } = approveDto;

      // Find the deletion request
      const deletionRequest = await DeletionRequestModel.findById(deletionRequestId);
      if (!deletionRequest) {
        throw CustomError.badRequest("Deletion request not found");
      }

      // Check if already processed
      if (deletionRequest.state !== deletionRequestStates.pending) {
        throw CustomError.badRequest("Deletion request has already been processed");
      }

      // Update the deletion request
      deletionRequest.state = deletionRequestStates.approved;
      deletionRequest.reviewer = new Types.ObjectId(reviewer);
      deletionRequest.reviewedAt = reviewedAt;

      await deletionRequest.save();

      // Update the linked project state to ELIMINADO
      const project = await ProjectModel.findById(deletionRequest.project);
      if (project) {
        project.state = ProjectState.DELETED;
        await project.save();
      }

      // Notify the requesting user about the approval
      try {
        const requestingUserId = deletionRequest.requestingUser.toString();
        const projectTitle = project?.title ?? "el proyecto";
        await notificationService.createNotification({
          recipientId: requestingUserId,
          type: NotificationType.DELETION_REQUEST_APPROVED,
          title: "Solicitud de eliminación aprobada",
          message: `Tu solicitud de eliminación del proyecto "${projectTitle}" ha sido aprobada. El proyecto ha sido marcado como eliminado.`,
          link: "/dashboard/deletion-requests",
          relatedProjectId: deletionRequest.project.toString(),
          triggeredById: reviewer,
        });
      } catch (notifError) {
        console.error("Error notifying requesting user of deletion approval:", notifError);
      }

      const deletionRequestEntity = DelitionRequestEntity.fromObject(deletionRequest);

      return {
        message: "Deletion request approved successfully",
        deletionRequest: deletionRequestEntity,
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServer(`Error approving deletion request: ${error}`);
    }
  }

  // Deny a deletion request
  async denyDeletionRequest(denyDto: DenyDeletionRequestDto) {
    try {
      const { deletionRequestId, reviewer, reviewedAt, reason } = denyDto;

      // Find the deletion request
      const deletionRequest = await DeletionRequestModel.findById(deletionRequestId);
      if (!deletionRequest) {
        throw CustomError.badRequest("Deletion request not found");
      }

      // Check if already processed
      if (deletionRequest.state !== deletionRequestStates.pending) {
        throw CustomError.badRequest("Deletion request has already been processed");
      }

      // Update the deletion request
      deletionRequest.state = deletionRequestStates.rejected;
      deletionRequest.reviewer = new Types.ObjectId(reviewer);
      deletionRequest.reviewedAt = reviewedAt;

      await deletionRequest.save();

      // Update the project state back to created
      const project = await ProjectModel.findById(deletionRequest.project);
      if (project) {
        project.state = ProjectState.CREATED;
        await project.save();
      }

      // Notify the requesting user about the denial
      try {
        const requestingUserId = deletionRequest.requestingUser.toString();
        const projectTitle = project?.title ?? "el proyecto";
        const reasonText = reason?.trim() ? ` Motivo: ${reason.trim()}.` : "";
        await notificationService.createNotification({
          recipientId: requestingUserId,
          type: NotificationType.DELETION_REQUEST_DENIED,
          title: "Solicitud de eliminación denegada",
          message: `Tu solicitud de eliminación del proyecto "${projectTitle}" ha sido denegada.${reasonText}`,
          link: "/dashboard/deletion-requests",
          relatedProjectId: deletionRequest.project.toString(),
          triggeredById: reviewer,
        });
      } catch (notifError) {
        console.error("Error notifying requesting user of deletion denial:", notifError);
      }

      const deletionRequestEntity = DelitionRequestEntity.fromObject(deletionRequest);

      return {
        message: "Deletion request denied successfully",
        deletionRequest: deletionRequestEntity,
        reason: reason || "No reason provided",
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServer(`Error denying deletion request: ${error}`);
    }
  }

  // Get deletion requests by state
  async getDeletionRequestsByState(state: string) {
    try {
      const validStates = Object.values(deletionRequestStates);
      if (!validStates.includes(state as any)) {
        throw CustomError.badRequest("Invalid state provided");
      }

      const deletionRequests = await DeletionRequestModel.find({ state })
        .populate({
          path: 'project',
          select: 'title description owner collaborators',
          populate: [
            { path: 'owner', select: 'email name' },
            { path: 'collaborators', select: 'email name' }
          ]
        })
        .populate('requestingUser', 'email name')
        .populate('reviewer', 'email name')
        .exec();

      const deletionRequestEntities = deletionRequests.map((request) =>
        DelitionRequestEntity.fromObject(request)
      );

      return {
        count: deletionRequestEntities.length,
        deletionRequests: deletionRequestEntities,
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServer(`Error fetching deletion requests by state: ${error}`);
    }
  }
}
