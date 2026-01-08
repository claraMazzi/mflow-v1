export type RevisionState = "PENDIENTE" | "EN CURSO" | "FINALIZADA";

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
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
};

export type RevisionResponse = {
  count: number;
  revisions: Revision[];
};
