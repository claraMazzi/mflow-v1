export type VersionEntity = {
	id: string;
	title: string;
	state: "EN EDICION" | "FINALIZADA" | "PENDIENTE DE REVISION" | "REVISADA";
	parentVersion: {
		id: string;
		title: string;
	};
};
