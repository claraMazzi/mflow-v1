import { Request, Response } from "express";
import { CustomError } from "../../domain";
import { ProjectService, VersionService } from "../services"; // Assume a service layer is used for business logic
import { CreateProjectDto } from "../../domain/dtos/project/create-project.dto";
import { UpdateProjectDto } from "../../domain/dtos/project/update-project.dto";
import { CreateDeletionRequestDto } from "../../domain/dtos/project/create-deletion-request.dto";
import { ShareProjectDto } from "../../domain/dtos/project/share-project.dto";
import { ShareProjectLinkDto } from "../../domain/dtos/project/share-project-link.dto";

export class VersionController {
	constructor(readonly versionService: VersionService) {}

	private handleError = (error: unknown, res: Response) => {
		if (error instanceof CustomError) {
			return res.status(error.statusCode).json({ error: error.message });
		}

		console.log(`${error}`);
		return res.status(500).json({ error: "Ocurrió un error interno en el servidor." });
	};



	
}
