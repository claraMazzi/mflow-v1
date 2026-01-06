import { ConceptualModel } from "../data/mongo/models/subdocuments-schemas";

function parsePropertyPath(conceptualModel: ConceptualModel, path: string) {
	const pathParts = path.split(".");
	const parsedPath = [];
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
			if (!(part in current)) {
				return undefined;
			}
			parsedPath.push(part)
			current = current[part];
		}
	}
	//console.log("Parsed Path: ", parsedPath);
	return parsedPath;
}

export const getProperty = (
	conceptualModel: ConceptualModel,
	propertyPath: string
) => {
	const pathParts = parsePropertyPath(conceptualModel, propertyPath);
	let current: any = conceptualModel;
	// console.log("Path Parts: ", pathParts);
	// console.log("Current: ", current);

	while (
		pathParts!.length > 1
		//parts.length > 1 &&
		//conceptualModel.hasOwnProperty(parts[0])
	) {
		current = current[pathParts!.shift()!];
		// console.log("Current: ", current);
	}
	// console.log("Current[pathParts![0]]: ", current[pathParts![0]]);
	return current[pathParts![0]];
};

export const setValue = (
	conceptualModel: ConceptualModel,
	propertyPath: string,
	value: any
) => {
	const parts = parsePropertyPath(conceptualModel, propertyPath);
	let current: any = conceptualModel;
	console.log("Setting value: ", parts, current);

	while (
		parts!.length > 1
	) {
		current = current[parts!.shift()!];
	}

	console.log("Setting value: ", parts![0], value);
	current[parts![0]] = value;
};
