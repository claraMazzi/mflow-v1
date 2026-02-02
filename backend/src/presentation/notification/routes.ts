import { Router } from "express";
import { NotificationService } from "../services/notification.service";
import { NotificationController } from "./controller";

export class NotificationRoutes {
	static get routes(): Router {
		const router = Router();

		const service = new NotificationService();
		const controller = new NotificationController(service);

		// Get all notifications for logged-in user
		router.get("/", controller.getNotifications);

		// Get unread notification count
		router.get("/unread-count", controller.getUnreadCount);

		// Mark all notifications as read
		router.patch("/read-all", controller.markAllAsRead);

		// Mark a single notification as read
		router.patch("/:notificationId/read", controller.markAsRead);

		return router;
	}
}
