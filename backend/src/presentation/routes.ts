import { Router } from "express";
import { Authroutes } from "./auth/routes";
import { UserRoutes } from "./user/routes";
import { UploadRoutes } from "./upload/routes";
import { ProjectRoutes } from "./project/routes";
import { CollaborationRoom } from "./collaboration/collaborationRoom";
import { Server as SocketIO } from "socket.io";
import { SocketServer } from "./socket-server";

export class AppRoutes {
	private socketServer: SocketServer;
	private uploadRoutes: UploadRoutes;

	constructor({ socketServer }: { socketServer: SocketServer }) {
		this.socketServer = socketServer;
		this.uploadRoutes = new UploadRoutes({
			socketServer,
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
