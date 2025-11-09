import ExcelJS from "exceljs";
import { ConceptualModel, ImageInfo } from "#types/conceptual-model";
import { Buffer } from "buffer";

export interface ExportVersionParams {
  conceptualModel: ConceptualModel;
  title?: string;
  imageInfos?: Map<string, ImageInfo>;
}

/**
 * Fetches an image from a URL and returns it as a Buffer
 */
async function fetchImageAsBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${imageUrl}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Converts SVG to high-resolution PNG using Canvas API
 * This provides crisp, readable images from vector-based SVG sources like PlantUML
 */
async function convertSvgToHighResPng(
  svgBuffer: Buffer,
  targetWidth: number,
  targetHeight: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Convert SVG buffer to string
    const svgString = new TextDecoder().decode(svgBuffer);
    
    // Create an Image element
    const img = new Image();
    
    // Create a blob URL from the SVG string
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = window.URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      // Create a canvas with target dimensions
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Get 2D context
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        window.URL.revokeObjectURL(url);
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // SVG renders at native resolution, so we can draw it directly
      // The SVG will scale to fit the canvas dimensions
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Convert canvas to blob, then to buffer
      canvas.toBlob((blob) => {
        window.URL.revokeObjectURL(url);
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'));
          return;
        }
        
        blob.arrayBuffer().then((arrayBuffer) => {
          resolve(Buffer.from(arrayBuffer));
        }).catch(reject);
      }, 'image/png');
    };
    
    img.onerror = () => {
      window.URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };
    
    img.src = url;
  });
}

/**
 * Gets the image URL from a diagram (handles both PlantText and uploaded files)
 * For PlantUML images, returns SVG URL for better quality
 */
function getDiagramImageUrl(
  diagram: { usesPlantText: boolean; plantTextToken?: string; imageFileId?: string | { url: string } },
  imageInfos: Map<string, ImageInfo>,
  useSvg: boolean = false
): string | null {
  if (diagram.usesPlantText) {
    // Generate PlantUML image URL
    if (diagram.plantTextToken) {
      // Use SVG format for high-quality rendering, PNG for regular display
      if (useSvg) {
        return `http://www.plantuml.com/plantuml/svg/${diagram.plantTextToken}`;
      }
      return `http://www.plantuml.com/plantuml/img/${diagram.plantTextToken}`;
    }
  } else {
    // Get uploaded image URL
    const imageFileId = diagram.imageFileId;
    if (imageFileId) {
      // Check if imageFileId is a populated object (has url property)
      if (typeof imageFileId === 'object' && imageFileId !== null && 'url' in imageFileId) {
        // Backend populated the image object, use its URL directly
        return (imageFileId as { url: string }).url;
      } else if (typeof imageFileId === 'string') {
        // imageFileId is a string ID, look it up in imageInfos map
        const imageInfo = imageInfos.get(imageFileId);
        if (imageInfo?.url) {
          return imageInfo.url;
        }
      }
    }
  }
  return null;
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

  // Sheet 1: Descripcion del sistema
  const sheet1 = workbook.addWorksheet("1 - Descripcion del sistema");

  // Add Sistema row
  sheet1.addRow(["Sistema", conceptualModel.name || ""]);

  // Add Estructura row
  sheet1.addRow(["Estructura", "ver hoja 2 - Diagrama de estructura"]);

  // Add Dinamica row
  sheet1.addRow(["Dinamica", "ver hoja 3 - Diagrama Dinamica"]);

  // Add Suposiciones section
  const assumptionsStartRow = sheet1.rowCount + 1;

  // Add each assumption in separate rows
  if (conceptualModel.assumptions && conceptualModel.assumptions.length > 0) {
    conceptualModel.assumptions.forEach((assumption, index) => {
      // First assumption row gets "Suposiciones" label, others get empty string
      const label = index === 0 ? "Suposiciones" : "";
      sheet1.addRow([label, assumption.description || ""]);
    });
  } else {
    // If no assumptions, add one row with "Suposiciones" label
    sheet1.addRow(["Suposiciones", ""]);
  }

  // Merge cells for "Suposiciones" label in column 1
  const assumptionsEndRow = sheet1.rowCount;
  if (assumptionsStartRow <= assumptionsEndRow) {
    sheet1.mergeCells(assumptionsStartRow, 1, assumptionsEndRow, 1);
    // Center align the merged cell
    const mergedCell = sheet1.getCell(assumptionsStartRow, 1);
    mergedCell.alignment = { vertical: "middle", horizontal: "center" };
  }

  // Set column widths
  sheet1.getColumn(1).width = 20;
  sheet1.getColumn(2).width = 50;

  // Sheet 2: Diagrama de estructura
  const sheet2 = workbook.addWorksheet("2 - Diagrama de estructura");
  
  // Try to add the structure diagram image
  try {
    const isPlantUMLDiagram = conceptualModel.structureDiagram?.usesPlantText;
    // For PlantUML, use SVG for high quality; for uploaded images, use regular URL
    const imageUrl = getDiagramImageUrl(conceptualModel.structureDiagram, imageInfos, isPlantUMLDiagram);
    
    if (imageUrl) {
      // Fetch the image as a buffer
      let imageBuffer = await fetchImageAsBuffer(imageUrl);
      
      // Convert PlantUML SVG to high-resolution PNG (1600x1400)
      if (isPlantUMLDiagram) {
        imageBuffer = await convertSvgToHighResPng(imageBuffer, 1600, 1400);
      }
      
      // Determine image extension from URL or default to png
      const extension = imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') ? 'jpeg' : 'png';
      
      // Add image to workbook
      // Type assertion needed: Buffer polyfill type doesn't exactly match ExcelJS's expected Buffer type
      // but works correctly at runtime. ExcelJS accepts the buffer polyfill's Buffer implementation.
      // Using separate variable with type assertion to work around TypeScript strict checking
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bufferForExcel: any = imageBuffer;
      const imageId = workbook.addImage({
        buffer: bufferForExcel,
        extension: extension,
      });
      
      // Add image to sheet, spanning multiple cells for better visibility
      // Image will span from B2 to H20 (7 columns, 19 rows)
      sheet2.addImage(imageId, {
        tl: { col: 1, row: 1 }, // Top-left: Column B (index 1), Row 2 (index 1)
        ext: { width: 1600, height: 1400 }, // Set explicit dimensions in pixels
      });
      
      // Adjust column widths to accommodate the image
      for (let col = 1; col <= 7; col++) {
        sheet2.getColumn(col).width = 15;
      }
      
      // Adjust row heights
      for (let row = 1; row <= 20; row++) {
        sheet2.getRow(row).height = 20;
      }
    } else {
      // If no image available, add a message
      sheet2.addRow(["No hay diagrama de estructura disponible"]);
    }
  } catch (error) {
    console.error("Error adding structure diagram image:", error);
    sheet2.addRow(["Error al cargar el diagrama de estructura"]);
  }

  // Sheet 3: Diagramas de dinamica
  const sheet3 = workbook.addWorksheet("3- Diagramas de dinamica");
  
  // Add dynamic diagrams for each entity
  if (conceptualModel.entities && conceptualModel.entities.length > 0) {
    let currentRow = 1;
    
    for (const entity of conceptualModel.entities) {
      // Add entity name as header
      const entityName = entity.name || "Entidad sin nombre";
      sheet3.addRow([`Entidad: ${entityName}`]);
      currentRow = sheet3.rowCount;
      
      // Style the header row
      const headerRow = sheet3.getRow(currentRow);
      headerRow.font = { bold: true, size: 12 };
      headerRow.height = 25;
      
      // Try to add the dynamic diagram image
      try {
        const isPlantUMLDiagram = entity.dynamicDiagram?.usesPlantText;
        // For PlantUML, use SVG for high quality; for uploaded images, use regular URL
        const imageUrl = getDiagramImageUrl(entity.dynamicDiagram, imageInfos, isPlantUMLDiagram);
        
        if (imageUrl) {
          // Fetch the image as a buffer
          let imageBuffer = await fetchImageAsBuffer(imageUrl);
          
          // Convert PlantUML SVG to high-resolution PNG (600x400)
          if (isPlantUMLDiagram) {
            imageBuffer = await convertSvgToHighResPng(imageBuffer, 600, 400);
          }
          
          // Determine image extension from URL or default to png
          const extension = imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') ? 'jpeg' : 'png';
          
          // Add image to workbook
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bufferForExcel: any = imageBuffer;
          const imageId = workbook.addImage({
            buffer: bufferForExcel,
            extension: extension,
          });
          
          // Add image to sheet, starting from the row after the entity name
          // Each image will be 600x400 pixels for good readability
          // currentRow is 1-based (from rowCount), but addImage uses 0-based indexing
          // So if entity name is in row 1 (1-based), image should start in row 2 (1-based) = index 1 (0-based)
          // Therefore: row index = currentRow (which is already the next row in 0-based terms)
          const imageStartRow0Based = currentRow; // currentRow is 1-based, but equals the 0-based index for next row
          sheet3.addImage(imageId, {
            tl: { col: 0, row: imageStartRow0Based }, // Top-left: Column A (index 0), Row after entity name
            ext: { width: 600, height: 400 }, // Set explicit dimensions in pixels
          });
          
          // Adjust column widths to accommodate the image
          for (let col = 0; col < 7; col++) {
            const column = sheet3.getColumn(col + 1);
            if (!column.width || column.width < 15) {
              column.width = 15;
            }
          }
          
          // Adjust row heights for the image area
          // imageStartRow0Based is 0-based, getRow uses 1-based, so we add 1
          const imageStartRow1Based = imageStartRow0Based + 1;
          for (let row = imageStartRow1Based; row <= imageStartRow1Based + 20; row++) {
            const rowObj = sheet3.getRow(row);
            if (!rowObj.height || rowObj.height < 20) {
              rowObj.height = 20;
            }
          }
          
          // Add spacing after the image
          // Update currentRow to be 1-based for next iteration
          currentRow = imageStartRow1Based + 21;
        } else {
          // No diagram available for this entity
          sheet3.addRow([`No hay diagrama para la entidad: ${entityName}`]);
          currentRow = sheet3.rowCount;
        }
      } catch (error) {
        console.error(`Error adding dynamic diagram for entity ${entityName}:`, error);
        sheet3.addRow([`Error al cargar el diagrama para la entidad: ${entityName}`]);
        currentRow = sheet3.rowCount;
      }
      
      // Add spacing between entities
      currentRow++;
      sheet3.addRow([]); // Empty row for spacing
      currentRow = sheet3.rowCount;
    }
  } else {
    sheet3.addRow(["No hay entidades disponibles"]);
  }

  // Sheet 4: Descripción de Objetivos, Salidas y Entradas
  const sheet4 = workbook.addWorksheet("4 - Descripción de Objetivos, Salidas y Entradas");

  // Create a map of entity IDs to entity names for quick lookup
  const entityMap = new Map<string, string>();
  if (conceptualModel.entities) {
    conceptualModel.entities.forEach((entity) => {
      entityMap.set(entity._id, entity.name || `Entidad ${entity._id.slice(-4)}`);
    });
  }

  // Row 1: Title merged across 4 columns
  sheet4.addRow(["Descripción de Objetivos, Salidas y Entradas", "", "", ""]);
  sheet4.mergeCells(1, 1, 1, 4);
  const titleCell = sheet4.getCell(1, 1);
  titleCell.font = { bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  // Style the title row background (dark blue with white text)
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E78' }
  };
  titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };

  // Row 2: Objetivo
  sheet4.addRow(["Objetivo", conceptualModel.objective || ""]);
  const objetivoRow = sheet4.getRow(2);
  objetivoRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFCE4D6' } // Light orange/peach
  };

  let currentRow = 3;

  // Outputs Section
  const outputsStartRow = currentRow;
  if (conceptualModel.outputs && conceptualModel.outputs.length > 0) {
    // Create list of all entity names for dropdown
    const entityNames = Array.from(entityMap.values()).filter(name => name);
    const entityNamesList = entityNames.length > 0 ? entityNames.join(',') : '';
    
    // Add each output - first one has "Salidas" label, others have empty column A
    conceptualModel.outputs.forEach((output, index) => {
      const entityName = output.entity ? entityMap.get(output.entity) || "" : "";
      const salidasLabel = index === 0 ? "Salidas" : "";
      
      sheet4.addRow([salidasLabel, output.description || "", "Componente", entityName]);
      currentRow = sheet4.rowCount;
      const outputRow = sheet4.getRow(currentRow);
      
      // Style "Salidas" cell with light blue background (only for first row)
      if (index === 0) {
        outputRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9E1F2' } // Light blue
        };
        outputRow.getCell(1).font = { bold: true };
      }
      
      // Style "Componente" column with light green background
      outputRow.getCell(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' } // Light green
      };
      // Style column D with light green background
      outputRow.getCell(4).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' } // Light green
      };
      
      // Add data validation dropdown for component selection (column 4)
      if (entityNamesList) {
        const componentCell = outputRow.getCell(4);
        componentCell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${entityNamesList}"`]
        };
      }
    });
    
    // Merge cells for "Salidas" label in column 1 (from first row to last row)
    const outputsEndRow = currentRow;
    if (outputsStartRow < outputsEndRow) {
      sheet4.mergeCells(outputsStartRow, 1, outputsEndRow, 1);
      const mergedCell = sheet4.getCell(outputsStartRow, 1);
      mergedCell.alignment = { vertical: "middle", horizontal: "center" };
    }
  } else {
    // If no outputs, add one row with "Salidas" label
    sheet4.addRow(["Salidas", "", "Componente", ""]);
    currentRow = sheet4.rowCount;
    const outputRow = sheet4.getRow(currentRow);
    outputRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' } // Light blue
    };
    outputRow.getCell(1).font = { bold: true };
  }

  // Add spacing row
  currentRow++;
  sheet4.addRow([]);
  currentRow = sheet4.rowCount;

  // Inputs Section
  const inputsStartRow = currentRow;
  if (conceptualModel.inputs && conceptualModel.inputs.length > 0) {
    // Add each input - first one has "Entradas" label, others have empty column A
    conceptualModel.inputs.forEach((input, index) => {
      const inputType = input.type || "PARAMETRO";
      const inputTypeDisplay = inputType === "PARAMETRO" ? "Parámetro" : "Factor Experimental";
      const entradasLabel = index === 0 ? "Entradas" : "";
      
      sheet4.addRow([entradasLabel, input.description || "", "Tipo", inputTypeDisplay]);
      currentRow = sheet4.rowCount;
      const inputRow = sheet4.getRow(currentRow);
      
      // Style "Entradas" cell with light orange/peach background (only for first row)
      if (index === 0) {
        inputRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFCE4D6' } // Light orange/peach
        };
        inputRow.getCell(1).font = { bold: true };
      }
      
      // Style "Tipo" column with light green background
      inputRow.getCell(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' } // Light green
      };
      // Style column D with light green background
      inputRow.getCell(4).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' } // Light green
      };
      
      // Add data validation dropdown for input type (column 4)
      const tipoEntradaCell = inputRow.getCell(4);
      tipoEntradaCell.dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"Parámetro,Factor Experimental"']
      };
    });
    
    // Merge cells for "Entradas" label in column 1 (from first row to last row)
    const inputsEndRow = currentRow;
    if (inputsStartRow < inputsEndRow) {
      sheet4.mergeCells(inputsStartRow, 1, inputsEndRow, 1);
      const mergedCell = sheet4.getCell(inputsStartRow, 1);
      mergedCell.alignment = { vertical: "middle", horizontal: "center" };
      // Apply styling to merged cell
      mergedCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFCE4D6' } // Light orange/peach
      };
      mergedCell.font = { bold: true };
      mergedCell.value = "Entradas";
    }
  } else {
    // If no inputs, add one row with "Entradas" label
    sheet4.addRow(["Entradas", "", "Tipo", ""]);
    currentRow = sheet4.rowCount;
    const inputRow = sheet4.getRow(currentRow);
    inputRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFCE4D6' } // Light orange/peach
    };
    inputRow.getCell(1).font = { bold: true };
  }

  // Add spacing row
  currentRow++;
  sheet4.addRow([]);
  currentRow = sheet4.rowCount;

  // Simplifications Section
  const simplificationsStartRow = currentRow;
  if (conceptualModel.simplifications && conceptualModel.simplifications.length > 0) {
    conceptualModel.simplifications.forEach((simplification, index) => {
      const label = index === 0 ? "Simplificaciones" : "";
      sheet4.addRow([label, simplification.description || ""]);
      currentRow = sheet4.rowCount;
    });
  } else {
    // If no simplifications, add one row with "Simplificaciones" label
    sheet4.addRow(["Simplificaciones", ""]);
    currentRow = sheet4.rowCount;
  }

  // Merge cells for "Simplificaciones" label in column 1
  const simplificationsEndRow = currentRow;
  if (simplificationsStartRow <= simplificationsEndRow) {
    sheet4.mergeCells(simplificationsStartRow, 1, simplificationsEndRow, 1);
    const mergedCell = sheet4.getCell(simplificationsStartRow, 1);
    mergedCell.alignment = { vertical: "middle", horizontal: "center" };
    // Apply styling to merged cell
    mergedCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' } // Light gray
    };
    mergedCell.font = { bold: true };
    mergedCell.value = "Simplificaciones";
  }

  // Set column widths for sheet 4
  sheet4.getColumn(1).width = 20;
  sheet4.getColumn(2).width = 50;
  sheet4.getColumn(3).width = 25;
  sheet4.getColumn(4).width = 25;

  // Generate Excel file and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title}_export.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

