import { Schema } from "mongoose";

export const diagramSchema = new Schema(
	{
		usesPlantText: Boolean,
		plantTextCode: String,
		imageFilePath: String,
	},
	//Prevents mongo from generating a default id
	{ _id: false }
);

const propertySchema = new Schema({
    nombre: {
		type: String,
		required: [true, "El campo nombre de la propiedad es obligatorio."],
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

export const conceptualModelSchema = new Schema(
	{
		objective: {
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
				description: {
					type: String,
					required: [
						true,
						"El campo descripción de la entrada es obligatorio.",
					],
				},
				entity: Schema.Types.ObjectId,
				type: { type: String, enum: ["PARAMETRO", "FACTOR EXPERIMENTAL"] },
			},
		],
		outputs: [
			{
				description: {
					type: String,
					required: [true, "El campo descripción de la salida es obligatorio."],
				},
				entity: Schema.Types.ObjectId,
			},
		],
        entities: [entitySchema]
	},
);

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