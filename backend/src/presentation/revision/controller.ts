import { Request, Response } from "express";
import { CustomError } from "../../domain";
import { RevisionService } from "../services/revision.service";
import { RequestRevisionDto } from "../../domain/dtos/revision/request-revision.dto";

export class RevisionController {
	constructor(readonly revisionService: RevisionService) {}

	private handleError = (error: unknown, res: Response) => {
		if (error instanceof CustomError) {
			return res.status(error.statusCode).json({ error: error.message });
		}

		console.log(`${error}`);
		return res.status(500).json({ error: "Ocurrió un error interno en el servidor." });
	};

	requestRevision = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.status(401).json({ error: "Debe iniciar sesión para solicitar una revisión." });
			}

			const { versionId } = req.params;
			if (!versionId) {
				return res.status(400).json({ error: "El identificador de la versión es obligatorio." });
			}

			const { assignRandomVerifier, selectedVerifierId } = req.body;

			const [error, requestRevisionDto] = RequestRevisionDto.create({
				versionId,
				requestingUserId: userId,
				assignRandomVerifier,
				selectedVerifierId,
			});

			if (error || !requestRevisionDto) {
				return res.status(400).json({ error });
			}

			const result = await this.revisionService.requestRevision(requestRevisionDto);
			return res.status(201).json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
	};
}

