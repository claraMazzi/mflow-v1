export type DeletionRequest = {
  id: string;
  project: {
    id: string;
    name: string;
    description: string;
    owner: { id: string; name: string; email: string };
    collaborators: {
      id: string;
      name: string;
      email: string;
    }[];
  };
  requestingUser: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
  motive: string;
  state: "PENDIENTE" | "ACEPTADA" | "RECHAZADA";
  reviewedAt: string;
  registeredAt: string;
};

export type DeletionRequestResponse = {
  count: number;
  deletionRequests: DeletionRequest[];
};

export type ApproveDeletionRequestData = {
  deletionRequestId: string;
  reviewer: string;
};

export type DenyDeletionRequestData = {
  deletionRequestId: string;
  reviewer: string;
  reason?: string;
};
