import { Request, Router } from "express";
import { UploadService } from "../services";
import { UploadController } from "./controller";
import { envs } from "../../config";
import { FileFilterCallback } from "multer";
import { CheckVersionAccessMiddleware } from "../middlewares/checkVersionAccess.middleware";
import { SocketServer } from "../socket-server";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs";
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class UploadRoutes {
	private socketServer: SocketServer;

	constructor({ socketServer }: { socketServer: SocketServer }) {
		this.socketServer = socketServer;
	}

	get routes(): Router {
		const router = Router();
		const baseUploadDirectory = `${process.cwd()}/uploads`;

		const service = new UploadService({
			baseUploadDirectory,
			uploadServiceBaseUrl: envs.WEBSERVICE_URL + "/api/uploads",
			socketServer: this.socketServer,
		});
		const controller = new UploadController(service);

	
		const multer = require("multer");

		const versionStorage = multer.diskStorage({
			destination: function (
				req: Request,
				file: Express.Multer.File,
				cb: (error: Error | null, destination: string) => void
			) {
				const versionId = req.params.versionId;

				if (!versionId) {
					cb(new Error("The version id is missing."), "uploads/errors");
				}

				const destination = `${baseUploadDirectory}/${versionId}/conceptual-model`;
				try {
					fs.mkdirSync(destination, { recursive: true });
					cb(null, destination);
				} catch (err: any) {
					cb(err, destination);
				}
			},
			filename: (req: Request, file: Express.Multer.File, cb: any) => {
				const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
				cb(null, uniqueName);
			},
		});

		const uploadImageMiddleware = multer({
			storage: versionStorage,
			limits: {
				fileSize: 5 * 1024 * 1024, //5 MB
			},
			fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
				const allowedMIMETypes = ["image/png", "image/jpeg", "image/jpg"];
				const versionId = req.params.versionId;

				if (!versionId) {
					return cb(new Error("The version id is missing."));
				}

				const mime = file.mimetype?.toLowerCase() || "";
				if (!allowedMIMETypes.includes(mime)) {
					return cb(new Error("Solo está permitida la subida de imágenes."));
				}
				return cb(null, true);
			},
		});

		const versionAccessMiddleware = new CheckVersionAccessMiddleware({
			socketServer: this.socketServer,
		});

		//upload image to version 
		router.post(
			"/:versionId/diagrams",
			AuthMiddleware.validateJWT,
			versionAccessMiddleware.checkVersionExists,
			versionAccessMiddleware.checkVersionAccessForUploading,
			versionAccessMiddleware.checkIsEditorInCollaborationRoom,
			uploadImageMiddleware.single("image"),
			controller.uploadImageDiagaram
		);
		// replace existing image in version
		router.put(
			"/:versionId/diagrams/replace",
			AuthMiddleware.validateJWT,
			versionAccessMiddleware.checkVersionExists,
			versionAccessMiddleware.checkVersionAccessForUploading,
			versionAccessMiddleware.checkIsEditorInCollaborationRoom,
			uploadImageMiddleware.single("image"),
			controller.replaceImageDiagram
		);
		router.get("/:imageId", controller.getImageById);


		return router;
	}
}
