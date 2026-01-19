import { Request, Response } from "express";
import { CustomError } from "../../domain";
import { NotificationService } from "../services/notification.service";

export class NotificationController {
	constructor(private readonly notificationService: NotificationService) {}

	private handleError = (error: unknown, res: Response) => {
		if (error instanceof CustomError) {
			return res.status(error.statusCode).json({ error: error.message });
		}

		console.error(`${error}`);
		return res
			.status(500)
			.json({ error: "Ocurrió un error interno en el servidor." });
	};

	/**
	 * GET /api/notifications
	 * Get notifications for the logged-in user
	 */
	getNotifications = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res
					.status(401)
					.json({ error: "Debe iniciar sesión para ver las notificaciones." });
			}

			const { limit, offset, unreadOnly } = req.query;

			const result = await this.notificationService.getNotifications(userId, {
				limit: limit ? parseInt(limit as string, 10) : undefined,
				offset: offset ? parseInt(offset as string, 10) : undefined,
				unreadOnly: unreadOnly === "true",
			});

			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
	};

	/**
	 * GET /api/notifications/unread-count
	 * Get unread notification count for the logged-in user
	 */
	getUnreadCount = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.status(401).json({ error: "Debe iniciar sesión." });
			}

			const result = await this.notificationService.getUnreadCount(userId);
			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
	};

	/**
	 * PATCH /api/notifications/:notificationId/read
	 * Mark a single notification as read
	 */
	markAsRead = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.status(401).json({ error: "Debe iniciar sesión." });
			}

			const { notificationId } = req.params;
			if (!notificationId) {
				return res
					.status(400)
					.json({ error: "El identificador de la notificación es obligatorio." });
			}

			const result = await this.notificationService.markAsRead(
				notificationId,
				userId
			);
			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
	};

	/**
	 * PATCH /api/notifications/read-all
	 * Mark all notifications as read for the logged-in user
	 */
	markAllAsRead = async (req: Request, res: Response) => {
		try {
			const userId = req.session?.userId;
			if (!userId) {
				return res.status(401).json({ error: "Debe iniciar sesión." });
			}

			const result = await this.notificationService.markAllAsRead(userId);
			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(error, res);
		}
	};
}
