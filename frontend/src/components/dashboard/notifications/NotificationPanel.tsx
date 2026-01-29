"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@components/ui/common/button";
import { cn } from "@lib/utils";
import { Notification } from "#types/notification";
import {
	getNotifications,
	getUnreadCount,
	markNotificationAsRead,
	markAllNotificationsAsRead,
} from "./actions/notification-actions";
import { useRouter } from "next/navigation";

// Simple time ago function
function timeAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (seconds < 60) return "hace un momento";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `hace ${minutes} min`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `hace ${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `hace ${days}d`;
	const weeks = Math.floor(days / 7);
	if (weeks < 4) return `hace ${weeks} sem`;
	const months = Math.floor(days / 30);
	if (months < 12) return `hace ${months} mes${months > 1 ? "es" : ""}`;
	const years = Math.floor(days / 365);
	return `hace ${years} año${years > 1 ? "s" : ""}`;
}

// Notification type icons and colors
const notificationConfig: Record<
	string,
	{ icon: string; bgColor: string; textColor: string }
> = {
	REVISION_COMPLETED: {
		icon: "✅",
		bgColor: "bg-green-50",
		textColor: "text-green-700",
	},
	REVISION_REQUESTED: {
		icon: "📋",
		bgColor: "bg-blue-50",
		textColor: "text-blue-700",
	},
	PROJECT_SHARED: {
		icon: "🤝",
		bgColor: "bg-purple-50",
		textColor: "text-purple-700",
	},
	VERSION_CREATED: {
		icon: "📄",
		bgColor: "bg-amber-50",
		textColor: "text-amber-700",
	},
};

interface NotificationItemProps {
	notification: Notification;
	onMarkAsRead: (id: string) => void;
	onNavigate: (link: string) => void;
}

function NotificationItem({
	notification,
	onMarkAsRead,
	onNavigate,
}: NotificationItemProps) {
	const config = notificationConfig[notification.type] || {
		icon: "🔔",
		bgColor: "bg-gray-50",
		textColor: "text-gray-700",
	};

	const handleClick = () => {
		if (!notification.read) {
			onMarkAsRead(notification.id);
		}
		if (notification.link) {
			onNavigate(notification.link);
		}
	};

	const formattedTime = timeAgo(notification.createdAt);

	return (
		<button
			onClick={handleClick}
			className={cn(
				"w-full text-left p-3 border-b border-gray-100 transition-colors hover:bg-gray-50",
				!notification.read && "bg-blue-50/50"
			)}
		>
			<div className="flex items-start gap-3">
				<div
					className={cn(
						"w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm",
						config.bgColor
					)}
				>
					{config.icon}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<p
							className={cn(
								"font-medium text-sm truncate",
								!notification.read ? "text-gray-900" : "text-gray-600"
							)}
						>
							{notification.title}
						</p>
						{!notification.read && (
							<span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
						)}
					</div>
					<p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
						{notification.message}
					</p>
					<div className="flex items-center gap-2 mt-1">
						<span className="text-xs text-gray-400">{formattedTime}</span>
						{notification.triggeredBy && (
							<span className="text-xs text-gray-400">
								• {notification.triggeredBy.name}
							</span>
						)}
					</div>
				</div>
			</div>
		</button>
	);
}

interface NotificationPanelProps {
	className?: string;
}

export function NotificationPanel({ className }: NotificationPanelProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Close panel when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				panelRef.current &&
				buttonRef.current &&
				!panelRef.current.contains(event.target as Node) &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Fetch unread count on mount and periodically
	const fetchUnreadCount = useCallback(async () => {
		const result = await getUnreadCount();
		if (result.data) {
			setUnreadCount(result.data.count);
		}
	}, []);

	// Fetch notifications
	const fetchNotifications = useCallback(async (reset = true) => {
		setIsLoading(true);
		const result = await getNotifications({
			limit: 20,
			offset: reset ? 0 : notifications.length,
		});

		if (result.data) {
			setNotifications((prev) =>
				reset ? result.data!.notifications : [...prev, ...result.data!.notifications]
			);
			setUnreadCount(result.data.unreadCount);
			setHasMore(result.data.hasMore);
		}
		setIsLoading(false);
	}, [notifications.length]);

	// Initial fetch of unread count
	useEffect(() => {
		fetchUnreadCount();

		// Poll for new notifications every 30 seconds
		const interval = setInterval(fetchUnreadCount, 30000);
		return () => clearInterval(interval);
	}, [fetchUnreadCount]);

	// Fetch notifications when panel opens
	useEffect(() => {
		if (isOpen) {
			fetchNotifications(true);
		}
	}, [isOpen]);

	const handleMarkAsRead = async (notificationId: string) => {
		const result = await markNotificationAsRead(notificationId);
		if (result.data?.success) {
			setNotifications((prev) =>
				prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
		}
	};

	const handleMarkAllAsRead = async () => {
		const result = await markAllNotificationsAsRead();
		if (result.data) {
			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
			setUnreadCount(0);
		}
	};

	const handleNavigate = async (link: string) => {
		setIsOpen(false);
		// Navigate and then refresh to invalidate router cache
		await router.push(link);
		router.refresh();
	};

	return (
		<div className="relative">
			<button
				ref={buttonRef}
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"relative flex items-center justify-center",
					className
				)}
				aria-label="Notificaciones"
				aria-expanded={isOpen}
			>
				<Bell className="h-5 w-5" />
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{isOpen && (
				<div
					ref={panelRef}
					className="absolute bottom-full left-0 mb-2 w-[380px] bg-white rounded-lg shadow-lg border border-gray-200 z-50"
				>
				{/* Header */}
				<div className="flex flex-wrap gap-2 items-center justify-between px-4 py-3 border-b border-gray-200">
					<div className="flex items-center gap-2">
						<Bell className="h-4 w-4 text-gray-600" />
						<h3 className="font-semibold text-gray-900">Notificaciones</h3>
						{unreadCount > 0 && (
							<span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
								{unreadCount} nueva{unreadCount !== 1 ? "s" : ""}
							</span>
						)}
					</div>
					{unreadCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleMarkAllAsRead}
							className="text-xs text-gray-500 hover:text-gray-700 h-auto py-1"
						>
							<CheckCheck className="h-3.5 w-3.5 mr-1" />
							Marcar todas como leídas
						</Button>
					)}
				</div>

				{/* Notification list */}
				<div className="max-h-[400px] overflow-y-auto">
					{isLoading && notifications.length === 0 ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
						</div>
					) : notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
							<div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
								<Bell className="h-6 w-6 text-gray-400" />
							</div>
							<p className="text-sm font-medium text-gray-900">
								No hay notificaciones
							</p>
							<p className="text-xs text-gray-500 mt-1">
								Te notificaremos cuando haya novedades
							</p>
						</div>
					) : (
						<div>
							{notifications.map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
									onMarkAsRead={handleMarkAsRead}
									onNavigate={handleNavigate}
								/>
							))}

							{/* Load more button */}
							{hasMore && (
								<div className="p-3 border-t border-gray-100">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => fetchNotifications(false)}
										disabled={isLoading}
										className="w-full text-gray-500 hover:text-gray-700"
									>
										{isLoading ? (
											<Loader2 className="h-4 w-4 animate-spin mr-2" />
										) : null}
										Cargar más
									</Button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
			)}
		</div>
	);
}
