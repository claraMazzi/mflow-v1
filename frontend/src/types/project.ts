export type ProjectEntity = {
	id: string;
	title: string;
	description: string;
	owner: string;
	state: string;
	versions: string[];
};

export type ProjectCollaborator = {
	id: string;
	email: string;
	name: string;
  lastName: string;
};
