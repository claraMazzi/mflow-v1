import { Schema, model } from "mongoose";

export enum ProjectState {
  CREATED = "CREADO",
  PENDING_DELETION = "PENDIENTE DE ELIMINACION",
  DELETED = "ELIMINADO",
}

export const PROJECT_STATES = Object.values(ProjectState);

const projectSchema = new Schema(
	{
		title: {
			type: String,
			required: [true, "El campo título del proyecto es obligatorio."],
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
			enum: PROJECT_STATES,
			default: "CREADO",
		},
		versions: [{ type: Schema.Types.ObjectId, ref: "Version", index: true }],
	},
	{ timestamps: true }
); // Agrega createdAt y updatedAt automáticamente

export const ProjectModel = model("Project", projectSchema);
