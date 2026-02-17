import ExcelJS, { Alignment, Anchor, Border, Fill, Font, Style } from "exceljs";
import {
	ConceptualModel,
	Diagram,
	Entity,
	ImageInfo,
	Property,
} from "#types/conceptual-model";
import { Buffer } from "buffer";
import { Road_Rage } from "@node_modules/next/font/google";
import { endpointWriteToDisk } from "@node_modules/next/dist/build/swc/generated-native";
import { Clock10 } from "@node_modules/lucide-react/dist/lucide-react";
import JSZip from "jszip";
import { SheetOverlay } from "@src/components/ui/sheet";

export interface ExportVersionParams {
	conceptualModel: ConceptualModel;
	title?: string;
	imageInfos?: Map<string, ImageInfo>;
}

/**
 * Fetches an image from a URL and returns it as a Buffer
 */
async function fetchImageAsArrayBuffer(imageUrl: string) {
	const response = await fetch(imageUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch image from ${imageUrl}`);
	}

	const buffer = await response.arrayBuffer();

	const contentType = response.headers.get("Content-Type");
	let extension = "jpeg";

	if (contentType?.includes("svg")) extension = "svg";
	else if (contentType?.includes("png")) extension = "png";

	return { extension, buffer };
}

async function fetchImage({ url, title }: { url: string; title: string }) {
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

		const blob = await response.blob();

		const contentType = response.headers.get("Content-Type");
		let extension = "jpg";

		if (contentType?.includes("svg")) extension = "svg";
		else if (contentType?.includes("png")) extension = "png";
		else if (contentType?.includes("webp")) extension = "webp";

		const filename = `${title}.${extension}`;

		return { filename, data: blob };
	} catch (error) {
		console.warn(`Could not fetch image at ${url}:`, error);
		return null;
	}
}

async function convertSvgToHighResPng(
	svgBuffer: ArrayBuffer,
	targetWidth: number,
	targetHeight: number,
): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		// Convert SVG buffer to string
		const svgString = new TextDecoder().decode(svgBuffer);

		// Create an Image element
		const img = new Image();

		// Create a blob URL from the SVG string
		const svgBlob = new Blob([svgString], {
			type: "image/svg+xml;charset=utf-8",
		});
		const url = window.URL.createObjectURL(svgBlob);

		img.onload = () => {
			// Create a canvas with target dimensions
			const canvas = document.createElement("canvas");
			canvas.width = targetWidth;
			canvas.height = targetHeight;

			// Get 2D context
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				window.URL.revokeObjectURL(url);
				reject(new Error("Failed to get canvas context"));
				return;
			}

			// SVG renders at native resolution, so we can draw it directly
			// The SVG will scale to fit the canvas dimensions
			ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

			// Convert canvas to blob, then to buffer
			canvas.toBlob((blob) => {
				window.URL.revokeObjectURL(url);
				if (!blob) {
					reject(new Error("Failed to convert canvas to blob"));
					return;
				}

				blob
					.arrayBuffer()
					.then((arrayBuffer) => {
						resolve(arrayBuffer);
					})
					.catch(reject);
			}, "image/png");
		};

		img.onerror = () => {
			window.URL.revokeObjectURL(url);
			reject(new Error("Failed to load SVG image"));
		};

		img.src = url;
	});
}

/**
 * Gets the image URL from a diagram (handles both PlantText and uploaded files)
 * For PlantUML images, returns SVG URL for better quality
 */
function getDiagramImageUrl(
	diagram: Diagram,
	imageInfos: Map<string, ImageInfo>,
): string | null {
	if (diagram.usePlantText) {
		if (diagram.plantTextToken) {
			return `http://www.plantuml.com/plantuml/svg/${diagram.plantTextToken}`;
		}
	} else {
		const imageFileId = diagram.imageFileId;
		if (imageFileId) {
			const imageInfo = imageInfos.get(imageFileId);
			if (imageInfo?.url) {
				return imageInfo.url;
			}
		}
	}

	return null;
}

function mergeColumnsInRow(
	sheet: ExcelJS.Worksheet,
	row: number,
	startColId: string,
	endColId: string,
) {
	sheet.mergeCells(
		`${sheet.getColumn(startColId).letter}${row}:${sheet.getColumn(endColId).letter}${row}`,
	);
}

function mergeRowsInColumn(
	sheet: ExcelJS.Worksheet,
	startRow: number,
	endRow: number,
	colId: string,
) {
	sheet.mergeCells(
		`${sheet.getColumn(colId).letter}${startRow}:${sheet.getColumn(colId).letter}${endRow}`,
	);
}

function applyStyleToRange(
	sheet: ExcelJS.Worksheet,
	startRow: number,
	endRow: number,
	startColId: string,
	endColId: string,
	style: ExcelJS.Cell["style"],
) {
	const startCol = sheet.getColumn(startColId).number;
	const endCol = sheet.getColumn(endColId).number;

	for (let row = startRow; row <= endRow; row++) {
		for (let col = startCol; col <= endCol; col++) {
			sheet.getCell(row, col).style = style;
		}
	}
}

const MAIN_TITLE_STYLE: ExcelJS.Cell["style"] = {
	font: { name: "Calibri", size: 12, bold: true },
	alignment: { vertical: "middle", horizontal: "center" },
	fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFBFBFBF" } },
	border: {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	},
};

const MAIN_LABEL_STYLE: ExcelJS.Cell["style"] = {
	font: { name: "Calibri", size: 11, italic: true },
	alignment: { vertical: "middle", horizontal: "right" },
	fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2CB" } },
	border: {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	},
};

const SECONDARY_LABEL_STYLE: ExcelJS.Cell["style"] = {
	font: { name: "Calibri", size: 11, italic: true },
	alignment: { vertical: "middle", horizontal: "right" },
	fill: { type: "pattern", pattern: "solid", fgColor: { argb: "deeaf6" } },
	border: {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	},
};

const TERTIARY_LABEL_STYLE: ExcelJS.Cell["style"] = {
	font: { name: "Calibri", size: 11, italic: true },
	alignment: { vertical: "middle", horizontal: "right" },
	fill: { type: "pattern", pattern: "solid", fgColor: { argb: "e2efd9" } },
	border: {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	},
};

const CONTENT_STYLE: ExcelJS.Cell["style"] = {
	font: { name: "Calibri", size: 11 },
	alignment: { horizontal: "left", vertical: "middle", wrapText: true },
	border: {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	},
};

function buildSystemDescriptionSheet({
	workbook,
	name,
	description,
	assumptions,
}: {
	name: ConceptualModel["name"];
	description: ConceptualModel["description"];
	assumptions: ConceptualModel["assumptions"];
	workbook: ExcelJS.Workbook;
}) {
	const sheet = workbook.addWorksheet("1 - Descripcion del sistema");
	//Setup column keys
	sheet.columns = [
		{ key: "header", width: 20 },
		{ key: "value", width: 50 },
	];

	mergeColumnsInRow(sheet, 1, "header", "value");
	const mainTitleCell = sheet.getCell(1, sheet.getColumn("header").number);
	mainTitleCell.value = "Descripción del Sistema";

	const mainContentStartRow = sheet.rowCount + 1;

	sheet.addRow({ header: "Nombre del Sistema", value: name || "" });
	sheet.addRow({ header: "Descripción del Sistema", value: description || "" });
	sheet.addRow({
		header: "Estructura",
		value: "Ver Hoja 2 - Diagrama de estructura",
	});
	sheet.addRow({
		header: "Dinamica",
		value: "Ver hoja 3 - Diagrama de dinámica",
	});

	// Add each assumption in separate rows
	if (assumptions && assumptions.length > 0) {
		const assumptionsStartRow = sheet.rowCount + 1;
		assumptions.forEach((assumption, index) => {
			// First assumption row gets "Suposiciones" label, others get empty string
			const header = index === 0 ? "Suposiciones" : "";
			sheet.addRow({ header, value: assumption.description || "" });
		});
		mergeRowsInColumn(sheet, assumptionsStartRow, sheet.rowCount, "header");
	} else {
		// If no assumptions, add one row with "Suposiciones" label
		sheet.addRow({ header: "Suposiciones" });
	}

	//Apply Side Bar Styles
	applyStyleToRange(sheet, 1, 1, "header", "value", MAIN_TITLE_STYLE);
	applyStyleToRange(
		sheet,
		mainContentStartRow,
		sheet.rowCount,
		"header",
		"header",
		MAIN_LABEL_STYLE,
	);
	applyStyleToRange(
		sheet,
		mainContentStartRow,
		sheet.rowCount,
		"value",
		"value",
		CONTENT_STYLE,
	);
}

async function buildSingleDiagramSheet({
	workbook,
	diagram,
	imageInfos,
	sheetTitle,
}: {
	imageInfos: NonNullable<ExportVersionParams["imageInfos"]>;
	diagram: Diagram;
	sheetTitle: string;
	workbook: ExcelJS.Workbook;
}) {
	const sheet = workbook.addWorksheet(sheetTitle);

	try {
		const imageUrl = getDiagramImageUrl(diagram, imageInfos);

		if (diagram.usePlantText) {
			sheet.addRow([diagram.plantTextCode]);
			sheet.getRow(1).height = 800;
			sheet.getColumn(1).width = 200;
		}

		if (imageUrl) {
			let image = await fetchImageAsArrayBuffer(imageUrl);

			if (diagram.usePlantText) {
				image = {
					extension: "png",
					buffer: await convertSvgToHighResPng(image.buffer, 1600, 1400),
				};
			}

			const imageId = workbook.addImage({
				buffer: image.buffer,
				extension: image.extension as "jpeg" | "png",
			});

			sheet.addImage(imageId, "A2:A2");
			sheet.addImage(imageId, {
					tl: { col: 0, row: 1 },
					ext: { width: 1600, height: 1400 }, 
				});
		} else {
			sheet.addRow(["No hay diagrama disponible"]);
		}
	} catch (error) {
		console.error("Error adding structure diagram image:", error);
		sheet.addRow(["Error al cargar el diagrama"]);
	}
}

function buildInputsOutputsSheet({
	workbook,
	objective,
	inputs,
	outputs,
	entities,
	simplifications,
}: {
	workbook: ExcelJS.Workbook;
	objective: ConceptualModel["objective"];
	inputs: ConceptualModel["inputs"];
	outputs: ConceptualModel["outputs"];
	entities: ConceptualModel["entities"];
	simplifications: ConceptualModel["simplifications"];
}) {
	const sheet = workbook.addWorksheet(
		"4 - Descripción de Objetivos, Salidas y Entradas",
	);
	sheet.columns = [
		{ key: "c1", width: 20 },
		{ key: "c2", width: 50 },
		{ key: "c3", width: 25 },
		{ key: "c4", width: 25 },
	];

	const entityMap = new Map<string, string>();
	if (entities) {
		entities.forEach((entity) => {
			entityMap.set(entity._id, entity.name || `Entidad sin nombre`);
		});
	}

	// Row 1: Title merged across 4 columns
	sheet.addRow({ c1: "Descripción de Objetivos, Salidas y Entradas" });
	mergeColumnsInRow(sheet, 1, "c1", "c4");

	// Row 2: Objetivo
	sheet.addRow({ c1: "Objetivo", c2: objective || "" });
	mergeColumnsInRow(sheet, sheet.rowCount, "c2", "c4");

	// Outputs Section
	// If no outputs, add one row with "Salidas" label
	const outputsStartRow = sheet.rowCount + 1;
	if (outputs.length > 0) {
		// Create list of all entity names for dropdown
		const entityNames = Array.from(entityMap.values()).filter((name) => name);
		const entityNamesList = entityNames.length > 0 ? entityNames.join(",") : "";

		// Add each output - first one has "Salidas" label, others have empty column A
		outputs.forEach((output, index) => {
			const entityName = output.entity
				? entityMap.get(output.entity) || ""
				: "";

			sheet.addRow({
				c1: index === 0 ? "Salida" : "",
				c2: output.description,
				c3: "Componente",
				c4: entityName,
			});
			const outputRow = sheet.getRow(outputsStartRow + index);

			// Add data validation dropdown for component selection (column 4)
			if (entityNamesList) {
				const componentCell = outputRow.getCell("c4");
				componentCell.dataValidation = {
					type: "list",
					allowBlank: true,
					formulae: [`"${entityNamesList}"`],
				};
			}
		});
	} else {
		sheet.addRow({ c1: "Salidas", c3: "Componente" });
	}

	const inputsStartRow = sheet.rowCount + 1;
	// Inputs Section
	if (inputs.length > 0) {
		// Add each input - first one has "Entradas" label, others have empty column A
		inputs.forEach((input, index) => {
			const inputType = input.type || "PARAMETRO";
			const inputTypeDisplay =
				inputType === "PARAMETRO" ? "Parámetro" : "Factor Experimental";

			sheet.addRow({
				c1: index === 0 ? "Entradas" : "",
				c2: input.description || "",
				c3: "Tipo",
				c4: inputTypeDisplay,
			});
			const inputRow = sheet.getRow(inputsStartRow + index);

			// Add data validation dropdown for input type (column 4)
			const tipoEntradaCell = inputRow.getCell(4);
			tipoEntradaCell.dataValidation = {
				type: "list",
				allowBlank: false,
				formulae: ['"Parámetro,Factor Experimental"'],
			};
		});
	} else {
		// If no inputs, add one row with "Entradas" label
		sheet.addRow({ c1: "Entradas", c3: "Tipo" });
	}

	// Simplifications Section
	const simplificationsStartRow = sheet.rowCount + 1;
	if (simplifications.length > 0) {
		simplifications.forEach((simplification, index) => {
			sheet.addRow({
				c1: index === 0 ? "Simplificaciones" : "",
				c2: simplification.description || "",
			});
		});
	} else {
		// If no simplifications, add one row with "Simplificaciones" label
		sheet.addRow({ c1: "Simplificaciones" });
	}

	//Merge Header
	mergeRowsInColumn(sheet, outputsStartRow, inputsStartRow - 1, "c1");
	mergeRowsInColumn(sheet, inputsStartRow, simplificationsStartRow - 1, "c1");
	mergeRowsInColumn(sheet, simplificationsStartRow, sheet.rowCount, "c1");

	//Apply Styles
	applyStyleToRange(sheet, 1, 1, "c1", "c4", MAIN_TITLE_STYLE);
	applyStyleToRange(
		sheet,
		outputsStartRow - 1,
		sheet.rowCount,
		"c1",
		"c1",
		MAIN_LABEL_STYLE,
	);
	applyStyleToRange(
		sheet,
		outputsStartRow - 1,
		outputsStartRow - 1,
		"c2",
		"c4",
		CONTENT_STYLE,
	);
	applyStyleToRange(
		sheet,
		outputsStartRow,
		sheet.rowCount,
		"c2",
		"c2",
		CONTENT_STYLE,
	);
	applyStyleToRange(
		sheet,
		outputsStartRow,
		inputsStartRow - 1,
		"c3",
		"c3",
		SECONDARY_LABEL_STYLE,
	);
	applyStyleToRange(
		sheet,
		inputsStartRow,
		simplificationsStartRow - 1,
		"c3",
		"c3",
		TERTIARY_LABEL_STYLE,
	);
	applyStyleToRange(
		sheet,
		outputsStartRow,
		simplificationsStartRow - 1,
		"c4",
		"c4",
		CONTENT_STYLE,
	);
}

function buildScopeDecisionsSheet({
	workbook,
	entities,
}: {
	workbook: ExcelJS.Workbook;
	entities: ConceptualModel["entities"];
}) {
	const sheet = workbook.addWorksheet(
		"5 - Decisiones de Alcance y Nivel de Detalle",
	);
	sheet.columns = [
		{ key: "c1", width: 20 },
		{ key: "c2", width: 20 },
		{ key: "c3", width: 20 },
		{ key: "c4", width: 20 },
		{ key: "c5", width: 50 },
		{ key: "c6", width: 20 },
		{ key: "c7", width: 20 },
		{ key: "c8", width: 20 },
		{ key: "c9", width: 50 },
		{ key: "c10", width: 20 },
		{ key: "c11", width: 20 },
	];

	sheet.addRow({ c1: "Descripción de Alcance y  Nivel de Detalle" });
	mergeColumnsInRow(sheet, 1, "c1", "c11");

	const scopeDecisionsStartRow = sheet.rowCount + 1;
	if (entities.length > 0) {
		const argumentTypeMap: Map<
			Entity["scopeDecision"]["argumentType"],
			string
		> = new Map([
			["ENTRADA", "Entrada"],
			["SALIDA", "Salida"],
			["SIMPLIFICACION", "Simplificación"],
			["NO VINCULADO A OBJETIVOS", "No Vinculado a Objetivos"],
		]);
		// Create list of all entity names for dropdown
		entities.forEach((entity, index) => {
			const argType =
				argumentTypeMap.get(entity.scopeDecision.argumentType) || "";

			sheet.addRow({
				c1: index === 0 ? "Alcance" : "",
				c2: "Componente",
				c3: entity.name || "Entidad sin nombre",
				c6: "Decisión",
				c7: entity.scopeDecision.include ? "Incluir" : "Excluir",
				c8: "Justificación",
				c9: entity.scopeDecision.justification,
				c10: "Tipo de Argumento",
				c11: argType,
			});
			mergeColumnsInRow(sheet, scopeDecisionsStartRow + index, "c3", "c5");
			const outputRow = sheet.getRow(scopeDecisionsStartRow + index);
			const includeCell = outputRow.getCell("c7");
			includeCell.dataValidation = {
				type: "list",
				allowBlank: false,
				formulae: [`"Incluir,Excluir"`],
			};
			const argumentTypeCell = outputRow.getCell("c11");
			argumentTypeCell.dataValidation = {
				type: "list",
				allowBlank: false,
				formulae: [`"${[...argumentTypeMap.values()].join(",")}"`],
			};
		});
	} else {
		sheet.addRow({
			c1: "Alcance",
			c2: "Componente",
			c6: "Decisión",
			c8: "Justificación",
			c10: "Tipo de Argumento",
		});
		mergeColumnsInRow(sheet, scopeDecisionsStartRow, "c3", "c5");
	}

	const detailLevelDecisionStartRow = sheet.rowCount + 1;
	const includedEntities = entities.filter((e) => e.scopeDecision.include);
	if (includedEntities.length > 0) {
		const argumentTypeMap: Map<
			Property["detailLevelDecision"]["argumentType"],
			string
		> = new Map([
			["CALCULO SALIDA", "Cáclculo de Salida"],
			["DATO DE ENTRADA", "Dato de Entrada"],
			["SIMPLIFICACION", "Simplificación"],
		]);

		includedEntities.forEach((entity, entIndex) => {
			if (entity.properties.length === 0) {
				sheet.addRow({
					c1: entIndex === 0 ? "Nivel de Detalle" : "",
					c2: "Componente",
					c3: entity.name || "Entidad sin nombre",
					c4: "Propiedad",
					c6: "Decisión",
					c8: "Justificación",
					c10: "Tipo de Argumento",
				});
				return;
			}

			entity.properties.forEach((property, propIndex) => {
				const argType =
					argumentTypeMap.get(property.detailLevelDecision.argumentType) || "";

				sheet.addRow({
					c1: entIndex === 0 ? "Nivel de Detalle" : "",
					c2: "Componente",
					c3: propIndex === 0 ? entity.name || "Entidad sin nombre" : "",
					c4: "Propiedad",
					c5: property.name || "Propiedad sin nombre",
					c6: "Decisión",
					c7: property.detailLevelDecision.include ? "Incluir" : "Excluir",
					c8: "Justificación",
					c9: property.detailLevelDecision.justification,
					c10: "Tipo de Argumento",
					c11: argType,
				});
				const outputRow = sheet.getRow(scopeDecisionsStartRow + propIndex);
				const includeCell = outputRow.getCell("c7");
				includeCell.dataValidation = {
					type: "list",
					allowBlank: false,
					formulae: [`"Incluir,Excluir"`],
				};
				const argumentTypeCell = outputRow.getCell("c11");
				argumentTypeCell.dataValidation = {
					type: "list",
					allowBlank: false,
					formulae: [`"${[...argumentTypeMap.values()].join(",")}"`],
				};
			});

			mergeRowsInColumn(
				sheet,
				sheet.rowCount - (entity.properties.length - 1),
				sheet.rowCount,
				"c3",
			);
		});
	} else {
		sheet.addRow({
			c1: "Nivel de Detalle",
			c2: "Componente",
			c4: "Propiedad",
			c6: "Decisión",
			c8: "Justificación",
			c10: "Tipo de Argumento",
		});
	}

	//Merge Headers
	mergeRowsInColumn(
		sheet,
		scopeDecisionsStartRow,
		detailLevelDecisionStartRow - 1,
		"c1",
	);
	mergeRowsInColumn(sheet, detailLevelDecisionStartRow, sheet.rowCount, "c1");

	//Apply Styles
	applyStyleToRange(sheet, 1, 1, "c1", "c11", MAIN_TITLE_STYLE);
	applyStyleToRange(
		sheet,
		scopeDecisionsStartRow,
		sheet.rowCount,
		"c1",
		"c1",
		MAIN_LABEL_STYLE,
	);
	applyStyleToRange(
		sheet,
		scopeDecisionsStartRow,
		sheet.rowCount,
		"c2",
		"c2",
		SECONDARY_LABEL_STYLE,
	);
	applyStyleToRange(
		sheet,
		scopeDecisionsStartRow,
		detailLevelDecisionStartRow - 1,
		"c3",
		"c5",
		CONTENT_STYLE,
	);
	applyStyleToRange(
		sheet,
		detailLevelDecisionStartRow,
		sheet.rowCount,
		"c3",
		"c3",
		CONTENT_STYLE,
	);
	applyStyleToRange(
		sheet,
		detailLevelDecisionStartRow,
		sheet.rowCount,
		"c4",
		"c4",
		SECONDARY_LABEL_STYLE,
	);
	applyStyleToRange(
		sheet,
		detailLevelDecisionStartRow,
		sheet.rowCount,
		"c5",
		"c5",
		CONTENT_STYLE,
	);
	applyStyleToRange(
		sheet,
		scopeDecisionsStartRow,
		sheet.rowCount,
		"c6",
		"c6",
		SECONDARY_LABEL_STYLE,
	);
	applyStyleToRange(
		sheet,
		scopeDecisionsStartRow,
		sheet.rowCount,
		"c7",
		"c7",
		CONTENT_STYLE,
	);
	applyStyleToRange(
		sheet,
		scopeDecisionsStartRow,
		sheet.rowCount,
		"c8",
		"c8",
		TERTIARY_LABEL_STYLE,
	);
	applyStyleToRange(
		sheet,
		scopeDecisionsStartRow,
		sheet.rowCount,
		"c9",
		"c9",
		CONTENT_STYLE,
	);
	applyStyleToRange(
		sheet,
		scopeDecisionsStartRow,
		sheet.rowCount,
		"c10",
		"c10",
		TERTIARY_LABEL_STYLE,
	);
	applyStyleToRange(
		sheet,
		scopeDecisionsStartRow,
		sheet.rowCount,
		"c11",
		"c11",
		CONTENT_STYLE,
	);
}

async function buildEntitiesSheet({
	workbook,
	entities,
	imageInfos,
}: {
	workbook: ExcelJS.Workbook;
	entities: Entity[];
	imageInfos: NonNullable<ExportVersionParams["imageInfos"]>;
}) {
	const sheet = workbook.addWorksheet("3 - Diagramas de Dinámica");

	if (entities.length === 0) {
		sheet.addRow(["No hay entidades disponibles"]);
		return;
	}

	let currentRow = 1;
	sheet.getColumn(1).width = 200;
	for (const entity of entities) {
		const entityName = entity.name || "Entidad sin nombre";
		const headerRow = sheet.addRow([`Entidad: ${entityName}`]);

		headerRow.getCell(1).style = MAIN_TITLE_STYLE;
		currentRow = headerRow.number;
		currentRow++;

		try {
			const imageUrl = getDiagramImageUrl(entity.dynamicDiagram, imageInfos);

			if (entity.dynamicDiagram.usePlantText) {
				sheet.addRow([entity.dynamicDiagram.plantTextCode]);
				sheet.getRow(currentRow).height = 800;
				currentRow++;
			}

			if (imageUrl) {
				let image = await fetchImageAsArrayBuffer(imageUrl);

				if (entity.dynamicDiagram.usePlantText) {
					image = {
						extension: "png",
						buffer: await convertSvgToHighResPng(image.buffer, 600, 400),
					};
				}

				const imageId = workbook.addImage({
					buffer: image.buffer,
					extension: image.extension as "jpeg" | "png",
				});

				sheet.addRow([]);
				sheet.getRow(currentRow).height = 600;
				sheet.addImage(imageId, {
					tl: { col: 0, row: currentRow - 1 },
					ext: { width: 800, height: 600 }, 
				});
				currentRow++;
			} else {
				sheet.addRow(["No hay diagrama disponible"]);
				currentRow++;
			}
		} catch (error) {
			console.error("Error adding structure diagram image:", error);
			sheet.addRow(["Error al cargar el diagrama"]);
			currentRow++;
		}

		sheet.addRow([]);
		currentRow++;
	}
}

/**
 * Exports version data to an Excel file and triggers download
 * @param params - Object containing conceptualModel, optional title, and optional imageInfos
 */
export async function exportVersionToExcel({
	conceptualModel,
	title = "version",
	imageInfos = new Map(),
}: ExportVersionParams): Promise<void> {
	const workbook = new ExcelJS.Workbook();

	buildSystemDescriptionSheet({
		workbook,
		name: conceptualModel.name,
		description: conceptualModel.description,
		assumptions: conceptualModel.assumptions,
	});

	await buildSingleDiagramSheet({
		workbook,
		diagram: conceptualModel.structureDiagram,
		sheetTitle: "2 - Diagrama de Estructura",
		imageInfos,
	});

	await buildEntitiesSheet({
		workbook,
		entities: conceptualModel.entities,
		imageInfos,
	});

	buildInputsOutputsSheet({
		workbook,
		simplifications: conceptualModel.simplifications,
		entities: conceptualModel.entities,
		objective: conceptualModel.objective,
		inputs: conceptualModel.inputs,
		outputs: conceptualModel.outputs,
	});

	buildScopeDecisionsSheet({
		workbook,
		entities: conceptualModel.entities,
	});

	await buildSingleDiagramSheet({
		workbook,
		diagram: conceptualModel.flowDiagram,
		sheetTitle: "6 - Diagrama de Flujo",
		imageInfos,
	});

	const zip = new JSZip();

	// 1. Generate the Excel buffer
	const excelBuffer = await workbook.xlsx.writeBuffer();

	zip.file(`${title}_export.xlsx`, excelBuffer);
	const structureDiagramUrl = getDiagramImageUrl(
		conceptualModel.structureDiagram,
		imageInfos,
	);
	if (structureDiagramUrl) {
		const imageData = await fetchImage({
			url: structureDiagramUrl,
			title: "Diagrama de Estructura",
		});
		if (imageData) {
			zip.file(imageData.filename, imageData.data);
		}
	}

	const imagePromises = conceptualModel.entities.map(async (entity, index) => {
		const entityDiagramUrl = getDiagramImageUrl(
			entity.dynamicDiagram,
			imageInfos,
		);
		if (entityDiagramUrl) {
			const imageData = await fetchImage({
				url: entityDiagramUrl,
				title: `(${index + 1}) Diagrama de Dinámica - Entidad ${entity.name}`,
			});
			if (imageData) {
				zip.file(imageData.filename, imageData.data);
			}
		}
	});

	await Promise.all(imagePromises);

	const flowDiagramUrl = getDiagramImageUrl(
		conceptualModel.flowDiagram,
		imageInfos,
	);
	if (flowDiagramUrl) {
		const imageData = await fetchImage({
			url: flowDiagramUrl,
			title: "Diagrama de Flujo",
		});
		if (imageData) {
			zip.file(imageData.filename, imageData.data);
		}
	}

	const zipBlob = await zip.generateAsync({ type: "blob" });
	const url = window.URL.createObjectURL(zipBlob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${title}_export.zip`; // Change extension to .zip
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}
