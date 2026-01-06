export type ImageInfo = {
	filename: string;
	uploadedAt: Date;
	sizeInBytes: number;
	url: string;
	id: string;
};

type Diagram = {
	usesPlantText: boolean;
	plantTextCode: string;
	plantTextToken: string;
	imageFileId: string;
};

type Property = {
	_id: string;
	name: string;
	detailLevelDecision: {
		include: boolean;
		justification: string;
		argumentType: "CALCULO SALIDA" | "DATO DE ENTRADA" | "SIMPLIFICACION";
	};
};

export type Entity = {
	_id: string;
	name: string;
	scopeDecision: {
		include: boolean;
		justification: string;
		argumentType:
			| "SALIDA"
			| "ENTRADA"
			| "NO VINCULADO A OBJETIVOS"
			| "SIMPLIFICACION";
	};
	dynamicDiagram: Diagram;
	properties: Property[];
};

type Input = {
	_id: string;
	description: string;
	//entity: string;
	type: "PARAMETRO" | "FACTOR EXPERIMENTAL";
};

type Output = {
	_id: string;
	description: string;
	entity: string;
};

type Simplification = {
	_id: string;
	description: string;
};

type Assumption = {
	_id: string;
	description: string;
};

export type ConceptualModel = {
	objective: string;
	name: string;
	description: string;
	simplifications: Simplification[];
	assumptions: Assumption[];
	structureDiagram: Diagram;
	flowDiagram: Diagram;
	inputs: Input[];
	outputs: Output[];
	entities: Entity[];
};

export type VersionState = "EN EDICION" | "FINALIZADA" | "PENDIENTE DE REVISION" | "REVISADA";

export type Version = {
	conceptualModel: ConceptualModel;
	imageInfos: ImageInfo[];
	title: string;
	state: VersionState;
};