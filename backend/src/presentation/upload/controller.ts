import path from "node:path";
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
			return this.handleError(
				CustomError.badRequest("No image id provided."),
				res
			);
		}

		this.uploadService
		  .getImageById(imageId)
		  .then((image) => {
				const filePath = image.resolvedFilePath;
				const ext = path.extname(filePath).toLowerCase();
				const mimeFromExt =
					ext === ".png"
						? "image/png"
						: ext === ".jpg" || ext === ".jpeg"
							? "image/jpeg"
							: null;
				const contentType =
					image.imageInfo.mimeType?.trim() || mimeFromExt || "image/png";
				res.setHeader("Content-Type", contentType);
				res.setHeader("Cache-Control", "public, max-age=3600, immutable");
				res.status(200).sendFile(filePath, (err) => {
					if (err) {
						console.error("sendFile failed for image", imageId, err);
						if (!res.headersSent) {
							this.handleError(
								CustomError.internalServer("Failed to send image file."),
								res
							);
						}
					}
				});
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
