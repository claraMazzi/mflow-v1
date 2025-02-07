import { Request, Response } from "express";
import { CustomError } from "../../domain";
import { ProjectService } from "../services"; // Assume a service layer is used for business logic

export class ProjectController {
  constructor(readonly projectService: ProjectService) {}

  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.log(`${error}`);
    return res.status(500).json({ error: "Internal server error" });
  };

  // Get a specific project
  getProject = (req: Request, res: Response) => {
    const { projectId } = req.params;
    this.projectService
      .getProject(projectId)
      .then((project) => res.json(project))
      .catch((error) => this.handleError(error, res));
  };

  // Update a specific project
  updateProject = (req: Request, res: Response) => {
    const { projectId } = req.params;
    const projectData = req.body;
    this.projectService
      .updateProject(projectId, projectData)
      .then((updatedProject) => res.json(updatedProject))
      .catch((error) => this.handleError(error, res));
  };

  // Create a new project
  createProject = (req: Request, res: Response) => {
    const projectData = req.body;
    this.projectService
      .createProject(projectData)
      .then((newProject) => res.status(201).json(newProject))
      .catch((error) => this.handleError(error, res));
  };

  // Share a specific project
  shareProject = (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { userId } = req.body;
    this.projectService
      .shareProject(projectId, userId)
      .then(() => res.json({ message: "Project shared successfully" }))
      .catch((error) => this.handleError(error, res));
  };

  // Request project deletion
  requestProjectDeletion = (req: Request, res: Response) => {
    const { projectId } = req.params;
    this.projectService
      .requestProjectDeletion(projectId)
      .then(() => res.json({ message: "Deletion request submitted" }))
      .catch((error) => this.handleError(error, res));
  };

  // Accept or deny collaboration
  handleCollaboration = (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { userId, action } = req.body; // action: accept or deny
    this.projectService
      .handleCollaboration(projectId, userId, action)
      .then(() => res.json({ message: `Collaboration ${action}ed` }))
      .catch((error) => this.handleError(error, res));
  };

  // Remove a collaborator from a project
  removeCollaborator = (req: Request, res: Response) => {
    const { projectId, userId } = req.params;
    this.projectService
      .removeCollaborator(projectId, userId)
      .then(() => res.json({ message: "Collaborator removed successfully" }))
      .catch((error) => this.handleError(error, res));
  };

  // Get deletion request details
  getDeletionDetails = (req: Request, res: Response) => {
    const { projectId } = req.params;
    this.projectService
      .getDeletionDetails(projectId)
      .then((details) => res.json(details))
      .catch((error) => this.handleError(error, res));
  };

  // Approve or reject deletion request
  handleDeletionRequest = (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { action } = req.body; // action: approve or reject
    this.projectService
      .handleDeletionRequest(projectId, action)
      .then(() => res.json({ message: `Deletion request ${action}ed` }))
      .catch((error) => this.handleError(error, res));
  };

  // Get verification status for a project
  getVerificationStatus = (req: Request, res: Response) => {
    const { projectId } = req.params;
    this.projectService
      .getVerificationStatus(projectId)
      .then((status) => res.json(status))
      .catch((error) => this.handleError(error, res));
  };

  // Update verification status for a project
  updateVerificationStatus = (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { status } = req.body; // status: Approved, Rejected, etc.
    this.projectService
      .updateVerificationStatus(projectId, status)
      .then(() => res.json({ message: "Verification status updated" }))
      .catch((error) => this.handleError(error, res));
  };



  
}
