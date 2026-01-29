import { model, Schema } from "mongoose";

const verifierRequestSchema = new Schema(
	{
		requestingUser: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: [
				true,
				"El usuario solicitante debe estar asociado a la solicitud.",
			],
		},
		reviewer: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		assignedVerifier: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		version: {
			type: Schema.Types.ObjectId,
			ref: "Version",
			required: [true, "Una solicitud debe tener asociada una versión."],
		},
		state: {
			type: String,
			enum: ["PENDIENTE", "FINALIZADA"],
			default: "PENDIENTE",
		},
		assignedAt: Date,
	},
	{ timestamps: true }
);

export const VerifierRequestModel = model(
	"VerifierRequest",
	verifierRequestSchema
);
