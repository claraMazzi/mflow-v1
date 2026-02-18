
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
	versions: string[];
};

export type ProjectCollaborator = {
	id: string;
	email: string;
	name: string;
  lastName: string;
};
