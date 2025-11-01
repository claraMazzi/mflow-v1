import { Version } from "../../data/mongo/models/version.model";
import { VersionService } from "../../presentation/services";
import { CustomError } from "../errors/custom.error";
import { UserEntity } from "./user.entity";

interface ReducedUserEntity {
	email: string;
	id: string;
}

interface ReducedVersionEntity {
	title: string;
	state: string;
	parentVersion: { id: string; title: string } | null;
	updatedAt: string;
	createdAt: string;
}

export class ProjectEntity {
	constructor(
		public id: string,
		public title: string,
		public description: string,
		public owner: string,
		public collaborators: ReducedUserEntity[],
		public state: string,
		public versions: ReducedVersionEntity[]
	) {}

	static fromObject(object: { [key: string]: any }) {
		const {
			id,
			_id,
			title,
			description,
			owner,
			collaborators,
			state,
			versions,
		} = object;

		if (!_id && !id) throw CustomError.badRequest("Missing id");
		if (!title) throw CustomError.badRequest("Missing title");
		if (!owner) throw CustomError.badRequest("Missing owner");
		if (!collaborators) throw CustomError.badRequest("Missing collaborators");
		if (!versions) throw CustomError.badRequest("Missing versions");

		return new ProjectEntity(
			_id || id,
			title,
			description,
			owner,
			collaborators.map((item: UserEntity) => ({
				email: item.email,
				id: item.id,
			})),
			state,
			versions.map(
				(
					item: Omit<Version, "parentVersion"> & {
						parentVersion: { id: string; title: string } | null;
					}
				) => ({
					id: item.id,
					title: item.title,
					state: item.state,
					parentVersion: item.parentVersion && {
						id: item.parentVersion.id,
						title: item.parentVersion.title,
					},
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				})
			)
		);
	}
}
