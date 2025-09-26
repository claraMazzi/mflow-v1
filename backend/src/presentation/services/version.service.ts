import mongoose from "mongoose";
import { bcryptAdapter } from "../../config";
import { ProjectModel, UserModel, Version, VersionModel } from "../../data";
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
			imageInfos: (Pick<
				VersionImage,
				"originalFilename" | "url" | "createdAt" | "sizeInBytes"
			> & {
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
					from: "versionimages",
					localField: "_id",
					foreignField: "version",
					as: "imageInfos",
					pipeline: [
						{
							$project: {
								_id: 0,
								id: { $toString: "_id" },
								url: 1,
								sizeInBytes: 1,
								originalFilename: 1,
								createdAt: 1,
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

	async hasUserReadAccessToVersion({
		versionId,
		userId,
	}: {
		versionId: string;
		userId: string;
	}): Promise<boolean> {
		const pipeline: mongoose.PipelineStage[] = [
			{
				$match: { _id: new mongoose.Types.ObjectId(versionId) },
			},
			{
				$project: {
					sharedWithReaders: 1,
				},
			},
			{
				$lookup: {
					from: "projects",
					localField: "_id",
					foreignField: "versions",
					as: "project",
					pipeline: [
						{
							$project: {
								owner: 1,
								collaborators: 1,
							},
						},
					],
				},
			},
			{
				$unwind: {
					path: "project",
				},
			},
			{
				$lookup: {
					from: "revisions",
					localField: "_id",
					foreignField: "version",
					as: "revisions",
					pipeline: [
						{
							$project: {
								verifier: 1,
							},
						},
					],
				},
			},
		];

		const result = await VersionModel.aggregate(pipeline).exec();

		if (result.length === 0)
			throw CustomError.notFound("Version does not exist.");

		const usersWithAccess = result[0] as {
			_id: mongoose.Types.ObjectId;
			sharedWithReaders: mongoose.Types.ObjectId[];
			project: {
				_id: mongoose.Types.ObjectId;
				owner: mongoose.Types.ObjectId;
				collaborators: mongoose.Types.ObjectId[];
			};
			revisions: {
				_id: mongoose.Types.ObjectId;
				verifier: mongoose.Types.ObjectId;
			}[];
		};

		const isOwner = usersWithAccess.project.owner.equals(userId);
		if (isOwner) {
			return true;
		}

		const isCollaborator = usersWithAccess.project.collaborators.some((c) =>
			c.equals(userId)
		);
		if (isCollaborator) {
			return true;
		}

		const isReader = usersWithAccess.sharedWithReaders.some((r) =>
			r.equals(userId)
		);
		if (isReader) {
			return true;
		}

		const isVerifier = usersWithAccess.revisions.some((r) =>
			r.verifier.equals(userId)
		);
		if (isVerifier) {
			return true;
		}

		return false;
	}

	async hasUserWriteAccessToVersion({
		versionId,
		userId,
	}: {
		versionId: string;
		userId: string;
	}): Promise<boolean> {
		const pipeline: mongoose.PipelineStage[] = [
			{
				$match: { versions: new mongoose.Types.ObjectId(versionId) },
			},
			{
				$project: {
					_id: 0,
					owner: 1,
					collaborators: 1,
				},
			},
		];

		const result = await VersionModel.aggregate(pipeline).exec();

		if (result.length === 0)
			throw CustomError.notFound("Version does not exist.");

		const usersWithAccess = result[0] as {
			owner: mongoose.Types.ObjectId;
			collaborators: mongoose.Types.ObjectId[];
		};

		const isOwner = usersWithAccess.owner.equals(userId);
		if (isOwner) {
			return true;
		}

		const isCollaborator = usersWithAccess.collaborators.some((c) =>
			c.equals(userId)
		);
		if (isCollaborator) {
			return true;
		}

		return false;
	}
}
