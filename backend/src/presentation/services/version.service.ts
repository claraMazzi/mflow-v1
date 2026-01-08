import mongoose from "mongoose";
import { ProjectModel, Version, VersionModel } from "../../data";
import {
	CreateVersionDto,
	CustomError,
} from "../../domain";
import { VersionImage } from "../../data/mongo/models/version-image.model";
import { Assumption, Input, Simplification, Output, Entity, ConceptualModel } from "../../data/mongo/models/subdocuments-schemas";

const plantumlEncoder = require("plantuml-encoder");

// Valid states for parent versions
const VALID_PARENT_VERSION_STATES = ["FINALIZADA", "PENDIENTE DE REVISION", "REVISADA"];

export class VersionService {
	// private projectService: ProjectService;

	/* constructor(projectService: ProjectService) {
		this.projectService = projectService;
	} */

	async createVersion(createDto: CreateVersionDto) {
		// Verify project exists
		const project = await ProjectModel.findById(createDto.projectId).exec();
		if (!project) {
			throw CustomError.notFound("El proyecto especificado no existe.");
		}

		// Check if version title already exists within the same project
		const existingVersions = await VersionModel.find({
			_id: { $in: project.versions },
			title: createDto.title,
			state: { $ne: "ELIMINADA" }
		}).exec();

		if (existingVersions.length > 0) {
			throw CustomError.badRequest(
				"Ya existe una versión con el mismo nombre en este proyecto."
			);
		}

		try {
			let newVersionData: {
				title: string;
				state: string;
				parentVersion: mongoose.Types.ObjectId | null;
				sharedWithReaders: mongoose.Types.ObjectId[];
				todoItems: any[];
				revisions: mongoose.Types.ObjectId[];
				conceptualModel: any;
			};

			// Path 1: Create blank version (no parent)
			if (!createDto.parentVersionId) {
				newVersionData = {
					title: createDto.title,
					state: "EN EDICION",
					parentVersion: null,
					sharedWithReaders: [],
					todoItems: [],
					revisions: [],
					conceptualModel: this.createBlankConceptualModel(),
				};
			} 
			// Path 2: Create version from parent
			else {
				const parentVersion = await VersionModel.findById(createDto.parentVersionId).exec();
				
				if (!parentVersion) {
					throw CustomError.notFound("La versión padre especificada no existe.");
				}

				// Validate parent version state
				if (!VALID_PARENT_VERSION_STATES.includes(parentVersion.state)) {
					throw CustomError.badRequest(
						`La versión padre debe estar en estado ${VALID_PARENT_VERSION_STATES.join(", ")}. Estado actual: ${parentVersion.state}`
					);
				}

				// Deep copy of conceptual model (without _id to let mongoose generate new ones)
				const copiedConceptualModel = this.deepCopyConceptualModel(parentVersion.conceptualModel);

				// Copy todo items if checkbox was checked
				const todoItems = createDto.migrateTodoItems 
					? this.deepCopyTodoItems(parentVersion.todoItems)
					: [];

				newVersionData = {
					title: createDto.title,
					state: "EN EDICION",
					parentVersion: new mongoose.Types.ObjectId(createDto.parentVersionId),
					sharedWithReaders: [],
					todoItems,
					revisions: [],
					conceptualModel: copiedConceptualModel,
				};
			}

			// Create and save the new version
			const newVersion = new VersionModel(newVersionData);
			await newVersion.save();

			// Add version to project's versions array
			await ProjectModel.findByIdAndUpdate(
				createDto.projectId,
				{ $push: { versions: newVersion._id } }
			).exec();

			return {
				version: {
					id: newVersion._id.toString(),
					title: newVersion.title,
					state: newVersion.state,
					parentVersion: newVersion.parentVersion ? {
						id: newVersion.parentVersion.toString(),
					} : null,
				}
			};
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			throw CustomError.internalServer(`Error al crear la versión: ${error}`);
		}
	}

	private createBlankConceptualModel() {
		return {
			objective: "",
			name: "",
			description: "",
			simplifications: [],
			assumptions: [],
			structureDiagram: {
				usesPlantText: undefined,
				plantTextCode: "",
				plantTextToken: "",
				imageFileId: null,
			},
			flowDiagram: {
				usesPlantText: undefined,
				plantTextCode: "",
				plantTextToken: "",
				imageFileId: null,
			},
			inputs: [],
			outputs: [],
			entities: [],
		};
	}

	private deepCopyConceptualModel(original: any): any {
		if (!original) {
			return this.createBlankConceptualModel();
		}

		// Convert to plain object and back to remove mongoose internals and generate new _ids
		const plainObject = JSON.parse(JSON.stringify(original));
		
		// Remove all _id fields to let mongoose generate new ones
		this.removeIds(plainObject);
		
		// Note: imageFileId references are preserved as they point to existing images
		// The images themselves are not duplicated
		
		return plainObject;
	}

	private deepCopyTodoItems(todoItems: any[]): any[] {
		if (!todoItems || todoItems.length === 0) {
			return [];
		}

		// Deep copy and remove _ids to generate new ones
		const copiedItems = JSON.parse(JSON.stringify(todoItems));
		copiedItems.forEach((item: any) => this.removeIds(item));
		
		return copiedItems;
	}

	private removeIds(obj: any): void {
		if (!obj || typeof obj !== 'object') return;
		
		if (Array.isArray(obj)) {
			obj.forEach(item => this.removeIds(item));
		} else {
			delete obj._id;
			delete obj.id;
			Object.values(obj).forEach(value => {
				if (typeof value === 'object' && value !== null) {
					this.removeIds(value);
				}
			});
		}
	}

	async getVersionById(id: string) {
		const version = await VersionModel.findById(id).exec();
		if (!version) throw CustomError.notFound("Version does not exist.");

		//const versionEntity = VersionEntity.fromObject(version);
		const versionEntity = version;

		return { version };
	}

	async getVersionByIdWithImages(id: string): Promise<{
		version: Version & { id: string } & {
			imageInfos: (Pick<
				VersionImage,
				"originalFilename" | "url" | "createdAt" | "sizeInBytes"
			> & {
				id: string;
			})[];
		};
	}> {
		const pipeline: mongoose.PipelineStage[] = [
			{
				$match: { _id: new mongoose.Types.ObjectId(id) },
			},
			// Populate conceptualModel.structureDiagram.imageFileId
			{
				$lookup: {
					from: "versionimages",
					localField:
						"conceptualModel.structureDiagram.imageFileId",
					foreignField: "_id",
					as: "structureDiagramImage",
					pipeline: [
						{
							$project: {
								_id: 0,
								id: { $toString: "$_id" },
								url: 1,
								sizeInBytes: 1,
								originalFilename: 1,
								createdAt: 1,
							},
						},
					],
				},
			},
			{
				$set: {
					"conceptualModel.structureDiagram.imageFileId": {
						$first: "$structureDiagramImage",
					},
				},
			},
			{ $unset: "structureDiagramImage" },
			// Populate conceptualModel.flowDiagram.imageFileId
			{
				$lookup: {
					from: "versionimages",
					localField: "conceptualModel.flowDiagram.imageFileId",
					foreignField: "_id",
					as: "flowDiagramImage",
					pipeline: [
						{
							$project: {
								_id: 0,
								id: { $toString: "$_id" },
								url: 1,
								sizeInBytes: 1,
								originalFilename: 1,
								createdAt: 1,
							},
						},
					],
				},
			},
			{
				$set: {
					"conceptualModel.flowDiagram.imageFileId": {
						$first: "$flowDiagramImage",
					},
				},
			},
			{ $unset: "flowDiagramImage" },
			{
				$lookup: {
					from: "versionimages",
					localField: "_id",
					foreignField: "version",
					as: "imageInfos",
					pipeline: [
						{
							$project: {
								_id: 0,
								id: { $toString: "$_id" }, // Fixed: was "_id" (literal), now "$_id" (field reference)
								url: 1,
								sizeInBytes: 1,
								originalFilename: 1,
								createdAt: 1,
							},
						},
					],
				},
			},
			{
				$addFields: {
					id: { $toString: "$_id" },
				},
			},
			{
				$project: {
					_id: 0,
				},
			},
		];

		const result = await VersionModel.aggregate(pipeline).exec();

		if (result.length === 0)
			throw CustomError.notFound("Version does not exist.");

		return {
			version: result[0],
		};
	}

	async hasUserReadAccessToVersion({
		versionId,
		userId,
	}: {
		versionId: string;
		userId: string;
	}): Promise<boolean> {
		const pipeline: mongoose.PipelineStage[] = [
			{
				$match: { _id: new mongoose.Types.ObjectId(versionId) },
			},
			{
				$project: {
					sharedWithReaders: 1,
				},
			},
			{
				$lookup: {
					from: "projects",
					localField: "_id",
					foreignField: "versions",
					as: "project",
					pipeline: [
						{
							$project: {
								owner: 1,
								collaborators: 1,
							},
						},
					],
				},
			},
			{
				$unwind: {
					path: "project",
				},
			},
			{
				$lookup: {
					from: "revisions",
					localField: "_id",
					foreignField: "version",
					as: "revisions",
					pipeline: [
						{
							$project: {
								verifier: 1,
							},
						},
					],
				},
			},
		];

		const result = await VersionModel.aggregate(pipeline).exec();

		if (result.length === 0)
			throw CustomError.notFound("Version does not exist.");

		const usersWithAccess = result[0] as {
			_id: mongoose.Types.ObjectId;
			sharedWithReaders: mongoose.Types.ObjectId[];
			project: {
				_id: mongoose.Types.ObjectId;
				owner: mongoose.Types.ObjectId;
				collaborators: mongoose.Types.ObjectId[];
			};
			revisions: {
				_id: mongoose.Types.ObjectId;
				verifier: mongoose.Types.ObjectId;
			}[];
		};

		const isOwner = usersWithAccess.project.owner.equals(userId);
		if (isOwner) {
			return true;
		}

		const isCollaborator = usersWithAccess.project.collaborators.some((c) =>
			c.equals(userId)
		);
		if (isCollaborator) {
			return true;
		}

		const isReader = usersWithAccess.sharedWithReaders.some((r) =>
			r.equals(userId)
		);
		if (isReader) {
			return true;
		}

		const isVerifier = usersWithAccess.revisions.some((r) =>
			r.verifier.equals(userId)
		);
		if (isVerifier) {
			return true;
		}

		return false;
	}

	async hasUserWriteAccessToVersion({
		versionId,
		userId,
	}: {
		versionId: string;
		userId: string;
	}): Promise<boolean> {
		const pipeline: mongoose.PipelineStage[] = [
			{
				$match: { versions: new mongoose.Types.ObjectId(versionId) },
			},
			{
				$project: {
					_id: 0,
					owner: 1,
					collaborators: 1,
				},
			},
		];

		const result = await VersionModel.aggregate(pipeline).exec();

		if (result.length === 0)
			throw CustomError.notFound("Version does not exist.");

		const usersWithAccess = result[0] as {
			owner: mongoose.Types.ObjectId;
			collaborators: mongoose.Types.ObjectId[];
		};

		const isOwner = usersWithAccess.owner.equals(userId);
		if (isOwner) {
			return true;
		}

		const isCollaborator = usersWithAccess.collaborators.some((c) =>
			c.equals(userId)
		);
		if (isCollaborator) {
			return true;
		}

		return false;
	}

	async deleteVersion({
		versionId,
		userId,
	}: {
		versionId: string;
		userId: string;
	}): Promise<{ message: string }> {
		// Find the version
		const version = await VersionModel.findById(versionId).exec();
		if (!version) {
			throw CustomError.notFound("La versión especificada no existe.");
		}

		// Check if version is already deleted
		if (version.state === "ELIMINADA") {
			throw CustomError.badRequest("La versión ya fue eliminada.");
		}

		// Check if version is in "EN EDICION" state
		if (version.state !== "EN EDICION") {
			throw CustomError.badRequest(
				"Sólo se puede eliminar una versión que se encuentra en estado 'en edición'."
			);
		}

		// Find the project that contains this version to verify ownership
		const project = await ProjectModel.findOne({
			versions: versionId,
		}).exec();

		if (!project) {
			throw CustomError.notFound(
				"No se encontró el proyecto asociado a esta versión."
			);
		}

		// Check if the user is the project owner
		if (!project.owner.equals(userId)) {
			throw CustomError.forbidden(
				"Solo el propietario del proyecto puede eliminar versiones."
			);
		}

		try {
			// Soft delete: update state to "ELIMINADA"
			version.state = "ELIMINADA";
			await version.save();

			return {
				message: "La versión fue eliminada exitosamente.",
			};
		} catch (error) {
			console.error("Error deleting version:", error);
			throw CustomError.internalServer(
				"Se ha producido un error, por favor inténtelo de nuevo más tarde."
			);
		}
	}

	async validateAndFinalizeVersion(versionId: string): Promise<{
		isValid: boolean;
		errors: string[];
		warnings: string[];
	}> {
		const { version } = await this.getVersionById(versionId);
		const errors: string[] = [];
		const warnings: string[] = [];

		// Convert to plain object to allow modifications
		const model = JSON.parse(JSON.stringify(version.conceptualModel));

		console.log("Model: ", model);

		// Validate objective, name, and description
		if (!model.objective || model.objective.trim() === "") {
			errors.push("El objetivo no puede estar vacío.");
		}
		if (!model.name || model.name.trim() === "") {
			errors.push("El nombre no puede estar vacío.");
		}
		if (!model.description || model.description.trim() === "") {
			errors.push("La descripción no puede estar vacía.");
		}

		// Validate simplifications
		if (model.simplifications) {
			model.simplifications.forEach((simplification: Simplification, index: number) => {
				if (!simplification.description || simplification.description.trim() === "") {
					errors.push(`La simplificación ${index + 1} debe tener una descripción.`);
				}
			});
		}

		// Validate assumptions
		if (model.assumptions) {
			model.assumptions.forEach((assumption: Assumption, index: number) => {
				if (!assumption.description || assumption.description.trim() === "") {
					errors.push(`La suposición ${index + 1} debe tener una descripción.`);
				}
			});
		}

		// Helper function to validate PlantUML code by calling the PlantUML server
		const validatePlantUMLCode = async (plantTextCode: string): Promise<{ isValid: boolean; error?: string }> => {
			try {
				const encoded = plantumlEncoder.encode(plantTextCode);
				// Use the /txt/ endpoint to get text output - errors are clearly indicated in the response
				const response = await fetch(`http://www.plantuml.com/plantuml/txt/${encoded}`);
				
				if (!response.ok) {
					return { isValid: false, error: "No se pudo validar el código PlantText con el servidor." };
				}
				
				const textOutput = await response.text();
				
				// Check for common error indicators in PlantUML text output
				if (textOutput.includes("Syntax Error") || 
					textOutput.includes("@startuml") === false && textOutput.includes("Error") ||
					textOutput.includes("Not valid")) {
					return { isValid: false, error: textOutput.trim() };
				}
				
				return { isValid: true };
			} catch (error) {
				console.error("Error validating PlantUML code:", error);
				// If we can't reach the server, we'll skip validation and add a warning instead
				return { isValid: true }; // Don't block if server is unreachable
			}
		};

		// Validate diagramSchema fields (structureDiagram and flowDiagram)
		const validateDiagram = async (
			diagram: any,
			diagramName: string
		) => {
			if (!diagram) {
				errors.push(`El diagrama ${diagramName} no puede estar vacío.`);
				return;
			}

			// Check if usesPlantText is explicitly set
			if (diagram.usesPlantText === true) {
				console.log("Diagram uses PlantText: ", diagram.plantTextCode);
				if (!diagram.plantTextCode || diagram.plantTextCode.trim() === "") {
					errors.push(`El código PlantText del diagrama ${diagramName} no puede estar vacío cuando usesPlantText está activado.`);
				} else {
					// Validate that the plantTextCode is valid by calling PlantUML server
					const validation = await validatePlantUMLCode(diagram.plantTextCode);
					if (!validation.isValid) {
						errors.push(`El código PlantText del diagrama ${diagramName} contiene errores de sintaxis: ${validation.error || "código inválido"}`);
					}
				}
				
				// Check if there's an image and add warning
				if (diagram.imageFileId && diagram.imageFileId !== null) {
					warnings.push(`Se eliminará la imagen del diagrama ${diagramName} ya que se está usando PlantText.`);
					// Remove the image
					diagram.imageFileId = null;
				}
			} else if (diagram.usesPlantText === false) {
				console.log("Diagram does not use PlantText, imageFileId: ", diagram.imageFileId);
				if (!diagram.imageFileId || diagram.imageFileId === null) {
					errors.push(`El diagrama ${diagramName} debe tener una imagen cuando usesPlantText está desactivado.`);
				}
				
			} else {
				// usesPlantText is undefined - diagram is not properly configured
				errors.push(`El diagrama ${diagramName} debe especificar si usa PlantText o una imagen.`);
			}
		};

		// Validate structureDiagram if the object exists
		if (model.structureDiagram) {
			console.log("Structure Diagram: ", model.structureDiagram);
			await validateDiagram(model.structureDiagram, "de estructura");
		}

		// Validate flowDiagram if the object exists
		if (model.flowDiagram) {
			console.log("Flow Diagram: ", model.flowDiagram);
			await validateDiagram(model.flowDiagram, "de flujo");
		}

		// Validate inputs
		if (model.inputs.length === 0) {
			errors.push("Debe tener al menos una entrada.");
		}
		else if (model.inputs && model.inputs.length > 0) {
			model.inputs.forEach((input: Input, index: number) => {
				if (!input.description || input.description.trim() === "") {
					errors.push(`La entrada ${index + 1} debe tener una descripción.`);
				}
			});
		}

		// Validate outputs
		if (model.outputs.length === 0) {
			errors.push("Debe tener al menos una salida.");
		}
		else if (model.outputs && model.outputs.length > 0) {
			model.outputs.forEach((output: Output, index: number) => {
				if (!output.description || output.description.trim() === "") {
					errors.push(`La salida ${index + 1} debe tener una descripción.`);
				}
				if (!output.entity || output.entity.trim() === "") {
					errors.push(`La salida ${index + 1} debe tener una entidad asignada.`);
				}
			});
		}

		if (!model.entities || !model.entities.length) {
			errors.push('El modelo debe tener al menos una entidad definida.')
		}

		// Validate entities
		if (model.entities) {
			for (let entityIndex = 0; entityIndex < model.entities.length; entityIndex++) {
				const entity: Entity = model.entities[entityIndex];
				const entityName = entity.name || `Entidad ${entityIndex + 1}`;

				// Check if entity has empty dynamicDiagram
				// An entity can't have an empty dynamicDiagram
				if (
					!entity.dynamicDiagram ||
					(entity.dynamicDiagram.usesPlantText === undefined &&
						!entity.dynamicDiagram.imageFileId &&
						(!entity.dynamicDiagram.plantTextCode || entity.dynamicDiagram.plantTextCode.trim() === ""))
				) {
					errors.push(`La entidad "${entityName}" no puede tener un diagrama de dinamica vacío.`);
				}

				// Validate dynamicDiagram if it exists and has content
				if (entity.dynamicDiagram && (
					entity.dynamicDiagram.usesPlantText !== undefined ||
					entity.dynamicDiagram.imageFileId ||
					(entity.dynamicDiagram.plantTextCode && entity.dynamicDiagram.plantTextCode.trim() !== "")
				)) {
					await validateDiagram(entity.dynamicDiagram, `de dinamica de la entidad "${entityName}"`);
				}

				if (entity.scopeDecision === undefined) {
					errors.push(`La entidad "${entityName}" debe marcarse como incluida o excluida del modelo.`);
				}

				//check if at least one entity from the list of entites has scopeDecision.include === true
				console.log("Entities: ", model.entities.some((e: Entity) => (e.scopeDecision?.include) as boolean === true));
				if (model.entities.every((e: Entity) => e.scopeDecision?.include === false)) {
					errors.push("Debe tener al menos una entidad incluída en el alcance del modelo.");
				}

				if (entity.scopeDecision?.include === false ) {
					// If include is false, shouldn't have properties
					if (entity.properties && entity.properties.length > 0) {
						warnings.push(`La entidad "${entityName}" no se encuentra incluída en el alcance por lo que no puede tener propiedades asignadas.`);
					}
				} else if (entity.scopeDecision?.include === true) {
					// If include is true, validate argumentType
					if (
						entity.scopeDecision.argumentType === "NO VINCULADO A OBJETIVOS" ||
						entity.scopeDecision.argumentType === "SIMPLIFICACION"
					) {
						errors.push(
							`La entidad "${entityName}" se encuentra incluída en el alcance por lo que no puede tener como tipo de argumento los valores "NO VINCULADO A OBJETIVOS" ni "SIMPLIFICACION".`
						);
					}

					// Must have at least one property
					if (!entity.properties || entity.properties.length === 0) {
						errors.push(`La entidad "${entityName}" debe tener al menos una propiedad cuando scopeDecision.include es true.`);
					} else {
						// Validate each property
						for (let propIndex = 0; propIndex < entity.properties.length; propIndex++) {
							const property = entity.properties[propIndex];
							if (!property.name || property.name.trim() === "") {
								errors.push(`La propiedad ${propIndex + 1} de la entidad "${entityName}" debe tener un nombre.`);
							}
							if (
								!property.detailLevelDecision?.justification ||
								property.detailLevelDecision.justification.trim() === ""
							) {
								errors.push(
									`La propiedad ${propIndex + 1} de la entidad "${entityName}" no puede tener una justificación vacía.`
								);
							}
							if (property.detailLevelDecision?.include === true) {
								if (property.detailLevelDecision.argumentType === "SIMPLIFICACION") {
									errors.push(
										`La propiedad ${propIndex + 1} de la entidad "${entityName}" está incluída en el alcance por lo que no puede tener como tipo de argumento el valor "SIMPLIFICACION".`
									);
								}
							}
						}
					}
				}
			}
		}

		// If there are no errors, update the version state to "FINALIZADA"
		if (errors.length === 0) {
			// Save the model with any image removals
			await VersionModel.findByIdAndUpdate(versionId, {
				$set: {
					conceptualModel: model,
					state: "FINALIZADA",
				},
			}).exec();
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}
}
