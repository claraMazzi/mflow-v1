"use server";

import { auth } from "@lib/auth";
import {
	Notification,
	NotificationsResponse,
	UnreadCountResponse,
} from "#types/notification";

export type NotificationActionState<T = any> = {
	data?: T;
	error?: string;
};

/**
 * Get notifications for the current user
 */
export const getNotifications = async (options?: {
	limit?: number;
	offset?: number;
	unreadOnly?: boolean;
}): Promise<NotificationActionState<NotificationsResponse>> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "Not authenticated" };
		}

		const params = new URLSearchParams();
		if (options?.limit) params.append("limit", options.limit.toString());
		if (options?.offset) params.append("offset", options.offset.toString());
		if (options?.unreadOnly) params.append("unreadOnly", "true");

		const response = await fetch(
			`${process.env.API_URL}/api/notifications?${params.toString()}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session?.auth}`,
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return { error: errorData.error || "Failed to fetch notifications" };
		}

		const data = await response.json();
		return { data };
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return {
			error:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<
	NotificationActionState<UnreadCountResponse>
> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "Not authenticated" };
		}

		const response = await fetch(
			`${process.env.API_URL}/api/notifications/unread-count`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session?.auth}`,
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return { error: errorData.error || "Failed to fetch unread count" };
		}

		const data = await response.json();
		return { data };
	} catch (error) {
		console.error("Error fetching unread count:", error);
		return {
			error:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (
	notificationId: string
): Promise<NotificationActionState<{ success: boolean }>> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "Not authenticated" };
		}

		const response = await fetch(
			`${process.env.API_URL}/api/notifications/${notificationId}/read`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session?.auth}`,
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return { error: errorData.error || "Failed to mark as read" };
		}

		const data = await response.json();
		return { data };
	} catch (error) {
		console.error("Error marking notification as read:", error);
		return {
			error:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<
	NotificationActionState<{ modifiedCount: number }>
> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "Not authenticated" };
		}

		const response = await fetch(
			`${process.env.API_URL}/api/notifications/read-all`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session?.auth}`,
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return { error: errorData.error || "Failed to mark all as read" };
		}

		const data = await response.json();
		return { data };
	} catch (error) {
		console.error("Error marking all notifications as read:", error);
		return {
			error:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
};
