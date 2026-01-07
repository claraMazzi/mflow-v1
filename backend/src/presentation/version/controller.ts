import { Request, Response } from "express";
import { CustomError, CreateVersionDto } from "../../domain";
import { VersionService } from "../services";

export class VersionController {
	constructor(readonly versionService: VersionService) {}

	private handleError = (error: unknown, res: Response) => {
		if (error instanceof CustomError) {
			return res.status(error.statusCode).json({ error: error.message });
		}

		console.log(`${error}`);
		return res.status(500).json({ error: "Ocurrió un error interno en el servidor." });
	};

	createVersion = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.status(401).json({ error: "Debe iniciar sesión para crear una versión." });
			}

			const { title, projectId, parentVersionId, migrateTodoItems } = req.body;

			const [error, createVersionDto] = CreateVersionDto.create({
				title,
				projectId,
				parentVersionId,
				migrateTodoItems,
			});

			if (error || !createVersionDto) {
				return res.status(400).json({ error });
			}

			const result = await this.versionService.createVersion(createVersionDto);
			return res.status(201).json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
	};

	deleteVersion = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.status(401).json({ error: "Debe iniciar sesión para eliminar una versión." });
			}

			const { versionId } = req.params;
			if (!versionId) {
				return res.status(400).json({ error: "El identificador de la versión es obligatorio." });
			}

			const result = await this.versionService.deleteVersion({
				versionId,
				userId,
			});

			return res.json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
	};
}
