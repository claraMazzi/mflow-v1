import mongoose from "mongoose";
import { NotificationModel, NotificationType } from "../../data";
import { CustomError } from "../../domain";

export type CreateNotificationDto = {
	recipientId: string;
	type: NotificationType;
	title: string;
	message: string;
	link?: string;
	relatedProjectId?: string;
	relatedVersionId?: string;
	relatedRevisionId?: string;
	triggeredById?: string;
};

export class NotificationService {
	/**
	 * Create a single notification
	 */
	async createNotification(dto: CreateNotificationDto) {
		try {
			const notification = new NotificationModel({
				recipient: new mongoose.Types.ObjectId(dto.recipientId),
				type: dto.type,
				title: dto.title,
				message: dto.message,
				link: dto.link,
				relatedProject: dto.relatedProjectId
					? new mongoose.Types.ObjectId(dto.relatedProjectId)
					: undefined,
				relatedVersion: dto.relatedVersionId
					? new mongoose.Types.ObjectId(dto.relatedVersionId)
					: undefined,
				relatedRevision: dto.relatedRevisionId
					? new mongoose.Types.ObjectId(dto.relatedRevisionId)
					: undefined,
				triggeredBy: dto.triggeredById
					? new mongoose.Types.ObjectId(dto.triggeredById)
					: undefined,
			});

			await notification.save();
			return notification;
		} catch (error) {
			console.error("Error creating notification:", error);
			throw CustomError.internalServer("Error al crear la notificación.");
		}
	}

	/**
	 * Create notifications for multiple recipients (bulk)
	 */
	async createBulkNotifications(
		recipientIds: string[],
		data: Omit<CreateNotificationDto, "recipientId">
	) {
		try {
			const notifications = recipientIds.map((recipientId) => ({
				recipient: new mongoose.Types.ObjectId(recipientId),
				type: data.type,
				title: data.title,
				message: data.message,
				link: data.link,
				relatedProject: data.relatedProjectId
					? new mongoose.Types.ObjectId(data.relatedProjectId)
					: undefined,
				relatedVersion: data.relatedVersionId
					? new mongoose.Types.ObjectId(data.relatedVersionId)
					: undefined,
				relatedRevision: data.relatedRevisionId
					? new mongoose.Types.ObjectId(data.relatedRevisionId)
					: undefined,
				triggeredBy: data.triggeredById
					? new mongoose.Types.ObjectId(data.triggeredById)
					: undefined,
			}));

			await NotificationModel.insertMany(notifications);
			return { count: notifications.length };
		} catch (error) {
			console.error("Error creating bulk notifications:", error);
			throw CustomError.internalServer("Error al crear las notificaciones.");
		}
	}

	/**
	 * Get notifications for a user with pagination
	 */
	async getNotifications(
		userId: string,
		options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
	) {
		try {
			const { limit = 20, offset = 0, unreadOnly = false } = options;

			const query: any = {
				recipient: new mongoose.Types.ObjectId(userId),
			};

			if (unreadOnly) {
				query.read = false;
			}

			const [notifications, total, unreadCount] = await Promise.all([
				NotificationModel.find(query)
					.sort({ createdAt: -1 })
					.skip(offset)
					.limit(limit)
					.populate("triggeredBy", "name lastName")
					.lean(),
				NotificationModel.countDocuments(query),
				NotificationModel.countDocuments({
					recipient: new mongoose.Types.ObjectId(userId),
					read: false,
				}),
			]);

			return {
				notifications: notifications.map((n: any) => ({
					id: n._id.toString(),
					type: n.type,
					title: n.title,
					message: n.message,
					read: n.read,
					link: n.link,
					triggeredBy: n.triggeredBy
						? {
								id: n.triggeredBy._id.toString(),
								name: `${n.triggeredBy.name} ${n.triggeredBy.lastName}`,
						  }
						: null,
					createdAt: n.createdAt,
				})),
				total,
				unreadCount,
				hasMore: offset + notifications.length < total,
			};
		} catch (error) {
			console.error("Error fetching notifications:", error);
			throw CustomError.internalServer("Error al obtener las notificaciones.");
		}
	}

	/**
	 * Get unread notification count for a user
	 */
	async getUnreadCount(userId: string) {
		try {
			const count = await NotificationModel.countDocuments({
				recipient: new mongoose.Types.ObjectId(userId),
				read: false,
			});

			return { count };
		} catch (error) {
			console.error("Error fetching unread count:", error);
			throw CustomError.internalServer(
				"Error al obtener el conteo de notificaciones."
			);
		}
	}

	/**
	 * Mark a single notification as read
	 */
	async markAsRead(notificationId: string, userId: string) {
		try {
			const notification = await NotificationModel.findOneAndUpdate(
				{
					_id: new mongoose.Types.ObjectId(notificationId),
					recipient: new mongoose.Types.ObjectId(userId),
				},
				{ $set: { read: true } },
				{ new: true }
			);

			if (!notification) {
				throw CustomError.notFound("Notificación no encontrada.");
			}

			return { success: true };
		} catch (error) {
			if (error instanceof CustomError) throw error;
			console.error("Error marking notification as read:", error);
			throw CustomError.internalServer(
				"Error al marcar la notificación como leída."
			);
		}
	}

	/**
	 * Mark all notifications as read for a user
	 */
	async markAllAsRead(userId: string) {
		try {
			const result = await NotificationModel.updateMany(
				{
					recipient: new mongoose.Types.ObjectId(userId),
					read: false,
				},
				{ $set: { read: true } }
			);

			return { modifiedCount: result.modifiedCount };
		} catch (error) {
			console.error("Error marking all notifications as read:", error);
			throw CustomError.internalServer(
				"Error al marcar las notificaciones como leídas."
			);
		}
	}

	/**
	 * Delete old notifications (for cleanup - notifications older than 30 days that are read)
	 */
	async cleanupOldNotifications(daysOld: number = 30) {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysOld);

			const result = await NotificationModel.deleteMany({
				read: true,
				createdAt: { $lt: cutoffDate },
			});

			return { deletedCount: result.deletedCount };
		} catch (error) {
			console.error("Error cleaning up old notifications:", error);
			throw CustomError.internalServer(
				"Error al limpiar notificaciones antiguas."
			);
		}
	}
}

// Singleton instance for use across the application
export const notificationService = new NotificationService();
