import { Request, Response } from "express";
import { CustomError } from "../../domain";
import { RevisionService, Correction } from "../services/revision.service";
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

	getRevisionsByState = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.status(401).json({ error: "Debe iniciar sesión para ver las revisiones." });
			}

			const { state } = req.params;
			const validStates = ["PENDIENTE", "EN CURSO", "FINALIZADA"];
			
			if (!state || !validStates.includes(state.toUpperCase())) {
				return res.status(400).json({ 
					error: "El estado debe ser uno de: PENDIENTE, EN CURSO, FINALIZADA." 
				});
			}

			const result = await this.revisionService.getRevisionsByState(
				userId, 
				state.toUpperCase() as "PENDIENTE" | "EN CURSO" | "FINALIZADA"
			);
			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
	};

	getRevisionById = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.status(401).json({ error: "Debe iniciar sesión para ver la revisión." });
			}

			const { revisionId } = req.params;
			if (!revisionId) {
				return res.status(400).json({ error: "El identificador de la revisión es obligatorio." });
			}

			const result = await this.revisionService.getRevisionById(revisionId, userId);
			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
	};

	startRevision = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.status(401).json({ error: "Debe iniciar sesión para iniciar la revisión." });
			}

			const { revisionId } = req.params;
			if (!revisionId) {
				return res.status(400).json({ error: "El identificador de la revisión es obligatorio." });
			}

			const result = await this.revisionService.startRevision(revisionId, userId);
			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
	};

	saveCorrections = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.status(401).json({ error: "Debe iniciar sesión para guardar correcciones." });
			}

			const { revisionId } = req.params;
			if (!revisionId) {
				return res.status(400).json({ error: "El identificador de la revisión es obligatorio." });
			}

			const { corrections } = req.body;
			if (!Array.isArray(corrections)) {
				return res.status(400).json({ error: "Las correcciones deben ser un arreglo." });
			}

			// Validate each correction
			for (let i = 0; i < corrections.length; i++) {
				const correction = corrections[i];
				if (!correction.description || typeof correction.description !== "string") {
					return res.status(400).json({ 
						error: `La corrección ${i + 1} debe tener una descripción válida.` 
					});
				}
				if (!correction.location || 
					typeof correction.location.x !== "number" || 
					typeof correction.location.y !== "number" ||
					typeof correction.location.page !== "number") {
					return res.status(400).json({ 
						error: `La corrección ${i + 1} debe tener una ubicación válida (x, y, page).` 
					});
				}
			}

			const result = await this.revisionService.saveCorrections(
				revisionId, 
				userId, 
				corrections as Correction[]
			);
			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
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

	finalizeRevision = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.status(401).json({ error: "Debe iniciar sesión para finalizar la revisión." });
			}

			const { revisionId } = req.params;
			if (!revisionId) {
				return res.status(400).json({ error: "El identificador de la revisión es obligatorio." });
			}

			const { corrections, finalReview } = req.body;
			if (!Array.isArray(corrections)) {
				return res.status(400).json({ error: "Las correcciones deben ser un arreglo." });
			}

			// Validate each correction
			for (let i = 0; i < corrections.length; i++) {
				const correction = corrections[i];
				if (!correction.description || typeof correction.description !== "string") {
					return res.status(400).json({ 
						error: `La corrección ${i + 1} debe tener una descripción válida.` 
					});
				}
				if (!correction.location || 
					typeof correction.location.x !== "number" || 
					typeof correction.location.y !== "number" ||
					typeof correction.location.page !== "number") {
					return res.status(400).json({ 
						error: `La corrección ${i + 1} debe tener una ubicación válida (x, y, page).` 
					});
				}
			}

			const result = await this.revisionService.finalizeRevision(
				revisionId, 
				userId, 
				corrections as Correction[],
				finalReview
			);
			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
	};
}

