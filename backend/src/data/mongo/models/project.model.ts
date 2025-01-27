import { Schema, model } from "mongoose";

const projectSchema = new Schema({
  name: {
    type: String,
    required: [true, "Project Name is required"],
  },
  description: {
    type: String,
  },
  owner: {
    type: Schema.Types.ObjectId, // Referencia al modelo de User
    ref: "User", 
    required: [true, "Owner is required"],
  },
  collaborators: [
    {
      type: Schema.Types.ObjectId, // Referencia al modelo de User
      ref: "User",
    },
  ],

  //TODO: AGREGAR LINK TO ARTEFACTOS - MODELO CONCEPTUAL 
}, { timestamps: true }); // Agrega createdAt y updatedAt automáticamente

export const Project = model('Project', projectSchema);
