import { Schema, model } from "mongoose";

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true, //no quiero ningun duplicado
  },
  emailValidated: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  roles: {
    type: [String],
    enum: ["VERIFICADOR", "MODELADOR", "ADMIN"],
    default: ["MODELADOR"],
  },
});

export const UserModel = model('User', userSchema);
