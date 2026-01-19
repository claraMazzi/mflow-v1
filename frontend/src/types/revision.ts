import { ConceptualModel, ImageInfo, VersionState } from "./conceptual-model";

export type RevisionState = "PENDIENTE" | "EN CURSO" | "FINALIZADA";

export type CorrectionLocation = {
  x: number;
  y: number;
  page: number; // Maps to tab index
};

export type Correction = {
  _id?: string;
  description: string;
  location: CorrectionLocation;
  multimediaFilePath?: string;
};

export type Revision = {
  id: string;
  project: {
    id: string;
    name: string;
  };
  version: {
    id: string;
    title: string;
  };
  requestingUser: {
    id: string;
    name: string;
    email: string;
  };
  projectOwner: {
    id: string;
    name: string;
    email: string;
  };
  verifier?: {
    id: string;
    name: string;
    email: string;
  };
  state: RevisionState;
  finalReview?: string;
  corrections?: Correction[];
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
};

export type RevisionResponse = {
  count: number;
  revisions: Revision[];
};

// Full revision details with conceptual model data
export type RevisionDetails = {
  id: string;
  state: RevisionState;
  finalReview?: string;
  corrections: Correction[];
  createdAt: string;
  updatedAt: string;
  version: {
    id: string;
    title: string;
    state: VersionState;
    conceptualModel: ConceptualModel;
  };
  verifier: {
    id: string;
    name: string;
    email: string;
  };
  project: {
    id: string;
    title: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
  imageInfos: ImageInfo[];
};

// Tab page mapping for corrections
export const REVISION_TAB_PAGES = {
  "descripcion-sistema": 0,
  "diagrama-estructura": 1,
  "diagrama-dinamica-entidades": 2,
  "objetivos-entradas-salidas": 3,
  "alcance": 4,
  "detalle": 5,
  "flujo": 6,
} as const;

export type RevisionTabKey = keyof typeof REVISION_TAB_PAGES;
