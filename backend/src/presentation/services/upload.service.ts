import { writeFile } from "fs/promises";
import {
	CustomError,
	PasswordUpdateDto,
	UpdateUserDto,
	UserEntity,
} from "../../domain";
import path from "node:path";
import fsPromises from "fs/promises";
import fs from "fs";
import { SocketServer } from "../socket-server";
import { VersionModel } from "../../data";
import { Diagram } from "../../data/mongo/models/subdocuments-schemas";
import { VersionImageModel } from "../../data/mongo/models/version-image.model";
import { getProperty, setValue } from "../../types/socket-events";
import { existsSync } from "fs";
import { unlink } from "fs/promises";

export class UploadService {
	private readonly baseUploadDirectory: string;
	private readonly uploadServiceBaseUrl: string;
	private readonly socketServer: SocketServer;

	constructor({
		baseUploadDirectory,
		uploadServiceBaseUrl,
		socketServer,
	}: {
		baseUploadDirectory: string;
		uploadServiceBaseUrl: string;
		socketServer: SocketServer;
	}) {
		this.baseUploadDirectory = baseUploadDirectory;
		this.uploadServiceBaseUrl = uploadServiceBaseUrl;
		this.socketServer = socketServer;
	}

	async uploadImageToVersion(versionId: string, diagramPropertyPath: any, file: Express.Multer.File) {
		
		const version = await VersionModel.findById(versionId).exec();

		if (!version) {
			throw CustomError.badRequest("Version not found.");
		}

		const property = getProperty(
			version.conceptualModel,
			diagramPropertyPath
		) as Diagram | undefined;

		if (!property) {
			throw CustomError.badRequest("The specified property path wasn't found in the version.");
		}

		if (
			!("imageFileId" in property) ||
			property["imageFileId"] !== null
		) {
			throw CustomError.conflict("There is an image file already present in the specified path.");
		}

		try {
			const { mimetype, originalname, filename, size, path: filePath } = file;

			const newVersionImage = new VersionImageModel({
				filename,
				originalFilename: originalname,
				sizeInBytes: size,
				mimeType: mimetype,
				path: filePath,
				version: version.id,
			});
			newVersionImage.url = `${this.uploadServiceBaseUrl}/${newVersionImage.id}`;
			await newVersionImage.save();

			const imageIdPropertyPath = `${diagramPropertyPath}.imageFileId`;

			setValue(
				version.conceptualModel!,
				imageIdPropertyPath,
				newVersionImage.id
			);
			await version.save();

			this.socketServer.emitImageFileAdded(versionId, {
				id: newVersionImage.id,
				url: newVersionImage.url,
				originalFilename: newVersionImage.originalFilename,
				sizeInBytes: newVersionImage.sizeInBytes,
				uploadedAt: newVersionImage.createdAt
			});
			this.socketServer.emitFieldUpdate(versionId, {
				value: newVersionImage.id,
				propertyPath: imageIdPropertyPath,
			});
			return {
				updatedVersion: version,
				imageInfo: newVersionImage,
			}
		} catch (error) {
			console.error("Error uploading image to version:", error);
			throw CustomError.internalServer("Error uploading image to version.");
		}
		
	}

	async getImageById(imageId: string) {
		try {
			const imageInfo = await VersionImageModel.findById(imageId);
			if (!imageInfo) {
				throw CustomError.notFound("Image not found on server.");
			}

			if (!existsSync(imageInfo.path)) {
				throw CustomError.notFound("Image file not found on server");
			}

			return {
				imageInfo: imageInfo,
			}
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			console.error("getImageById error", error);
			throw CustomError.internalServer("Internal server error");
		}
	}

	async replaceImageInVersion(
		versionId: string,
		diagramPropertyPath: string,
		file: Express.Multer.File
	) {
		const version = await VersionModel.findById(versionId).exec();

		if (!version) {
			throw CustomError.badRequest("Version not found.");
		}

		const property = getProperty(
			version.conceptualModel,
			diagramPropertyPath
		) as Diagram | undefined;

		if (!property) {
			throw CustomError.badRequest(
				"The specified property path wasn't found in the version."
			);
		}

		if (!("imageFileId" in property) || property["imageFileId"] === null) {
			throw CustomError.conflict(
				"There is no image to replace in the specified path."
			);
		}

		const previousImageId = String(property["imageFileId"]);
		const previousImage = await VersionImageModel.findById(previousImageId);

		try {
			// Create and save the new image first
			const { mimetype, originalname, filename, size, path: filePath } = file;
			const newVersionImage = new VersionImageModel({
				filename,
				originalFilename: originalname,
				sizeInBytes: size,
				mimeType: mimetype,
				path: filePath,
				version: version.id,
			});
			newVersionImage.url = `${this.uploadServiceBaseUrl}/${newVersionImage.id}`;
			await newVersionImage.save();

			// Update conceptual model to point to new image id
			const imageIdPropertyPath = `${diagramPropertyPath}.imageFileId`;
			setValue(version.conceptualModel!, imageIdPropertyPath, newVersionImage.id);
			await version.save();

			// Emit add + field update first so clients swap immediately
			this.socketServer.emitImageFileAdded(versionId, {
				id: newVersionImage.id,
				url: newVersionImage.url,
				originalFilename: newVersionImage.originalFilename,
				sizeInBytes: newVersionImage.sizeInBytes,
				uploadedAt: newVersionImage.createdAt
			});
			this.socketServer.emitFieldUpdate(versionId, {
				value: newVersionImage.id,
				propertyPath: imageIdPropertyPath,
			});

			// Clean up previous image (best-effort)
			if (previousImage) {
				try {
					if (previousImage.path && existsSync(previousImage.path)) {
						await unlink(previousImage.path);
					}
				} catch (e) {
					console.warn(
						`Failed to remove previous image file from disk: ${previousImage.path}`
					);
				}
				await previousImage.deleteOne();
				this.socketServer.emitImageFileRemoved(versionId, {
					imageId: previousImageId,
				});
			}

			return {
				updatedVersion: version,
				imageInfo: newVersionImage,
			};
		} catch (error) {
			console.error("Error replacing image in version:", error);
			throw CustomError.internalServer("Error replacing image in version.");
		}
	}

}
