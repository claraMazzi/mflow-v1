type Diagram = {
    usesPlantText: boolean;
    plantTextCode: string;
    imageFilePath: string;
};

type Property = {
    _id: string;
    nombre: string;
    detailLevelDecision: {
        include: boolean;
        justification: string;
        argumentType: "CALCULO SALIDA" | "DATO DE ENTRADA" | "SIMPLIFICACION";
    };
};

type Entity = {
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
    entity: string;
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
    simplifications: Simplification[];
    assumptions: Assumption[];
    structureDiagram: Diagram;
    flowDiagram: Diagram;
    inputs: Input[];
    outputs: Output[];
    entities: Entity[];
};