import { Request, Response } from "express";
import { CustomError } from "../../domain";
import { DeletionRequestService } from "../services/deletion-request.service";
import { ApproveDeletionRequestDto } from "../../domain/dtos/deletion-request/approve-deletion-request.dto";
import { DenyDeletionRequestDto } from "../../domain/dtos/deletion-request/deny-deletion-request.dto";

export class DeletionRequestController {
  constructor(readonly deletionRequestService: DeletionRequestService) {}

  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.log(`Deletion Request Controller error: ${error}`);
    return res.status(500).json({ error: "Ha ocurrido un error interno en el servidor." });
  };

  // Get all deletion requests
  getAllDeletionRequests = (req: Request, res: Response) => {
    this.deletionRequestService
      .getAllDeletionRequests()
      .then((result) => res.json(result))
      .catch((error) => this.handleError(error, res));
  };

  // Get a specific deletion request by ID
  getDeletionRequestById = (req: Request, res: Response) => {
    const { deletionRequestId } = req.params;
    if (!deletionRequestId) {
      return res.status(400).json({ error: "Deletion request ID is required" });
    }

    this.deletionRequestService
      .getDeletionRequestById(deletionRequestId)
      .then((result) => res.json(result))
      .catch((error) => this.handleError(error, res));
  };

  // Get deletion requests by project ID
  getDeletionRequestsByProject = (req: Request, res: Response) => {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    this.deletionRequestService
      .getDeletionRequestsByProject(projectId)
      .then((result) => res.json(result))
      .catch((error) => this.handleError(error, res));
  };

  // Get deletion requests by state
  getDeletionRequestsByState = (req: Request, res: Response) => {
    const { state } = req.params;
    if (!state) {
      return res.status(400).json({ error: "State is required" });
    }

    this.deletionRequestService
      .getDeletionRequestsByState(state)
      .then((result) => res.json(result))
      .catch((error) => this.handleError(error, res));
  };

  // Approve a deletion request
  approveDeletionRequest = (req: Request, res: Response) => {
    const { deletionRequestId } = req.params;
    const reviewer = req.session!.userId;
    
    const [error, approveDto] = ApproveDeletionRequestDto.create({
      deletionRequestId,
      reviewer,
    });

    if (error || !approveDto) {
      return res.status(400).json({ error });
    }

    this.deletionRequestService
      .approveDeletionRequest(approveDto)
      .then((result) => res.json(result))
      .catch((error) => this.handleError(error, res));
  };

  // Deny a deletion request
  denyDeletionRequest = (req: Request, res: Response) => {
    const { deletionRequestId } = req.params;
    const reviewer = req.session?.userId ?? "";
    const { reason } = req.body;
    
    if (!reviewer) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!deletionRequestId) {
      return res.status(400).json({ error: "Deletion request ID is required" });
    }

    const [error, denyDto] = DenyDeletionRequestDto.create({
      deletionRequestId,
      reviewer,
      reason,
    });

    if (error || !denyDto) {
      return res.status(400).json({ error });
    }

    this.deletionRequestService
      .denyDeletionRequest(denyDto)
      .then((result) => res.json(result))
      .catch((error) => this.handleError(error, res));
  };
}
