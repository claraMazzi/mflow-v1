export type ProjectInviteTokenPayload = {
	requestingUser: string;
	projectId: string;
};

export type VersionShareTokenPayload = {
	requestingUser: string;
	versionId: string;
};
