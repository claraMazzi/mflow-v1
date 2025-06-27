// import { CustomError } from "../../domain";
// import { ProjectModel } from "../../data"; // Assuming you have a ProjectModel to interact with the DB

import { ProjectModel } from "../../data";
import { CustomError } from "../../domain";
import { CreateProjectDto } from "../../domain/dtos/project/create-project.dto";
import { UpdateProjectDto } from "../../domain/dtos/project/update-project.dto";
import { ProjectEntity } from "../../domain/entities/project.entity";

export class ProjectService {
  constructor() {
    // If you need any dependencies, inject them here (e.g., email service, etc.)
  }

  async getProjectById(projectId: string) {
    const project = await ProjectModel.findOne({ _id: projectId });
    if (!project) throw CustomError.badRequest("Project not exists");

    if (project.state == "ELIMINADO")
      throw CustomError.badRequest("Project not exists - deleted");

    const projectEntity = ProjectEntity.fromObject(project);

    return {
      user: projectEntity,
    };
  }

  async createProject(createDto: CreateProjectDto) {
    //1. verificar que no exista un proyecto con el mismo nombre
    const existName = await ProjectModel.findOne({ name: createDto.name });
    if (existName) throw CustomError.badRequest("Project name already exists");

    try {
      const project = new ProjectModel(createDto);

      await project.save();

      const projectEntity = ProjectEntity.fromObject(project);

      return { user: projectEntity };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }

  async updateProject(projectData: UpdateProjectDto) {
    const { id, name, description } = projectData;

    const project = await ProjectModel.findOne({ _id: id });
    if (!project) throw CustomError.badRequest("Project does not exists");

    if (!name && !description)
      throw CustomError.badRequest("No data sent to update");

    if (name === project.name && description === project.description)
      throw CustomError.badRequest("Data not updated");

    try {
      if (name) project.name = name;
      if (description) project.description = description;

      project.save();

      const projectEntity = ProjectEntity.fromObject(project)

      return {
        project: projectEntity
      }
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }

  async deleteProject(projectId: string) {
    const project = await ProjectModel.findOne({ _id: projectId });
    if (!project) throw CustomError.badRequest("Project does not exists");
    switch (project.state) {
      case "ELIMINADO":
        throw CustomError.badRequest("Project already deleted");

      case "PENDIENTE DE ELIMINACION":
        try {
          project.state = "ELIMINADO";

          project.save();
          return {
            message: "Project deleted successfully",
          };
        } catch (error) {
          throw CustomError.internalServer(`${error}`);
        }

      case "CREADO":
        throw CustomError.badRequest(
          "To delete a Project you need to request it first"
        );
    }
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
