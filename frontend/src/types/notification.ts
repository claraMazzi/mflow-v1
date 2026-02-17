export type NotificationType =
	| "REVISION_COMPLETED"
	| "REVISION_REQUESTED"
	| "PROJECT_SHARED"
	| "VERSION_CREATED"
	| "VERSION_SHARED"
	| "DELETION_REQUEST_APPROVED"
	| "DELETION_REQUEST_DENIED";

export type Notification = {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	read: boolean;
	link?: string;
	triggeredBy?: {
		id: string;
		name: string;
	} | null;
	createdAt: string;
};

export type NotificationsResponse = {
	notifications: Notification[];
	total: number;
	unreadCount: number;
	hasMore: boolean;
};

export type UnreadCountResponse = {
	count: number;
};
