import { Request, Response } from "express";
import { CustomError } from "../../domain";
import { ProjectService } from "../services"; // Assume a service layer is used for business logic
import { CreateProjectDto } from "../../domain/dtos/project/create-project.dto";
import { UpdateProjectDto } from "../../domain/dtos/project/update-project.dto";
import { CreateDeletionRequestDto } from "../../domain/dtos/project/create-deletion-request.dto";
import { ShareProjectDto } from "../../domain/dtos/project/share-project.dto";
import { ShareProjectLinkDto } from "../../domain/dtos/project/share-project-link.dto";

export class ProjectController {
  constructor(readonly projectService: ProjectService) {}

  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.log(`${error}`);
    return res.status(500).json({ error: "Internal server error" });
  };

  getUserProjects = (req: Request, res: Response) => {
    const owner = req.session?.userId ?? "";
    if (!owner) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    this.projectService
      .getUserProjects(owner)
      .then((projects) => res.json(projects))
      .catch((error) => this.handleError(error, res));
  };

  // Get a specific project
  getProjectById = (req: Request, res: Response) => {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(401).json({ error: "No project id provided" });
    }
    const user = req.session?.userId ?? "";
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    this.projectService
      .getProjectById(projectId)
      .then((project) => res.json(project))
      .catch((error) => this.handleError(error, res));
  };

  // Update a specific project
  updateProject = (req: Request, res: Response) => {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(401).json({ error: "No project id provided" });
    }
    const projectData = req.body;
    const user = req.session?.userId ?? "";
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [error, updateProjectDto] = UpdateProjectDto.create({
      id: projectId,
      ...projectData,
    });

    if (error || !updateProjectDto) return res.status(400).json({ error });

    this.projectService
      .updateProject(updateProjectDto)
      .then((updatedProject) => res.json(updatedProject))
      .catch((error) => this.handleError(error, res));
  };

  // "DELETE" project --> mark as deleted
  deleteProject = (req: Request, res: Response) => {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(401).json({ error: "No project id provided" });
    }
    const user = req.session?.userId ?? "";
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    this.projectService
      .deleteProject(projectId)
      .then((updatedProject) => res.json(updatedProject))
      .catch((error) => this.handleError(error, res));
  };

  // Create a new project
  createProject = (req: Request, res: Response) => {
    const projectData = req.body;
    const name = projectData.name;
    const description = projectData.description;
    const owner = req.session?.userId ?? "";
    if (!owner) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [error, createProjectDto] = CreateProjectDto.create({
      name: name,
      description: description,
      owner: owner,
    });

    if (error || !createProjectDto) return res.status(400).json({ error });

    this.projectService
      .createProject(createProjectDto)
      .then((newProject) => res.status(201).json(newProject))
      .catch((error) => this.handleError(error, res));
  };

  // Share a specific project
  sendProjectCollaborationInvitation = (req: Request, res: Response) => {
    const { projectId } = req.params;
    const senderId = req.session?.userId ?? "";
    const { collaborators } = req.body;
    if (!senderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!projectId) {
      return res.status(401).json({ error: "No project id provided" });
    }

    const [error, shareProjectDto] = ShareProjectDto.create({
      projectId,
      senderId,
      collaborators,
    });

    if (error || !shareProjectDto) return res.status(400).json({ error });

    this.projectService
      .sendProjectCollaborationInvitation(shareProjectDto)
      .then(() => res.json({ message: "Project collaboration invitations sent successfully" }))
      .catch((error) => this.handleError(error, res));
  };

  getProjectFromInvitationToken = (req: Request, res: Response) => {
    const { token } = req.params;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    this.projectService
      .getProjectFromInvitationToken(token)
      .then((message) => res.json(message))
      .catch((error) => this.handleError(error, res));
  };


   // Share a specific project
   getProjectSharingLink = (req: Request, res: Response) => {
    const { projectId } = req.params;
    const senderId = req.session?.userId ?? "";
    const { collaborators } = req.body;

    if (!senderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!projectId) {
      return res.status(401).json({ error: "No project id provided" });
    }

    const [error, shareProjectDto] = ShareProjectLinkDto.create({
      projectId,
      senderId,
      collaborators,
    });

    if (error || !shareProjectDto) return res.status(400).json({ error });

    this.projectService
      .getProjectSharingLink(shareProjectDto)
      .then((message) => res.json(message))
      .catch((error) => this.handleError(error, res));
  };

  addCollaboratorToProject = (req: Request, res: Response) => {
    const { token } = req.params;
    const { requester } = req.body;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    this.projectService
      .addCollaboratorToProject(token, requester)
      .then((response) => res.json(response))
      .catch((error) => this.handleError(error, res));
  }

  // Request project deletion
  requestProjectDeletion = (req: Request, res: Response) => {
    const { projectId } = req.params;
    const user = req.session?.userId ?? "";
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!projectId) {
      return res.status(401).json({ error: "No project id provided" });
    }

    const { motive } = req.body;

    const [error, createDelitionRequestDto] = CreateDeletionRequestDto.create({
      project: projectId,
      motive: motive,
      requestingUser: user,
    });

    if (error || !createDelitionRequestDto)
      return res.status(400).json({ error });

    this.projectService
      .requestProjectDeletion(createDelitionRequestDto)
      .then((response) => res.json(response))
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
