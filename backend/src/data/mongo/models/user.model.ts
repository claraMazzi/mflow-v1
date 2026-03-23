import { Schema, SchemaTypes, model } from "mongoose";

export enum UserRole {
	VERIFICADOR = "VERIFICADOR",
	MODELADOR = "MODELADOR",
	ADMIN = "ADMIN",
}

export const USER_ROLES = Object.values(UserRole);

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
		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

export const UserModel = model("User", userSchema);
