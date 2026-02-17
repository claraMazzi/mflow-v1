import { ConceptualModel, ImageInfo } from "./conceptual-model";
import { Correction } from "./revision";

export type VersionState =
	| "EN EDICION"
	| "FINALIZADA"
	| "PENDIENTE DE REVISION"
	| "REVISADA"
	| "ELIMINADA";

export type VersionViewData = {
	version: {
		id: string;
		title: string;
		state: VersionState;
		conceptualModel: ConceptualModel;
	};
	/** When false, user is a shared reader and cannot export or request revision */
	canExportAndRequestRevision?: boolean;
	project: {
		id: string;
		title: string;
		owner: {
			id: string;
			name: string;
		};
	};
	revision: {
		id: string;
		state: string;
		finalReview: string;
		verifier: {
			id: string;
			name: string;
		} | null;
		corrections: Correction[];
	} | null;
	imageInfos: {
		id: string;
		originalFilename: string;
		sizeInBytes: number;
		url: string;
		createdAt: string;
		fieldPath?: string;
	}[];
};
