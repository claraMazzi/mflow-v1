import { DeletionRequestModel, ProjectModel } from "../../data";
import { CustomError } from "../../domain";
import { CreateDeletionRequestDto } from "../../domain/dtos/project/create-deletion-request.dto";
import { CreateProjectDto } from "../../domain/dtos/project/create-project.dto";
import { UpdateProjectDto } from "../../domain/dtos/project/update-project.dto";
import { DelitionRequestEntity } from "../../domain/entities/delition-request.entity";
import { ProjectEntity } from "../../domain/entities/project.entity";
import { EmailService } from "./email.service";

const projectState: {
  created: "CREADO";
  pending: "PENDIENTE DE ELIMINACION";
  deleted: "ELIMINADO";
} = {
  created: "CREADO",
  pending: "PENDIENTE DE ELIMINACION",
  deleted: "ELIMINADO",
};
export class ProjectService {
  constructor(
    private readonly emailService: EmailService,
    private readonly webServiceUrl: string,
    private readonly frontEndUrl: string
  ) {
    // If you need any dependencies, inject them here (e.g., email service, etc.)
       
  }

  //get user active projects
  async getUserProjects(owner: string) {
    const project = await ProjectModel.find({ owner: owner });

    if (!project) throw CustomError.badRequest("User has no Projects");

    const filteredProjects = project
      .map((p) => ProjectEntity.fromObject(p))
      .filter((item) => item.state !== projectState.deleted);

    if (!filteredProjects.length)
      throw CustomError.badRequest("User has no active Projects");

    return {
      count: filteredProjects.length,
      projects: filteredProjects,
    };
  }

  async getProjectById(projectId: string) {
    const project = await ProjectModel.findOne({ _id: projectId });
    if (!project) throw CustomError.badRequest("Project not exists");

    if (project.state == projectState.deleted)
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

      await project.save();

      const projectEntity = ProjectEntity.fromObject(project);

      return {
        project: projectEntity,
      };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }

  async deleteProject(projectId: string) {
    const project = await ProjectModel.findOne({ _id: projectId });
    if (!project) throw CustomError.badRequest("Project does not exists");
    switch (project.state) {
      case projectState.deleted:
        throw CustomError.badRequest("Project already deleted");

      case projectState.pending:
        try {
          project.state = projectState.deleted;

          await project.save();
          return {
            message: "Project deleted successfully",
          };
        } catch (error) {
          throw CustomError.internalServer(`${error}`);
        }

      case projectState.created:
        throw CustomError.badRequest(
          "To delete a Project you need to request it first"
        );
    }
  }

  async shareProject(projectId: string, userId: string) {
    throw new Error("To be implemented");
  }

  async requestProjectDeletion(createDelitionRequestDto: CreateDeletionRequestDto) {
    const project = await ProjectModel.findOne({
      _id: createDelitionRequestDto.project,
    });
    if (!project) throw CustomError.badRequest("Project not exists");

    const request = await DeletionRequestModel.findOne({ project: createDelitionRequestDto.project });
    if (request) throw CustomError.badRequest("Deletion request is alredy created");

    
    try {
      const delitionRequest = new DeletionRequestModel(createDelitionRequestDto);
      await delitionRequest.save();
      const delitionRequestEntity =
        DelitionRequestEntity.fromObject(delitionRequest);

      project.state = projectState.pending;
      await project.save();

      return {
        message: "Delition request was successful",
        request: delitionRequestEntity,
      };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }

  async getDeletionDetails(projectId: string) {
    const request = await DeletionRequestModel.findOne({ project: projectId });
    if (!request) throw CustomError.badRequest("Request doesn't exist ");

    const requestEntity = DelitionRequestEntity.fromObject(request);

    return {
      request: requestEntity,
    };
  }

  async handleCollaboration(projectId: string, userId: string, action: string) {
    throw new Error("To be implemented");
  }

  async removeCollaborator(projectId: string, userId: string) {
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
