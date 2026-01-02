import mongoose from "mongoose";
import { ProjectModel, Version, VersionModel } from "../../data";
import {
	CreateVersionDto,
	CustomError,
} from "../../domain";
import { VersionImage } from "../../data/mongo/models/version-image.model";
import { Assumption, Input, Simplification, Output, Entity } from "../../data/mongo/models/subdocuments-schemas";

export class VersionService {
	// private projectService: ProjectService;

	/* constructor(projectService: ProjectService) {
		this.projectService = projectService;
	} */

	async createVersion(createDto: CreateVersionDto) {
		const project = await ProjectModel.findById(createDto.projectId)
			.populate({
				path: "versions",
				match: { state: { $ne: "ELIMINADA" } },
				select: ["title", "state"],
			})
			.exec();

		if (true) {
		}

		const nameAlreadyExists = await VersionModel.findOne({
			title: createDto.title,
		});
		if (nameAlreadyExists)
			throw CustomError.badRequest(
				"Ya existe un proyecto con el nombre especificado."
			);

		try {
			const project = new VersionModel(createDto);

			await project.save();

			// const projectEntity = Cre.fromObject(project);

			return { user: null };
		} catch (error) {
			throw CustomError.internalServer(`${error}`);
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
								id: { $toString: "_id" },
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

		// Validate diagramSchema fields (structureDiagram and flowDiagram)
		const validateDiagram = (
			diagram: any,
			diagramName: string
		) => {
			if (!diagram) {
				errors.push(`El diagrama ${diagramName} no puede estar vacío.`);
				return;
			}

			// Check if usesPlantText is explicitly set
			if (diagram.usesPlantText === true) {
				if (!diagram.plantTextCode || diagram.plantTextCode.trim() === "") {
					errors.push(`El código PlantText del diagrama ${diagramName} no puede estar vacío cuando usesPlantText está activado.`);
				}
				// Check if there's an image and add warning
				if (diagram.imageFileId && diagram.imageFileId !== null) {
					warnings.push(`Se eliminará la imagen del diagrama ${diagramName} ya que se está usando PlantText.`);
					// Remove the image
					diagram.imageFileId = null;
				}
			} else if (diagram.usesPlantText === false) {
				if (!diagram.imageFileId || diagram.imageFileId === null) {
					errors.push(`El diagrama ${diagramName} debe tener una imagen cuando usesPlantText está desactivado.`);
				}
			}
		};

		// Validate structureDiagram if it exists
		if (model.structureDiagram && (
			model.structureDiagram.usesPlantText !== undefined ||
			model.structureDiagram.imageFileId ||
			model.structureDiagram.plantTextCode
		)) {
			validateDiagram(model.structureDiagram, "de estructura");
		}

		// Validate flowDiagram if it exists
		if (model.flowDiagram && (
			model.flowDiagram.usesPlantText !== undefined ||
			model.flowDiagram.imageFileId ||
			model.flowDiagram.plantTextCode
		)) {
			validateDiagram(model.flowDiagram, "de flujo");
		}

		// Validate inputs
		if (model.inputs) {
			model.inputs.forEach((input: Input, index: number) => {
				if (!input.description || input.description.trim() === "") {
					errors.push(`La entrada ${index + 1} debe tener una descripción.`);
				}
			});
		}

		// Validate outputs
		if (model.outputs) {
			model.outputs.forEach((output: Output, index: number) => {
				if (!output.description || output.description.trim() === "") {
					errors.push(`La salida ${index + 1} debe tener una descripción.`);
				}
			});
		}

		// Validate entities
		if (model.entities) {
			model.entities.forEach((entity: Entity, entityIndex: number) => {
				const entityName = entity.name || `Entidad ${entityIndex + 1}`;

				// Check if entity has empty dynamicDiagram
				// An entity can't have an empty dynamicDiagram
				if (
					!entity.dynamicDiagram ||
					(entity.dynamicDiagram.usesPlantText === undefined &&
						!entity.dynamicDiagram.imageFileId &&
						(!entity.dynamicDiagram.plantTextCode || entity.dynamicDiagram.plantTextCode.trim() === ""))
				) {
					errors.push(`La entidad "${entityName}" no puede tener un diagrama dinámico vacío.`);
				}

				// Validate dynamicDiagram if it exists and has content
				if (entity.dynamicDiagram && (
					entity.dynamicDiagram.usesPlantText !== undefined ||
					entity.dynamicDiagram.imageFileId ||
					(entity.dynamicDiagram.plantTextCode && entity.dynamicDiagram.plantTextCode.trim() !== "")
				)) {
					validateDiagram(entity.dynamicDiagram, `dinámico de "${entityName}"`);
				}

				if (entity.scopeDecision?.include === false) {
					// If include is false, shouldn't have properties
					if (entity.properties && entity.properties.length > 0) {
						warnings.push(`La entidad "${entityName}" tiene scopeDecision.include en false pero tiene propiedades asignadas.`);
					}
				} else if (entity.scopeDecision?.include === true) {
					// If include is true, validate argumentType
					if (
						entity.scopeDecision.argumentType === "NO VINCULADO A OBJETIVOS" ||
						entity.scopeDecision.argumentType === "SIMPLIFICACION"
					) {
						errors.push(
							`La entidad "${entityName}" no puede tener argumentType "NO VINCULADO A OBJETIVOS" ni "SIMPLIFICACION" cuando scopeDecision.include es true.`
						);
					}

					// Must have at least one property
					if (!entity.properties || entity.properties.length === 0) {
						errors.push(`La entidad "${entityName}" debe tener al menos una propiedad cuando scopeDecision.include es true.`);
					} else {
						// Validate each property
						entity.properties.forEach((property, propIndex) => {
							if (!property.name || property.name.trim() === "") {
								errors.push(`La propiedad ${propIndex + 1} de la entidad "${entityName}" debe tener un nombre.`);
							}
							if (
								!property.detailLevelDecision?.justification ||
								property.detailLevelDecision.justification.trim() === ""
							) {
								errors.push(
									`La propiedad ${propIndex + 1} de la entidad "${entityName}" debe tener una justificación.`
								);
							}
							if (property.detailLevelDecision?.include === true) {
								if (property.detailLevelDecision.argumentType === "SIMPLIFICACION") {
									errors.push(
										`La propiedad ${propIndex + 1} de la entidad "${entityName}" no puede tener argumentType "SIMPLIFICACION" cuando include es true.`
									);
								}
							}
						});
					}
				}
			});
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
