import mongoose from "mongoose";
import { ProjectModel, RevisionModel, UserModel, Version, VersionModel } from "../../data";
import {
	CreateVersionDto,
	CustomError,
	ShareVersionDto,
	ShareVersionLinkDto,
} from "../../domain";
import { VersionImage, VersionImageModel } from "../../data/mongo/models/version-image.model";
import { jwtAdapter } from "../../config";
import { VersionShareTokenPayload } from "../../types/tokens";
import { EmailService } from "./email.service";
import { notificationService } from "./notification.service";
import { NotificationType } from "../../data";
import {
	Assumption,
	Input,
	Simplification,
	Output,
	Entity,
	ConceptualModel,
	Diagram,
} from "../../data/mongo/models/subdocuments-schemas";
import fs from "fs";
import path from "path";

const plantumlEncoder = require("plantuml-encoder");

// Valid states for parent versions
const VALID_PARENT_VERSION_STATES = [
	"FINALIZADA",
	"PENDIENTE DE REVISION",
	"REVISADA",
];

const VERSION_SHAREABLE_STATES = ["FINALIZADA", "PENDIENTE DE REVISION", "REVISADA"];

export class VersionService {
	constructor(
		private readonly frontEndUrl?: string,
		private readonly emailService?: EmailService
	) {}

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
			state: { $ne: "ELIMINADA" },
		}).exec();

		if (existingVersions.length > 0) {
			throw CustomError.badRequest(
				"Ya existe una versión con el mismo nombre en este proyecto.",
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
				const parentVersion = await VersionModel.findById(
					createDto.parentVersionId,
				).exec();

				if (!parentVersion) {
					throw CustomError.notFound(
						"La versión padre especificada no existe.",
					);
				}

				// Validate parent version state
				if (!VALID_PARENT_VERSION_STATES.includes(parentVersion.state)) {
					throw CustomError.badRequest(
						`La versión padre debe estar en estado ${VALID_PARENT_VERSION_STATES.join(", ")}. Estado actual: ${parentVersion.state}`,
					);
				}

				// Deep copy of conceptual model (without _id to let mongoose generate new ones)
				const copiedConceptualModel = this.deepCopyConceptualModel(
					parentVersion.conceptualModel,
				);

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

			// If creating from parent, copy images and regenerate PlantText tokens
			if (createDto.parentVersionId) {
				await this.copyImagesAndRegenerateTokens(
					createDto.parentVersionId,
					newVersion._id.toString(),
					newVersion.conceptualModel
				);
				// Save again after updating image references
				await newVersion.save();
			}

			// Add version to project's versions array
			await ProjectModel.findByIdAndUpdate(createDto.projectId, {
				$push: { versions: newVersion._id },
			}).exec();

			return {
				version: {
					id: newVersion._id.toString(),
					title: newVersion.title,
					state: newVersion.state,
					parentVersion: newVersion.parentVersion
						? {
								id: newVersion.parentVersion.toString(),
							}
						: null,
				},
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
			structureDiagram: {},
			flowDiagram: {},
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

		// Note: imageFileId references are preserved here but will be updated
		// by copyImagesAndRegenerateTokens() after the version is created

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
		if (!obj || typeof obj !== "object") return;

		if (Array.isArray(obj)) {
			obj.forEach((item) => this.removeIds(item));
		} else {
			delete obj._id;
			delete obj.id;
			Object.values(obj).forEach((value) => {
				if (typeof value === "object" && value !== null) {
					this.removeIds(value);
				}
			});
		}
	}

	/**
	 * Copy images from parent version to new version and regenerate PlantText tokens
	 */
	private async copyImagesAndRegenerateTokens(
		parentVersionId: string,
		newVersionId: string,
		conceptualModel: any
	): Promise<void> {
		try {
			// Get all images from parent version
			const parentImages = await VersionImageModel.find({
				version: new mongoose.Types.ObjectId(parentVersionId),
			}).lean();

			// Create a mapping of old image IDs to new image IDs
			const imageIdMap = new Map<string, string>();

			// Copy each image
			for (const parentImage of parentImages) {
				const newImageId = await this.copyVersionImage(
					parentImage as any,
					newVersionId
				);
				if (newImageId) {
					imageIdMap.set(parentImage._id.toString(), newImageId);
				}
			}

			// Update imageFileId references in the conceptual model and regenerate tokens
			this.updateDiagramReferencesAndTokens(
				conceptualModel,
				imageIdMap
			);
		} catch (error) {
			console.error("Error copying images and regenerating tokens:", error);
			// Don't throw - version creation should still succeed even if image copying fails
		}
	}

	/**
	 * Copy a single version image file and create new database record
	 */
	private async copyVersionImage(
		parentImage: any,
		newVersionId: string
	): Promise<string | null> {
		try {
			// Check if source file exists
			if (!fs.existsSync(parentImage.path)) {
				console.warn(`Source image file not found: ${parentImage.path}`);
				return null;
			}

			// Create destination directory
			const baseUploadDir = `${process.cwd()}/uploads`;
			const newVersionDir = `${baseUploadDir}/${newVersionId}/conceptual-model`;
			fs.mkdirSync(newVersionDir, { recursive: true });

			// Generate new filename with timestamp to avoid conflicts
			const timestamp = Date.now();
			const ext = path.extname(parentImage.filename);
			const baseName = path.basename(parentImage.filename, ext);
			const newFilename = `${baseName}-${timestamp}${ext}`;
			const newFilePath = path.join(newVersionDir, newFilename);

			// Copy the file
			fs.copyFileSync(parentImage.path, newFilePath);

			// Create new VersionImage record
			const newVersionImage = new VersionImageModel({
				filename: newFilename,
				originalFilename: parentImage.originalFilename,
				sizeInBytes: parentImage.sizeInBytes,
				mimeType: parentImage.mimeType,
				path: newFilePath,
				version: new mongoose.Types.ObjectId(newVersionId),
			});

			// Generate URL (using the same base URL pattern as UploadService)
			const uploadServiceBaseUrl = `${process.env.WEBSERVICE_URL || "http://localhost:3000"}/uploads`;
			newVersionImage.url = `${uploadServiceBaseUrl}/${newVersionImage._id}`;

			await newVersionImage.save();

			return newVersionImage._id.toString();
		} catch (error) {
			console.error("Error copying version image:", error);
			return null;
		}
	}

	/**
	 * Update imageFileId references in diagrams and regenerate PlantText tokens
	 */
	private updateDiagramReferencesAndTokens(
		conceptualModel: any,
		imageIdMap: Map<string, string>
	): void {
		// Helper to process a single diagram
		const processDiagram = (diagram: any) => {
			if (!diagram) return;

			// Regenerate PlantText token if using PlantText
			if (diagram.usePlantText && diagram.plantTextCode) {
				diagram.plantTextToken = plantumlEncoder.encode(diagram.plantTextCode);
			}

			// Update imageFileId if it exists and has a mapping
			if (diagram.imageFileId) {
				const oldId = diagram.imageFileId.toString();
				const newId = imageIdMap.get(oldId);
				if (newId) {
					diagram.imageFileId = new mongoose.Types.ObjectId(newId);
				}
			}
		};

		// Process structure diagram
		processDiagram(conceptualModel.structureDiagram);

		// Process flow diagram
		processDiagram(conceptualModel.flowDiagram);

		// Process entity dynamic diagrams
		if (conceptualModel.entities && Array.isArray(conceptualModel.entities)) {
			for (const entity of conceptualModel.entities) {
				processDiagram(entity.dynamicDiagram);
			}
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
			projectTitle?: string;
			ownerName?: string;
		};
	}> {
		const pipeline: mongoose.PipelineStage[] = [
			{
				$match: { _id: new mongoose.Types.ObjectId(id) },
			},
			{
				$lookup: {
					from: "projects",
					foreignField: "versions",
					localField: "_id",
					as: "projectDoc",
				},
			},
			{
				$unwind: {
					path: "$projectDoc",
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "projectDoc.owner",
					foreignField: "_id",
					as: "ownerDoc",
				},
			},
			{
				$unwind: {
					path: "$ownerDoc",
					preserveNullAndEmptyArrays: true,
				},
			},
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
				$addFields: {
					id: { $toString: "$_id" },
					projectTitle: "$projectDoc.title",
					ownerName: {
						$trim: {
							input: {
								$concat: [
									{ $ifNull: ["$ownerDoc.name", ""] },
									" ",
									{ $ifNull: ["$ownerDoc.lastName", ""] },
								],
							},
						},
					},
				},
			},
			{
				$project: {
					_id: 0,
					projectDoc: 0,
					ownerDoc: 0,
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
	}): Promise<{ canRead: boolean, canWrite: boolean }> {
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
					path: "$project",
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
		let canRead = false;
		let canWrite = false;

		const isOwner = usersWithAccess.project.owner.equals(userId);
		if (isOwner) {
			canRead = true;
			canWrite = true;
		}

		const isCollaborator = usersWithAccess.project.collaborators.some((c) =>
			c.equals(userId),
		);
		if (isCollaborator) {
			canRead = true;
			canWrite = true;
		}

		const isReader = usersWithAccess.sharedWithReaders.some((r) =>
			r.equals(userId),
		);
		if (isReader) {
			canRead = true;
			canWrite = false;
		}

		return { canRead, canWrite };
	}


	/**
	 * Returns whether the user can export and request revision for this version
	 * (owner or collaborator). Shared readers get false.
	 * Use for safeguards in both editing and read-only views.
	 */
	async checkVersionAccess(
		versionId: string,
		userId: string
	): Promise<{ canRead: boolean, canWrite: boolean }> {
		const accessCheck = await this.hasUserReadAccessToVersion({
			versionId,
			userId,
		});
	
		return accessCheck;
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
				"Sólo se puede eliminar una versión que se encuentra en estado 'en edición'.",
			);
		}

		// Find the project that contains this version to verify ownership
		const project = await ProjectModel.findOne({
			versions: versionId,
		}).exec();

		if (!project) {
			throw CustomError.notFound(
				"No se encontró el proyecto asociado a esta versión.",
			);
		}

		// Check if the user is the project owner
		if (!project.owner.equals(userId)) {
			throw CustomError.forbidden(
				"Solo el propietario del proyecto puede eliminar versiones.",
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
				"Se ha producido un error, por favor inténtelo de nuevo más tarde.",
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
			model.simplifications.forEach(
				(simplification: Simplification, index: number) => {
					if (
						!simplification.description ||
						simplification.description.trim() === ""
					) {
						errors.push(
							`La simplificación ${index + 1} debe tener una descripción.`,
						);
					}
				},
			);
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
		const validatePlantUMLCode = async (
			plantTextCode: string,
		): Promise<{ isValid: boolean; error?: string }> => {
			try {
				const encoded = plantumlEncoder.encode(plantTextCode);
				// Use the /txt/ endpoint to get text output - errors are clearly indicated in the response
				const response = await fetch(
					`http://www.plantuml.com/plantuml/txt/${encoded}`,
				);

				if (!response.ok) {
					return {
						isValid: false,
						error: "No se pudo validar el código PlantText con el servidor.",
					};
				}

				const textOutput = await response.text();

				// Check for common error indicators in PlantUML text output
				if (
					textOutput.includes("Syntax Error") ||
					(textOutput.includes("@startuml") === false &&
						textOutput.includes("Error")) ||
					textOutput.includes("Not valid")
				) {
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
		const validateDiagram = async (diagram: any, diagramName: string) => {
			if (!diagram) {
				errors.push(`El diagrama ${diagramName} no puede estar vacío.`);
				return;
			}

			// Check if usePlantText is explicitly set
			if (diagram.usePlantText === true) {
				console.log("Diagram uses PlantText: ", diagram.plantTextCode);
				if (!diagram.plantTextCode || diagram.plantTextCode.trim() === "") {
					errors.push(
						`El código PlantText del diagrama ${diagramName} no puede estar vacío cuando usePlantText está activado.`,
					);
				} else {
					// Validate that the plantTextCode is valid by calling PlantUML server
					const validation = await validatePlantUMLCode(diagram.plantTextCode);
					if (!validation.isValid) {
						errors.push(
							`El código PlantText del diagrama ${diagramName} contiene errores de sintaxis: ${validation.error || "código inválido"}`,
						);
					}
				}

				// Check if there's an image and add warning
				if (diagram.imageFileId && diagram.imageFileId !== null) {
					warnings.push(
						`Se eliminará la imagen del diagrama ${diagramName} ya que se está usando PlantText.`,
					);
					// Remove the image
					diagram.imageFileId = null;
				}
			} else if (diagram.usePlantText === false) {
				console.log(
					"Diagram does not use PlantText, imageFileId: ",
					diagram.imageFileId,
				);
				if (!diagram.imageFileId || diagram.imageFileId === null) {
					errors.push(
						`El diagrama ${diagramName} debe tener una imagen cuando usePlantText está desactivado.`,
					);
				}
			} else {
				// usePlantText is undefined - diagram is not properly configured
				errors.push(
					`El diagrama ${diagramName} debe especificar si usa PlantText o una imagen.`,
				);
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
		} else if (model.inputs && model.inputs.length > 0) {
			model.inputs.forEach((input: Input, index: number) => {
				if (!input.description || input.description.trim() === "") {
					errors.push(`La entrada ${index + 1} debe tener una descripción.`);
				}
			});
		}

		// Validate outputs
		if (model.outputs.length === 0) {
			errors.push("Debe tener al menos una salida.");
		} else if (model.outputs && model.outputs.length > 0) {
			model.outputs.forEach((output: Output, index: number) => {
				if (!output.description || output.description.trim() === "") {
					errors.push(`La salida ${index + 1} debe tener una descripción.`);
				}
				if (!output.entity || output.entity.trim() === "") {
					errors.push(
						`La salida ${index + 1} debe tener una entidad asignada.`,
					);
				}
			});
		}

		if (!model.entities || !model.entities.length) {
			errors.push("El modelo debe tener al menos una entidad definida.");
		}

		// Validate entities
		if (model.entities) {
			for (
				let entityIndex = 0;
				entityIndex < model.entities.length;
				entityIndex++
			) {
				const entity: Entity = model.entities[entityIndex];
				const entityName = entity.name || `Entidad ${entityIndex + 1}`;

				// Check if entity has empty dynamicDiagram
				// An entity can't have an empty dynamicDiagram
				if (
					!entity.dynamicDiagram ||
					(entity.dynamicDiagram.usePlantText === undefined &&
						!entity.dynamicDiagram.imageFileId &&
						(!entity.dynamicDiagram.plantTextCode ||
							entity.dynamicDiagram.plantTextCode.trim() === ""))
				) {
					errors.push(
						`La entidad "${entityName}" no puede tener un diagrama de dinamica vacío.`,
					);
				}

				// Validate dynamicDiagram if it exists and has content
				if (
					entity.dynamicDiagram &&
					(entity.dynamicDiagram.usePlantText !== undefined ||
						entity.dynamicDiagram.imageFileId ||
						(entity.dynamicDiagram.plantTextCode &&
							entity.dynamicDiagram.plantTextCode.trim() !== ""))
				) {
					await validateDiagram(
						entity.dynamicDiagram,
						`de dinamica de la entidad "${entityName}"`,
					);
				}

				if (entity.scopeDecision === undefined) {
					errors.push(
						`La entidad "${entityName}" debe marcarse como incluida o excluida del modelo.`,
					);
				}

				//check if at least one entity from the list of entites has scopeDecision.include === true
				console.log(
					"Entities: ",
					model.entities.some(
						(e: Entity) => (e.scopeDecision?.include as boolean) === true,
					),
				);
				if (
					model.entities.every(
						(e: Entity) => e.scopeDecision?.include === false,
					)
				) {
					errors.push(
						"Debe tener al menos una entidad incluída en el alcance del modelo.",
					);
				}

				if (entity.scopeDecision?.include === false) {
					// If include is false, shouldn't have properties
					if (entity.properties && entity.properties.length > 0) {
						warnings.push(
							`La entidad "${entityName}" no se encuentra incluída en el alcance por lo que no puede tener propiedades asignadas.`,
						);
					}
				} else if (entity.scopeDecision?.include === true) {
					// If include is true, validate argumentType
					if (
						entity.scopeDecision.argumentType === "NO VINCULADO A OBJETIVOS" ||
						entity.scopeDecision.argumentType === "SIMPLIFICACION"
					) {
						errors.push(
							`La entidad "${entityName}" se encuentra incluída en el alcance por lo que no puede tener como tipo de argumento los valores "NO VINCULADO A OBJETIVOS" ni "SIMPLIFICACION".`,
						);
					}

					// Must have at least one property
					if (!entity.properties || entity.properties.length === 0) {
						errors.push(
							`La entidad "${entityName}" debe tener al menos una propiedad cuando scopeDecision.include es true.`,
						);
					} else {
						// Validate each property
						for (
							let propIndex = 0;
							propIndex < entity.properties.length;
							propIndex++
						) {
							const property = entity.properties[propIndex];
							if (!property.name || property.name.trim() === "") {
								errors.push(
									`La propiedad ${propIndex + 1} de la entidad "${entityName}" debe tener un nombre.`,
								);
							}
							if (
								!property.detailLevelDecision?.justification ||
								property.detailLevelDecision.justification.trim() === ""
							) {
								errors.push(
									`La propiedad ${propIndex + 1} de la entidad "${entityName}" no puede tener una justificación vacía.`,
								);
							}
							if (property.detailLevelDecision?.include === true) {
								if (
									property.detailLevelDecision.argumentType === "SIMPLIFICACION"
								) {
									errors.push(
										`La propiedad ${propIndex + 1} de la entidad "${entityName}" está incluída en el alcance por lo que no puede tener como tipo de argumento el valor "SIMPLIFICACION".`,
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

	/**
	 * Get version for read-only view (MODELADOR viewing their version)
	 * Includes revision corrections if version is in REVISADA state
	 */
	async getVersionForReadOnlyView(versionId: string, userId: string) {
		try {
			// Find the version
			const version = await VersionModel.findById(versionId)
				.populate("revision")
				.lean();

			if (!version) {
				throw CustomError.notFound("La versión especificada no existe.");
			}

			// Check if user has read access (owner, collaborator, shared reader, or verifier)
			const hasAccess = await this.hasUserReadAccessToVersion({
				versionId,
				userId,
			});
			if (!hasAccess) {
				throw CustomError.forbidden(
					"No tiene permisos para ver esta versión."
				);
			}

			const project = await ProjectModel.findOne({
				versions: new mongoose.Types.ObjectId(versionId),
			})
				.populate("owner", "name lastName")
				.lean();

			if (!project) {
				throw CustomError.notFound(
					"No se encontró el proyecto asociado a esta versión."
				);
			}

			// Get image infos for this version
			const imageInfos = await VersionImageModel.find({
				version: new mongoose.Types.ObjectId(versionId),
			})
				.select("_id originalFilename sizeInBytes url createdAt fieldPath")
				.lean();

			// Get revision with corrections if version is REVISADA
			let revisionData = null;
			if (version.state === "REVISADA" && version.revision) {
				const revision = await RevisionModel.findById(version.revision)
					.populate("verifier", "name lastName")
					.lean();

				if (revision) {
					revisionData = {
						id: (revision._id as any).toString(),
						state: revision.state,
						finalReview: revision.finalReview || "",
						verifier: revision.verifier
							? {
									id: (revision.verifier as any)._id.toString(),
									name: `${(revision.verifier as any).name} ${(revision.verifier as any).lastName}`,
							  }
							: null,
						corrections: (revision.corrections || []).map((c: any) => ({
							_id: c._id?.toString(),
							description: c.description,
							location: {
								x: c.location?.x || 0,
								y: c.location?.y || 0,
								page: c.location?.page || 0,
							},
							multimediaFilePath: c.multimediaFilePath,
						})),
					};
				}
			}
			//usersRightsForVersions - userCanWrite userCanRead  true/false
			return {
				version: {
					id: (version._id as any).toString(),
					title: version.title,
					state: version.state,
					conceptualModel: version.conceptualModel,
				},
				project: {
					id: project._id.toString(),
					title: project.title,
					owner: {
						id: (project.owner as any)._id.toString(),
						name: `${(project.owner as any).name} ${(project.owner as any).lastName}`,
					},
				},
				revision: revisionData,
				imageInfos: imageInfos.map((img: any) => ({
					id: img._id.toString(),
					originalFilename: img.originalFilename,
					sizeInBytes: img.sizeInBytes,
					url: img.url,
					createdAt: img.createdAt,
					fieldPath: img.fieldPath,
				})),
			};
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}
			console.error("Error getting version for read-only view:", error);
			throw CustomError.internalServer(
				"Se ha producido un error al obtener la versión."
			);
		}
	}

	// -------- Share version (read-only) --------

	private async generateVersionShareLink(
		payload: VersionShareTokenPayload
	): Promise<string> {
		if (!this.frontEndUrl) {
			throw CustomError.internalServer(
				"Configuración de compartir versión no disponible."
			);
		}
		const token = await jwtAdapter.generateToken(payload, "7d");
		if (!token) {
			throw CustomError.internalServer(
				"Se produjo un error al generar el link para compartir la versión."
			);
		}
		return `${this.frontEndUrl}/share/versions/?token=${token}`;
	}

	/** Returns { fullLink, token } for use in emails and in-app notification links. */
	private async generateVersionShareLinkAndToken(
		payload: VersionShareTokenPayload
	): Promise<{ fullLink: string; token: string }> {
		if (!this.frontEndUrl) {
			throw CustomError.internalServer(
				"Configuración de compartir versión no disponible."
			);
		}
		const raw = await jwtAdapter.generateToken(payload, "7d");
		if (typeof raw !== "string") {
			throw CustomError.internalServer(
				"Se produjo un error al generar el link para compartir la versión."
			);
		}
		const token: string = raw;
		return {
			fullLink: `${this.frontEndUrl}/share/versions/?token=${token}`,
			token,
		};
	}

	async getVersionSharingLink(dto: ShareVersionLinkDto) {
		const version = await VersionModel.findById(dto.versionId).exec();
		if (!version) {
			throw CustomError.notFound("La versión especificada no existe.");
		}
		if (version.state === "ELIMINADA") {
			throw CustomError.badRequest("La versión fue eliminada.");
		}
		if (!VERSION_SHAREABLE_STATES.includes(version.state)) {
			throw CustomError.badRequest(
				"Solo se puede compartir una versión que no esté en estado 'EN EDICION'."
			);
		}
		const project = await ProjectModel.findOne({
			versions: version._id,
		}).exec();
		if (!project) {
			throw CustomError.notFound("No se encontró el proyecto de la versión.");
		}
		if (!project.owner.equals(dto.requestingUser)) {
			throw CustomError.unauthorized(
				"Solo el propietario del proyecto puede compartir la versión."
			);
		}
		const link = await this.generateVersionShareLink({
			requestingUser: dto.requestingUser,
			versionId: dto.versionId,
		});
		return {
			message: "El link para compartir la versión fue generado correctamente.",
			shareLink: link,
		};
	}

	async sendVersionShareInvitation(dto: ShareVersionDto) {
		const version = await VersionModel.findById(dto.versionId).exec();
		if (!version) {
			throw CustomError.notFound("La versión especificada no existe.");
		}
		if (version.state === "ELIMINADA") {
			throw CustomError.badRequest("La versión fue eliminada.");
		}
		if (!VERSION_SHAREABLE_STATES.includes(version.state)) {
			throw CustomError.badRequest(
				"Solo se puede compartir una versión que no esté en estado 'EN EDICION'."
			);
		}
		const project = await ProjectModel.findOne({
			versions: version._id,
		}).exec();
		if (!project) {
			throw CustomError.notFound("No se encontró el proyecto de la versión.");
		}
		if (!project.owner.equals(dto.senderId)) {
			throw CustomError.unauthorized(
				"Solo el propietario del proyecto puede compartir la versión."
			);
		}
		if (!this.emailService) {
			throw CustomError.internalServer(
				"El envío de invitaciones por email no está configurado."
			);
		}
		const uniqueEmails = new Set<string>(dto.emails);
		const { fullLink: link, token: shareToken } =
			await this.generateVersionShareLinkAndToken({
				requestingUser: dto.senderId,
				versionId: dto.versionId,
			});
		const html = `<h1>Te han compartido una versión para solo lectura</h1>
      <p>Hacé clic en el siguiente <a href="${link}">link</a> para acceder a la versión.</p>
      <p><strong>Recordá que en caso de no tener cuenta primero deberás registrarte para poder acceder.</strong></p>`;
		for (const email of uniqueEmails) {
			await this.emailService.sendEmail({
				to: email,
				subject: "MFLOW - Versión compartida para lectura",
				htmlBody: html,
			});
		}
		// In-app notification for recipients who are already platform users
		for (const email of uniqueEmails) {
			try {
				const user = await UserModel.findOne({
					email,
					deletedAt: null,
				}).exec();
				if (!user) continue;
				if (project.owner.equals(user._id)) continue;
				if (project.collaborators.some((c) => c.equals(user._id))) continue;
				if (version.sharedWithReaders.some((r) => r.equals(user._id)))
					continue;
				await notificationService.createNotification({
					recipientId: user._id.toString(),
					type: NotificationType.VERSION_SHARED,
					title: "Te han invitado a ver una versión",
					message: `Te han invitado a ver la versión "${version.title}" del proyecto "${project.title}" (solo lectura).`,
					link: `/share/versions?token=${shareToken}`,
					relatedProjectId: project._id.toString(),
					relatedVersionId: version._id.toString(),
					triggeredById: dto.senderId,
				});
			} catch (notifError) {
				console.error("Error creating version-share notification for", email, notifError);
			}
		}
		return {
			message: "Las invitaciones se enviaron correctamente.",
			request: Array.from(uniqueEmails),
		};
	}

	async addReaderToVersion(token: string, newReaderUserId: string) {
		const payload = await jwtAdapter.validateToken(token);
		if (!payload) {
			throw CustomError.unauthorized("El token de invitación es inválido.");
		}
		const { requestingUser, versionId } = payload as VersionShareTokenPayload;
		if (!versionId || !requestingUser) {
			throw CustomError.unauthorized("El token de invitación es inválido.");
		}
		const version = await VersionModel.findById(versionId).exec();
		if (!version) {
			throw CustomError.notFound(
				"La versión asociada a la invitación no existe o fue eliminada."
			);
		}
		if (version.state === "ELIMINADA") {
			throw CustomError.badRequest("La versión fue eliminada.");
		}
		const user = await UserModel.findOne({
			_id: newReaderUserId,
			deletedAt: null,
		});
		if (!user) {
			throw CustomError.unauthorized(
				"El usuario debe encontrarse registrado en la plataforma."
			);
		}
		const project = await ProjectModel.findOne({ versions: version._id }).exec();
		if (!project) {
			throw CustomError.notFound("No se encontró el proyecto de la versión.");
		}
		if (project.owner.equals(user._id)) {
			throw CustomError.badRequest(
				"El dueño del proyecto ya tiene acceso a la versión."
			);
		}
		if (project.collaborators.some((c) => c.equals(user._id))) {
			throw CustomError.badRequest(
				"El colaborador del proyecto ya tiene acceso a la versión."
			);
		}
		if (version.sharedWithReaders.some((r) => r.equals(user._id))) {
			throw CustomError.badRequest(
				"El usuario ya tiene acceso de lectura a esta versión."
			);
		}
		version.sharedWithReaders.push(user._id);
		await version.save();

		try {
			await notificationService.createNotification({
				recipientId: user._id.toString(),
				type: NotificationType.VERSION_SHARED,
				title: "Te han invitado a ver una versión",
				message: `Te han dado acceso de lectura a la versión "${version.title}" del proyecto "${project.title}".`,
				link: `/versions/${version._id.toString()}/view`,
				relatedProjectId: project._id.toString(),
				relatedVersionId: version._id.toString(),
				triggeredById: requestingUser,
			});
		} catch (notifError) {
			console.error("Error creating version-share notification:", notifError);
		}

		return {
			message: "Se te ha dado acceso de lectura a la versión.",
			versionId: version._id.toString(),
		};
	}

	async getVersionFromShareToken(token: string) {
		const payload = await jwtAdapter.validateToken(token);
		if (!payload) {
			throw CustomError.unauthorized("El token de invitación es inválido.");
		}
		const { versionId } = payload as VersionShareTokenPayload;
		if (!versionId) {
			throw CustomError.unauthorized("El token de invitación es inválido.");
		}
		const version = await VersionModel.findById(versionId)
			.populate("parentVersion", "title")
			.lean();
		if (!version) {
			throw CustomError.notFound(
				"La versión asociada a la invitación no existe o fue eliminada."
			);
		}
		if (version.state === "ELIMINADA") {
			throw CustomError.badRequest("La versión fue eliminada.");
		}
		const project = await ProjectModel.findOne({
			versions: new mongoose.Types.ObjectId(versionId),
		})
			.populate("owner", "name lastName")
			.lean();
		if (!project) {
			throw CustomError.notFound("No se encontró el proyecto de la versión.");
		}
		return {
			version: {
				id: (version._id as any).toString(),
				title: version.title,
				state: version.state,
				parentVersion: version.parentVersion
					? {
							id: (version.parentVersion as any)._id.toString(),
							title: (version.parentVersion as any).title,
					  }
					: null,
			},
			project: {
				id: (project._id as any).toString(),
				title: (project as any).title,
				owner: {
					id: (project.owner as any)._id.toString(),
					name: `${(project.owner as any).name} ${(project.owner as any).lastName}`,
				},
			},
		};
	}

	async getVersionWithReaders(versionId: string, requestingUserId: string) {
		const version = await VersionModel.findById(versionId)
			.populate("sharedWithReaders", "name lastName email")
			.populate("parentVersion", "title")
			.lean();
		if (!version) {
			throw CustomError.notFound("La versión especificada no existe.");
		}
		const project = await ProjectModel.findOne({
			versions: new mongoose.Types.ObjectId(versionId),
		}).exec();
		if (!project) {
			throw CustomError.notFound("No se encontró el proyecto de la versión.");
		}
		if (!project.owner.equals(requestingUserId)) {
			throw CustomError.unauthorized(
				"Solo el propietario del proyecto puede ver y gestionar los lectores."
			);
		}
		const readers = (version.sharedWithReaders || []).map((r: any) => ({
			id: r._id.toString(),
			email: r.email,
			name: r.name,
			lastName: r.lastName,
		}));
		return {
			version: {
				id: (version._id as any).toString(),
				title: version.title,
				state: version.state,
				parentVersion: version.parentVersion
					? {
							id: (version.parentVersion as any)._id.toString(),
							title: (version.parentVersion as any).title,
					  }
					: null,
			},
			readers,
		};
	}

	async removeReaderFromVersion({
		versionId,
		readerId,
		requestingUserId,
	}: {
		versionId: string;
		readerId: string;
		requestingUserId: string;
	}) {
		const version = await VersionModel.findById(versionId).exec();
		if (!version) {
			throw CustomError.notFound("La versión especificada no existe.");
		}
		const project = await ProjectModel.findOne({
			versions: version._id,
		}).exec();
		if (!project) {
			throw CustomError.notFound("No se encontró el proyecto de la versión.");
		}
		if (!project.owner.equals(requestingUserId)) {
			throw CustomError.unauthorized(
				"Solo el propietario del proyecto puede remover lectores."
			);
		}
		await VersionModel.updateOne(
			{ _id: versionId },
			{ $pull: { sharedWithReaders: new mongoose.Types.ObjectId(readerId) } }
		).exec();
		return { message: "Lector removido correctamente." };
	}

	async getSharedVersionsForUser(userId: string) {
		const versions = await VersionModel.find({
			sharedWithReaders: new mongoose.Types.ObjectId(userId),
			state: { $ne: "ELIMINADA" },
		})
			.populate("parentVersion", "title")
			.lean();
		const result: {
			id: string;
			title: string;
			state: string;
			parentVersion: { id: string; title: string } | null;
			projectId: string;
			projectTitle: string;
		}[] = [];
		for (const v of versions) {
			const project = await ProjectModel.findOne({
				versions: (v as any)._id,
			})
				.select("_id title")
				.lean();
			if (project) {
				result.push({
					id: (v as any)._id.toString(),
					title: (v as any).title,
					state: (v as any).state,
					parentVersion: (v as any).parentVersion
						? {
								id: (v as any).parentVersion._id.toString(),
								title: (v as any).parentVersion.title,
						  }
						: null,
					projectId: (project as any)._id.toString(),
					projectTitle: (project as any).title,
				});
			}
		}
		return { versions: result };
	}
}
