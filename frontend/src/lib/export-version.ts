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
 * Gets the image URL from a diagram (handles both PlantText and uploaded files)
 */
function getDiagramImageUrl(
  diagram: { usesPlantText: boolean; plantTextToken?: string; imageFileId?: string | { url: string } },
  imageInfos: Map<string, ImageInfo>
): string | null {
  if (diagram.usesPlantText) {
    // Generate PlantUML image URL
    if (diagram.plantTextToken) {
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
    const imageUrl = getDiagramImageUrl(conceptualModel.structureDiagram, imageInfos);
    
    if (imageUrl) {
      // Fetch the image as a buffer
      const imageBuffer = await fetchImageAsBuffer(imageUrl);
      
      // Determine image extension from URL or default to png
      const extension = imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') ? 'jpeg' : 'png';
      
      // Add image to workbook
      // Type assertion needed: Buffer polyfill type doesn't exactly match ExcelJS's expected Buffer type
      // but works correctly at runtime. ExcelJS accepts the buffer polyfill's Buffer implementation.
      // Using separate variable with type assertion to work around TypeScript strict checking
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      const bufferForExcel: any = imageBuffer;
      const imageId = workbook.addImage({
        buffer: bufferForExcel,
        extension: extension,
      });
      
      // Add image to sheet, spanning multiple cells for better visibility
      // Image will span from B2 to H20 (7 columns, 19 rows)
      sheet2.addImage(imageId, {
        tl: { col: 1, row: 1 }, // Top-left: Column B (index 1), Row 2 (index 1)
        ext: { width: 600, height: 400 }, // Set explicit dimensions in pixels
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
        const imageUrl = getDiagramImageUrl(entity.dynamicDiagram, imageInfos);
        
        if (imageUrl) {
          // Fetch the image as a buffer
          const imageBuffer = await fetchImageAsBuffer(imageUrl);
          
          // Determine image extension from URL or default to png
          const extension = imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') ? 'jpeg' : 'png';
          
          // Add image to workbook
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
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

