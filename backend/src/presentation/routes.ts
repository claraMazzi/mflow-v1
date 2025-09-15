import { Router } from "express";
import { Authroutes } from "./auth/routes";
import { UserRoutes } from "./user/routes";
import { UploadRoutes } from "./upload/routes";
import { ProjectRoutes } from "./project/routes";
import { CollaborationRoom } from "./collaboration/collaborationRoom";
import { Server as SocketIO } from "socket.io";

export class AppRoutes {
	private socketServer: SocketIO;
	private activeCollaborationRooms: Map<string, CollaborationRoom>;
	private uploadRoutes: UploadRoutes;

	constructor({
		socketServer,
		activeCollaborationRooms,
	}: {
		socketServer: SocketIO;
		activeCollaborationRooms: Map<string, CollaborationRoom>;
	}) {
		this.socketServer = socketServer;
		this.activeCollaborationRooms = activeCollaborationRooms;
		this.uploadRoutes = new UploadRoutes({
			socketServer,
			activeCollaborationRooms,
		});
	}

	get routes(): Router {
		const router = Router();

		//Definir las rutas
		router.use("/api/auth", Authroutes.routes);

		router.use("/api/users", UserRoutes.routes);

		router.use("/api/uploads", this.uploadRoutes.routes);

		router.use("/api/projects", ProjectRoutes.routes);

		return router;
	}
}
