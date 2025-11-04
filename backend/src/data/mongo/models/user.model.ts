import { Schema, SchemaTypes, model } from "mongoose";

export const USER_ROLES = ["VERIFICADOR", "MODELADOR", "ADMIN"] as const;

export type UserRole = typeof USER_ROLES[number];

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, "El campo nombre es obligatorio."],
		},
		lastName: {
			type: String,
			required: [true, "El campo apellido es obligatorio."],
		},
		email: {
			type: String,
			required: [true, "El campo correo electrónico es obligatorio."],
			unique: true, //no quiero ningun duplicado
		},
		emailValidated: {
			type: Boolean,
			default: false,
		},
		password: {
			type: String,
			required: [true, "El campo contraseña es obligatorio."],
		},
		roles: {
			type: [String],
			enum: USER_ROLES,
			default: ["MODELADOR"],
		},
		sharedProjects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
		sharedArtifacts: [{ type: Schema.Types.ObjectId, ref: "Version" }],
		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

export const UserModel = model("User", userSchema);
