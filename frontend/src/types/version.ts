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
	parentVersion: { id: string; title: string } | null;
	projectId: string;
	projectTitle: string;
};