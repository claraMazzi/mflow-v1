import { Schema, model } from "mongoose";

export enum DeletionRequestState {
	APPROVED = "ACEPTADA",
	PENDING = "PENDIENTE",
	DENIED = "RECHAZADA",
}

export const DELETION_REQUEST_STATES = Object.values(DeletionRequestState);

const deletionRequestSchema = new Schema(
	{
		project: {
			type: Schema.Types.ObjectId,
			ref: "Project",
			required: [true, "El campo proyecto a eliminar es obligatorio."],
		},
		motive: {
			type: String,
			required: [true, "El campo motivo de la solicitud es obligario."],
		},
		requestingUser: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: [true, "El campo usuario solicitante es obligatorio."],
		},
		reviewer: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		state: {
			type: String,
			enum: DELETION_REQUEST_STATES,
			default: DeletionRequestState.PENDING,
		},
		reviewedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: { createdAt: "registeredAt", updatedAt: false } },
	//{ timestamps: true }
	//Renamed createdAt field so that its name is more similar to the diagram
); //https://mongoosejs.com/docs/timestamps.html

export const DeletionRequestModel = model(
	"DeletionRequest",
	deletionRequestSchema,
);
