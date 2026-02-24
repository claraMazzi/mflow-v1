export type DeletionRequest = {
  id: string;
  project: {
    _id: string;
    title: string;
    description: string;
    owner: { id: string; name: string; lastName: string; email: string };
    collaborators: {
      _id: string;
      name: string;
      lastName: string;
      email: string;
    }[];
  };
  requestingUser: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
    lastName: string;
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
};

export type DenyDeletionRequestData = {
  deletionRequestId: string;
  reviewer: string;
  reason?: string;
};
