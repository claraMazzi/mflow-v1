// import { CustomError } from "../../domain";
// import { ProjectModel } from "../../data"; // Assuming you have a ProjectModel to interact with the DB

export class ProjectService {
  constructor() {
    // If you need any dependencies, inject them here (e.g., email service, etc.)
  }

  async getProject(projectId: string) {
    throw new Error("To be implemented");
  }

  async createProject(projectData: any) {
    throw new Error("To be implemented");
  }

  async updateProject(projectId: string, projectData: any) {
    throw new Error("To be implemented");
  }

  async deleteProject(projectId: string) {
    throw new Error("To be implemented");
  }

  async shareProject(projectId: string, userId: string) {
    throw new Error("To be implemented");
  }

  async requestProjectDeletion(projectId: string) {
    throw new Error("To be implemented");
  }

  async handleCollaboration(projectId: string, userId: string, action: string) {
    throw new Error("To be implemented");
  }

  async removeCollaborator(projectId: string, userId: string) {
    throw new Error("To be implemented");
  }

  async getDeletionDetails(projectId: string) {
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
