import { Request, Router } from "express";
import { UploadService } from "../services";
import { UploadController } from "./controller";
import { envs } from "../../config";
import { FileFilterCallback } from "multer";
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class UploadRoutes {
	static get routes(): Router {
		const router = Router();
    const baseUploadDirectory = `${process.cwd()}/uploads`;

		const service = new UploadService({
      baseUploadDirectory,
			uploadServiceBaseUrl: envs.WEBSERVICE_URL + "/uploads"
		});
		const controller = new UploadController(service);

		// Definir las rutas
		router.get(
			"/:versionId/conceptual-model/:propertyPath",
			controller.getVersionResource
		);

		const multer = require("multer");

		const versionStorage = multer.diskStorage({
			destination: function (
				req: Request,
				file: File,
				cb: (error: Error | null, destination: string) => void
			) {
				const versionId = req.params.versionId;

				if (!versionId) {
					cb(new Error("The version id is missing."), "uploads/errors");
				}

				cb(null, `${baseUploadDirectory}/${versionId}/conceptual-model`);
			},
		});

		const uploadImageMiddleware = multer({
			storage: versionStorage,
			limits: {
				fileSize: 5 * 1024 * 1024, //5 MB
			},
			fileFilter: (req: Request, file: File, cb: FileFilterCallback) => {
				const allowedMIMETypes = ["image/png", "image/jpeg"];
				const versionId = req.params.versionId;

				if (!versionId) {
					cb(new Error("The version id is missing."));
				}

				if (!allowedMIMETypes.includes(file.type)) {
					return cb(null, true);
				} else {
					cb(new Error("Solo está permitida la subida de imágenes."));
				}
			},
		});

		router.post(
			"/:versionId/conceptual-model/:propertyPath",
			AuthMiddleware.validateJWT,
			uploadImageMiddleware.single("uploaded_file"),
			(req, res) => {
				
				return res.send(200);
			}
		);

		return router;
	}
}
