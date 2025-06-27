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

export class UploadService {
	private readonly baseUploadDirectory: string;
	private readonly uploadServiceBaseUrl: string;

	constructor({
		baseUploadDirectory,
		uploadServiceBaseUrl,
	}: {
		baseUploadDirectory: string;
		uploadServiceBaseUrl: string;
	}) {
		this.baseUploadDirectory = baseUploadDirectory;
		this.uploadServiceBaseUrl = uploadServiceBaseUrl;
	}

	async uploadVersionResource({
		versionId,
		propertyPath,
		file,
	}: {
		versionId: string;
		propertyPath: string;
		file: Buffer;
	}): Promise<string> {
		const filePath = `${this.baseUploadDirectory}/${versionId}/conceptual-model/${propertyPath}`;

		await fsPromises.mkdir(path.dirname(filePath), { recursive: true });

		await fsPromises.writeFile(filePath, file);

		await writeFile(filePath, file);

		const newFileUrl = `${this.uploadServiceBaseUrl}/${versionId}/conceptual-model/${propertyPath}`;

		return newFileUrl;
	}

	getVersionResourceFilePath({
		versionId,
		propertyPath,
	}: {
		versionId: string;
		propertyPath: string;
	}): string {
		const filePath = `${this.baseUploadDirectory}/${versionId}/conceptual-model/${propertyPath}`;

		//fs.exists has been deprecated
		if (fs.existsSync(filePath)) {
			return filePath;
		} else {
			throw CustomError.notFound(
				"No se pudo encontrar el recurso solicitado en el servidor."
			);
		}
	}
}
