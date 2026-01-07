import { model, Schema } from "mongoose";
import { correctionSchema } from "./subdocuments-schemas";

const revisionSchema = new Schema(
	{
		verifierRequest: {
			type: Schema.Types.ObjectId,
			ref: "VerifierRequest",
			default: null,
		},
		verifier: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: [true, "Una revisión debe tener asociado un verificador."],
		},
		version: {
			type: Schema.Types.ObjectId,
			ref: "Version",
			required: [true, "Una revisión debe tener asociado una versión."],
		},
		finalReview: String, //devolucion final de la revision
		state: {
			type: String,
			enum: ["PENDIENTE", "EN CURSO", "FINALIZADA"],
			default: "PENDIENTE",
		},
		corrections: [correctionSchema],
	},
	{ timestamps: true }
);

export const RevisionModel = model("Revision", revisionSchema);
