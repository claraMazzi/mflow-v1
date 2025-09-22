import mongoose from "mongoose";
import { bcryptAdapter } from "../../config";
import { UserModel, Version, VersionModel } from "../../data";
import {
	CreateVersionDto,
	CustomError,
	PasswordUpdateDto,
	UpdateUserDto,
	UserEntity,
} from "../../domain";
import { version } from "os";
import { VersionImage } from "../../data/mongo/models/version-image.model";

export class VersionService {
	constructor() {}

	async createVersion({}: CreateVersionDto) {}

	async getVersionById(id: string) {
		const version = await VersionModel.findById(id).exec();
		if (!version) throw CustomError.notFound("Version does not exist.");

		//const versionEntity = VersionEntity.fromObject(version);
		const versionEntity = version;

		return { version };
	}

	async getVersionByIdWithImages(id: string): Promise<{
		version: Version & { id: string } & {
			imageInfos: (Pick<VersionImage, "originalFilename" | "url"> & {
				id: string;
			})[];
		};
	}> {
		const pipeline: mongoose.PipelineStage[] = [
			{
				$match: { _id: new mongoose.Types.ObjectId(id) },
			},
			{
				$lookup: {
					from: "VersionImage",
					localField: "_id",
					foreignField: "version",
					as: "imageInfos",
					pipeline: [
						{
							$project: {
								_id: 0,
								id: { $toString: "_id" },
								url: 1,
								originalFilename: 1,
							},
						},
					],
				},
			},
			{
				$addFields: {
					id: { $toString: "$_id" },
				},
			},
			{
				$project: {
					_id: 0,
				},
			},
		];

		const result = await VersionModel.aggregate(pipeline).exec();

		if (result.length === 0)
			throw CustomError.notFound("Version does not exist.");

		return {
			version: result[0],
		};
	}
}
