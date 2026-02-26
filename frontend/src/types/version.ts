export type VersionEntity = {
	id: string;
	title: string;
	state: "EN EDICION" | "FINALIZADA" | "PENDIENTE DE REVISION" | "REVISADA" | "ELIMINADA";
	parentVersion: {
		id: string;
		title: string;
	} | null;
};

export type SharedVersionEntity = VersionEntity & {
	projectId: string;
	projectTitle: string;
};