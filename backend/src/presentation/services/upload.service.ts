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

	// async uploadVersionResource({
	// 	versionId,
	// 	propertyPath,
	// 	file,
	// }: {
	// 	versionId: string;
	// 	propertyPath: string;
	// 	file: Buffer;
	// }): Promise<string> {
	// 	const filePath = `${this.baseUploadDirectory}/${versionId}/conceptual-model/${propertyPath}`;

	// 	await fsPromises.mkdir(path.dirname(filePath), { recursive: true });

	// 	await fsPromises.writeFile(filePath, file);

	// 	await writeFile(filePath, file);

	// 	const newFileUrl = `${this.uploadServiceBaseUrl}/${versionId}/conceptual-model/${propertyPath}`;

	// 	return newFileUrl;
	// }


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

			
			//res.setHeader("Cache-Control", "private, max-age=3600"); // Cache for 1 hour

			return {
				imageInfo: imageInfo,
			}
		} catch (error) {
			//errores no controlados
			console.error("middleware error", error);

			throw CustomError.internalServer("Internal server error");
		}
	}

}
