import { InferSchemaType, Schema, SchemaType } from "mongoose";

export const diagramSchema = new Schema(
	{
		usesPlantText: Boolean,
		plantTextCode: String,
		plantTextToken: String,
		imageFileId: {
			type: Schema.Types.ObjectId,
			ref: "VersionImage",
			default: null,
		},
	},
	//Prevents mongo from generating a default id
	{ _id: false }
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
		include: Boolean,
		justification: String,
		argumentType: {
			type: String,
			enum: ["SALIDA", "ENTRADA", "NO VINCULADO A OBJETIVOS", "SIMPLIFICACION"],
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
	name : {
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
			description: String, //TODO: Add final validation of empty descriptions
			// description: {
			// 	type: String,
			// 	required: [true, "El campo descripción de la entrada es obligatorio."],
			// },
			//entity: Schema.Types.ObjectId, //TODO: see if its used in the future
			type: { type: String, enum: ["PARAMETRO", "FACTOR EXPERIMENTAL"] },
		},
	],
	outputs: [
		{
			description: String, //TODO: Add final validation of empty descriptions
			// description: {
			// 	type: String,
			// 	required: [true, "El campo descripción de la salida es obligatorio."],
			// },
			entity: Schema.Types.ObjectId,
		},
	],
	entities: [entitySchema],
});

export type ConceptualModel = InferSchemaType<typeof conceptualModelSchema>;

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
