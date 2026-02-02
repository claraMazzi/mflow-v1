import { InferSchemaType, Schema, SchemaType } from "mongoose";

export const diagramSchema = new Schema(
	{
		usePlantText: {
			type: Boolean,
			default: true,
		},
		plantTextCode: {
			type: String,
			default: "",
		},
		plantTextToken: {
			type: String,
			default: "0m00",
		},
		imageFileId: {
			type: Schema.Types.ObjectId,
			ref: "VersionImage",
			default: null,
		},
	},
	//Prevents mongo from generating a default id
	{ _id: false },
);

export type Diagram = InferSchemaType<typeof diagramSchema>;

const propertySchema = new Schema({
	name: {
		type: String,
		//required: [true, "El campo nombre de la propiedad es obligatorio."],
	},
	detailLevelDecision: {
		include: Boolean,
		justification: String,
		argumentType: {
			type: String,
			enum: ["CALCULO SALIDA", "DATO DE ENTRADA", "SIMPLIFICACION"],
		},
	},
});

const entitySchema = new Schema({
	name: {
		type: String,
		default: "",
	},
	scopeDecision: {
		include: {
			type: Boolean,
			default: true,
		},
		justification: {
			type: String,
			default: "",
		},
		argumentType: {
			type: String,
			enum: ["SALIDA", "ENTRADA", "NO VINCULADO A OBJETIVOS", "SIMPLIFICACION"],
			default: "SALIDA",
		},
	},
	dynamicDiagram: diagramSchema,
	properties: [propertySchema],
});

export const conceptualModelSchema = new Schema({
	objective: {
		type: String,
		default: "",
	},
	name: {
		type: String,
		default: "",
	},
	description: {
		type: String,
		default: "",
	},
	//The internal id automatically added by mongoose.
	//https://mongoosejs.com/docs/subdocs.html#altsyntaxarrays
	simplifications: [{ description: String }],
	assumptions: [{ description: String }],
	structureDiagram: diagramSchema,
	flowDiagram: diagramSchema,
	inputs: [
		{
			description: String,
			//entity: Schema.Types.ObjectId, //TODO: see if its used in the future
			type: { type: String, enum: ["PARAMETRO", "FACTOR EXPERIMENTAL"] },
		},
	],
	outputs: [
		{
			description: String,
			entity: {
				type: String,
				default: "",
			},
		},
	],
	entities: [entitySchema],
});

export type ConceptualModel = InferSchemaType<typeof conceptualModelSchema>;

export type Simplification = {
	_id: string;
	description: string;
};

export type Input = {
	_id: string;
	description: string;
	type: "PARAMETRO" | "FACTOR EXPERIMENTAL";
};

export type Output = {
	_id: string;
	description: string;
	entity: string;
};

export type Assumption = Simplification;

export type Entity = InferSchemaType<typeof entitySchema>;

export const correctionSchema = new Schema({
	description: String,
	location: {
		x: Number,
		y: Number,
		page: Number,
	},
	multimediaFilePath: String,
});

export const todoItemSchema = new Schema({
	correction: correctionSchema,
	description: String,
	completed: Boolean,
});
