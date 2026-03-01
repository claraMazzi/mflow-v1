import { InferSchemaType, Schema, model } from "mongoose";
import { conceptualModelSchema } from "./subdocuments-schemas";

export enum VersionState {
    EDITABLE = "EN EDICION",
    FINALIZED = "FINALIZADA",
    PENDING_REVIEW = "PENDIENTE DE REVISION",
    REVIEWED = "REVISADA",
    DELETED = "ELIMINADA",
}

export const VERSION_STATES : readonly VersionState[] = Object.values(VersionState);

const versionSchema = new Schema(
	{
		title: {
			type: String,
			required: [true, "El campo titulo es obligatorio."],
		},
		state: {
			type: String,
			enum: VERSION_STATES,
			default: VersionState.EDITABLE,
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
		conceptualModel: {
			type: conceptualModelSchema,
			required: [
				true,
				"The conceptual model must be initialized when the version is created.",
			],
		},
	},
	{ timestamps: true }
);

export type Version = InferSchemaType<typeof versionSchema> & { id: string };

export const VersionModel = model("Version", versionSchema);
