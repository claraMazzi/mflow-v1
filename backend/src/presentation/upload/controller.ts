import { Request, Response } from "express";
import { UploadService } from "../services";
import { CustomError } from "../../domain";

export class UploadController {
	constructor(readonly uploadService: UploadService) {}

	private handleError = (error: unknown, res: Response) => {
		if (error instanceof CustomError) {
			return res.status(error.statusCode).json({ error: error.message });
		}

		console.log(`${error}`);
		return res.status(500).json({ error: "Internal server error" });
	};

	getImageById = (req: Request, res: Response) => {
		const imageId = req.params.imageId;
		if (!imageId) {
			throw CustomError.badRequest("No image id provided.");
		}

		this.uploadService
		  .getImageById(imageId)
		  .then((image) => {
			// Serve the actual image file bytes so <Image/> can render it
			res.setHeader("Content-Type", image.imageInfo.mimeType);
			res.setHeader("Cache-Control", "public, max-age=3600, immutable");
			return res.status(200).sendFile(image.imageInfo.path);
		  })
		  .catch((error) => this.handleError(error, res));
	};

	uploadImageDiagaram = (req: Request, res: Response) => {
		const versionId = req.params.versionId;
		const diagramPropertyPath = req.body.diagramPropertyPath;

		if (!diagramPropertyPath) {
			return res.status(400).json({ error: "No property path provided." });
		}

		if (!req.file) {
			console.error(
				`The file info field was unexpectedly undefined - Version Id: ${versionId}.`
			);
			return res.send(500).json({
				error:
					"There was an internal server error while uploading the file.",
			});
		}

		this.uploadService
		  .uploadImageToVersion(versionId, diagramPropertyPath, req.file)
		  .then((uploadedImage) => res.status(201).json(uploadedImage))
		  .catch((error) => this.handleError(error, res));
	  };

	replaceImageDiagram = (req: Request, res: Response) => {
		const versionId = req.params.versionId;
		const diagramPropertyPath = req.body.diagramPropertyPath;

		if (!diagramPropertyPath) {
			return res.status(400).json({ error: "No property path provided." });
		}

		if (!req.file) {
			console.error(
				`The file info field was unexpectedly undefined - Version Id: ${versionId}.`
			);
			return res.send(500).json({
				error:
					"There was an internal server error while uploading the file.",
			});
		}

		this.uploadService
			.replaceImageInVersion(versionId, diagramPropertyPath, req.file)
			.then((result) => res.status(200).json(result))
			.catch((error) => this.handleError(error, res));
	};
	
}
