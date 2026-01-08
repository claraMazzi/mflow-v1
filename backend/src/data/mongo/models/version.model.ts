import { InferSchemaType, Schema, model } from "mongoose";
import { conceptualModelSchema, todoItemSchema } from "./subdocuments-schemas";

const versionSchema = new Schema(
	{
		title: {
			type: String,
			required: [true, "El campo titulo es obligatorio."],
		},
		state: {
			type: String,
			enum: ["EN EDICION", "FINALIZADA", "PENDIENTE DE REVISION", "REVISADA", "ELIMINADA"],
			default: "EN EDICION",
		},
		parentVersion: {
			type: Schema.Types.ObjectId,
			ref: "Version",
			default: null,
		},
		sharedWithReaders: {
			type: [Schema.Types.ObjectId],
			ref: "User",
		},
		revision: {
			type: Schema.Types.ObjectId,
			ref: "Revision",
		},
		todoItems: [todoItemSchema],
		conceptualModel: {
			type: conceptualModelSchema,
			required: [
				true,
				"The conceptual model must be initialized when the version is created.",
			],
		},
		//Uncomment later if needed
		/*comments : {
			type: [Schema.Types.ObjectId],
			ref: "Comment",
		},*/
	},
	{ timestamps: true }
);

export type Version = InferSchemaType<typeof versionSchema> & { id: string };

export const VersionModel = model("Version", versionSchema);
