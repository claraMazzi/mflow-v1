import { ConceptualModel } from "../data/mongo/models/subdocuments-schemas";

function parsePropertyPath(conceptualModel: ConceptualModel, path: string) {
    const pathParts = path.split(".");
    const parsedPath: (string | number)[] = [];
    let current: any = conceptualModel;

	//. dividen las propiedades anidades y cuando tengo una propiedad que es una lista coloco : si quiero acceder a un item especifico de la lsita. 
	//quiero la lista -> entidad.lista 
	//quiero la entidad 1 de la lista --> entidad.lista:1. 
	//entidad.listaEntradas:1.texto

	//entidades:1.listaEntradas
	for (const part of pathParts) {
		const containsListItemKey = part.includes(":");
		if (containsListItemKey) {
			const [listProperty, itemId] = part.split(":");
			if (!(listProperty in current) || !Array.isArray(current[listProperty])) {
				return undefined;
			}
			const itemIndex = current[listProperty].findIndex(
				(e: any) => e.id === itemId
			);
			if (itemIndex === -1) {
				return undefined;
			}
			parsedPath.push(listProperty);
			parsedPath.push(itemIndex);
			current = current[listProperty][itemIndex];
        } else {
            const isNumericIndex = /^\d+$/.test(part);
            // Handle numeric index for arrays, e.g., properties.0.nombre
            if (isNumericIndex && Array.isArray(current)) {
                const index = parseInt(part, 10);
                // Ensure array is large enough and slot is initialized
                while (current.length <= index) {
                    current.push({});
                }
                if (current[index] == null) {
                    current[index] = {};
                }
                parsedPath.push(index);
                current = current[index];
                continue;
            }

            if (!(part in current)) {
                // Auto-initialize missing object path segments to allow deep set
                current[part] = {};
            }
            parsedPath.push(part);
            current = current[part];
        }
	}
	console.log("Parsed Path: ", parsedPath);
	return parsedPath;
}

export const getProperty = (
	conceptualModel: ConceptualModel,
	propertyPath: string
) => {
	const pathParts = parsePropertyPath(conceptualModel, propertyPath);
	let current: any = conceptualModel;
	while (
		pathParts!.length > 1
		//parts.length > 1 &&
		//conceptualModel.hasOwnProperty(parts[0])
	) {
		current = current[pathParts!.shift()!];
	}
	return current[pathParts![0]];
};

export const setValue = (
	conceptualModel: ConceptualModel,
	propertyPath: string,
	value: any
) => {
	const parts = parsePropertyPath(conceptualModel, propertyPath);
	let current: any = conceptualModel;

	while (
		parts!.length > 1
	) {
		current = current[parts!.shift()!];
	}
	current[parts![0]] = value;
};
