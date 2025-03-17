import { Schema, model } from "mongoose";

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
			required: [
				true,
				"El campo usuario solicitante es obligatorio.",
			],
		},
		reviewer: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		state: {
			type: String,
			enum: ["PENDIENTE", "ACEPTADA", "RECHAZADA"],
			default: "PENDIENTE",
		},
		reviewedAt: Date,
	},
	{ timestamps: { createdAt: "registeredAt", updatedAt: false } }
	//{ timestamps: true }
	//Renamed createdAt field so that its name is more similar to the diagram
); //https://mongoosejs.com/docs/timestamps.html

export const DeletionRequestModel = model("DeletionRequest", deletionRequestSchema);
