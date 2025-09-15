import { Request, Router } from "express";
import { UploadService } from "../services";
import { UploadController } from "./controller";
import { envs } from "../../config";
import { FileFilterCallback } from "multer";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { CheckVersionAccessMiddleware } from "../middlewares/checkVersionAccess.middleware";
import { VersionImageModel } from "../../data/mongo/models/version-image.model";
import { Server as SocketIO } from "socket.io";
import { CollaborationRoom } from "../collaboration/collaborationRoom";
import { existsSync } from "fs";
import { VersionModel } from "../../data";
import { setValue } from "../../types/socket-events";

export class UploadRoutes {
	private socketServer: SocketIO;
	private activeCollaborationRooms: Map<string, CollaborationRoom>;

	constructor({
		socketServer,
		activeCollaborationRooms,
	}: {
		socketServer: SocketIO;
		activeCollaborationRooms: Map<string, CollaborationRoom>;
	}) {
		this.socketServer = socketServer;
		this.activeCollaborationRooms = activeCollaborationRooms;
	}

	get routes(): Router {
		const router = Router();
		const baseUploadDirectory = `${process.cwd()}/uploads`;

		const service = new UploadService({
			baseUploadDirectory,
			uploadServiceBaseUrl: envs.WEBSERVICE_URL + "/uploads",
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

		const versionAccessMiddleware = new CheckVersionAccessMiddleware({
			activeCollaborationRooms: this.activeCollaborationRooms,
		});

		router.post(
			"uploads/:versionId",
			AuthMiddleware.validateJWT,
			(req, res, next) => {
				const versionId = req.params.versionId;
				const propertyPath = req.body.propertyPath;

				if (!versionId) {
					return res.status(400).json({ error: "No version id provided." });
				}

				if (!propertyPath) {
					return res.status(400).json({ error: "No property path provided." });
				}

				next();
			},
			versionAccessMiddleware.checkVersionAccessForUploading,
			versionAccessMiddleware.checkIsEditorInCollaborationRoom,
			uploadImageMiddleware.single("image"),
			async (req, res) => {
				const versionId = req.params.versionId;
				const propertyPath = req.body.propertyPath;

				if (!req.file) {
					console.error(
						`The file info field was unexpectedly undefined - Version Id: ${versionId}.`
					);
					return res.send(500).json({
						error:
							"There was an internal server error while uploading the file.",
					});
				}

				const { mimetype, originalname, filename, size, path } = req.file;

				const newVersionImage = new VersionImageModel({
					filename,
					originalFilename: originalname,
					sizeInBytes: size,
					path,
					mimeType: mimetype,
				});
				await newVersionImage.save();

				const version = await VersionModel.findById(versionId).exec();

				if (!version) {
					return res.status(400).json({ error: "Version not found." });
				}

				const newImageUrl = `uploads/${newVersionImage.id}`;

				setValue(version.conceptualModel!, propertyPath, "newImage");
				await version.save();

				this.socketServer.emit(versionId);

				this.socketServer.to(versionId).emit("field-update", {
					propertyPath: propertyPath,
					value: newImageUrl,
				});

				return res.send(200);
			}
		);

		router.get(
			"uploads/:imageId",
			AuthMiddleware.validateJWT,
			async (req, res) => {
				const imageId = req.params.imageId;
				const userId = req.session?.userId!;

				try {
					if (!imageId) {
						return res.status(400).json({ error: "No image id provided." });
					}

					const imageInfo = await VersionImageModel.findById(imageId);
					if (!imageInfo) {
						return res.status(404).json({
							error: "Image not found on server.",
						});
					}

					if (!existsSync(imageInfo.path)) {
						return res
							.status(404)
							.json({ error: "Image file not found on server" });
					}

					res.setHeader("Content-Type", imageInfo.mimeType);
					//res.setHeader("Cache-Control", "private, max-age=3600"); // Cache for 1 hour

					res.status(200).sendFile(imageInfo.path);
				} catch (error) {
					//errores no controlados
					console.error("middleware error", error);

					res.status(500).json({ error: "Internal server error" });
				}
			}
		);

		return router;
	}
}
