export type PendingVerifierRequest = {
	id: string;
	versionTitle: string;
	projectName: string;
	projectOwnerName: string;
	projectOwnerEmail?: string;
	createdAt: string;
	requestingUser: {
		id: string;
		name: string;
		email: string;
	} | null;
};

export type FinalizedVerifierRequest = {
	id: string;
	versionTitle: string;
	requestingUser: string;
	assignedVerifier: string;
	reviewerName: string;
};

export type VerifierRequestDetail = {
	id: string;
	projectName: string;
	versionTitle: string;
	collaborators: { id: string; name: string; email: string }[];
	requestingUser: { id: string; name: string; email: string } | null;
};

export type PendingVerifierRequestsResponse = {
	count: number;
	verifierRequests: PendingVerifierRequest[];
};

export type FinalizedVerifierRequestsResponse = {
	count: number;
	verifierRequests: FinalizedVerifierRequest[];
};

export type AssignVerifierData = {
	verifierRequestId: string;
	assignedVerifierId: string;
};
