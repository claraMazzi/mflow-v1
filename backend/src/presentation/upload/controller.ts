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

	getVersionResource = (req: Request, res: Response) => {
		const { versionId, propertyPath } = req.params;

		//TODO: ADD AUTHORIZATION CHECK

		try {
			const filePath = this.uploadService.getVersionResourceFilePath({
				versionId,
				propertyPath,
			});
            
            res.sendFile(filePath)
		} catch (error) {
			this.handleError(error, res);
		}
	};
}
