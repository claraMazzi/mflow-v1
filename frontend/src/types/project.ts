import { VersionEntity } from "./version";

export enum ProjectState {
	CREATED = "CREADO",
	PENDING_DELETION = "PENDIENTE DE ELIMINACION",
	DELETED = "ELIMINADO",
}

export type ProjectEntity = {
	id: string;
	title: string;
	description: string;
	owner: string;
	state: ProjectState;
};

export type ProjectWithVersionsEntity = ProjectEntity & {
	versions: VersionEntity[];
};

export type ProjectCollaborator = {
	id: string;
	email: string;
	name: string;
	lastName: string;
};
