import { Schema, model, Types } from "mongoose";

export enum NotificationType {
	REVISION_COMPLETED = "REVISION_COMPLETED",
	REVISION_REQUESTED = "REVISION_REQUESTED",
	PROJECT_SHARED = "PROJECT_SHARED",
	VERSION_CREATED = "VERSION_CREATED",
	VERSION_SHARED = "VERSION_SHARED",
	DELETION_REQUEST_APPROVED = "DELETION_REQUEST_APPROVED",
	DELETION_REQUEST_DENIED = "DELETION_REQUEST_DENIED",
}

export const NOTIFICATION_TYPES = Object.values(NotificationType);

const notificationSchema = new Schema(
	{
		// The user who will receive the notification
		recipient: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		// Type of notification for filtering and display
		type: {
			type: String,
			enum: NOTIFICATION_TYPES,
			required: true,
		},
		// Human-readable title
		title: {
			type: String,
			required: true,
		},
		// Detailed message
		message: {
			type: String,
			required: true,
		},
		// Whether the user has read this notification
		read: {
			type: Boolean,
			default: false,
			index: true,
		},
		// Optional link to navigate to when clicking the notification
		link: {
			type: String,
		},
		// Related entities for context (optional)
		relatedProject: {
			type: Schema.Types.ObjectId,
			ref: "Project",
		},
		relatedVersion: {
			type: Schema.Types.ObjectId,
			ref: "Version",
		},
		relatedRevision: {
			type: Schema.Types.ObjectId,
			ref: "Revision",
		},
		// Who triggered this notification (optional)
		triggeredBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{ timestamps: true }
);

// Compound index for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const NotificationModel = model("Notification", notificationSchema);
