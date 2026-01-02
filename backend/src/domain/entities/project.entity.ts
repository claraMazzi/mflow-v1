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

		if (!_id && !id) throw CustomError.badRequest("El identificador del proyecto es obligatorio.");
		if (!title) throw CustomError.badRequest("El título del proyecto es obligatorio.");
		if (!owner) throw CustomError.badRequest("El dueño del proyecto es obligatorio.");
		if (!collaborators) throw CustomError.badRequest("Los colaboradores del proyecto son obligatorios.");
		if (!versions) throw CustomError.badRequest("Las versiones de modelos del proyecto son requeridas.");

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
