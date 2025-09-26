import { Schema, model } from "mongoose";

const projectSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, "El campo nombre del proyecto es obligatorio."],
		},
		description: {
			type: String,
		},
		owner: {
			type: Schema.Types.ObjectId, // Referencia al modelo de User
			ref: "User",
			required: [
				true,
				"El campo dueño de proyecto es obligatorio.",
			],
		},
		collaborators: [
			{
				type: Schema.Types.ObjectId, // Referencia al modelo de User
				ref: "User",
			},
		],
		state: {
			type: String,
			enum: ["CREADO", "PENDIENTE DE ELIMINACION", "ELIMINADO"],
			default: "CREADO",
		},
		versions: [{ type: Schema.Types.ObjectId, ref: "Version", index: true }],
	},
	{ timestamps: true }
); // Agrega createdAt y updatedAt automáticamente

export const ProjectModel = model("Project", projectSchema);
