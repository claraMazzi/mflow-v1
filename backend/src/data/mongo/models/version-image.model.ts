import { Schema, model } from "mongoose";

const versionImageSchema = new Schema(
	{
		filename: {
			type: String,
			required: [
				true,
				"El campo correspondiente al nombre de la imagen es obligatorio.",
			],
		},
		originalFilename: {
			type: String,
			required: [
				true,
				"El campo correspondiente al nombre original de la imagen es obligatorio.",
			],
		},
		mimeType: {
			type: String,
			required: [true, "El tipo de la imagen es obligatorio."],
		},
		sizeInBytes: {
			type: Number,
			required: [true, "El tamaño del archivo es obligatorio."],
		},
		path: {
			type: String,
			required: [true, "La ruta donde está guardada la imagen es obligatoria."],
		},
		version: {
			type: [Schema.Types.ObjectId],
			ref: "Version",
            required: [true, "La imagen debe estar asociada con una versión."]
		},
	},
	{ timestamps: true }
);

export const VersionImageModel = model("VersionImage", versionImageSchema);
