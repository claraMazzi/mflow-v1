import { Router } from "express";
import { Authroutes } from "./auth/routes";
import { UserRoutes } from "./user/routes";
import { UploadRoutes } from "./upload/routes";
import { ProjectRoutes } from "./project/routes";
import { SocketServer } from "./socket-server";
import { DeletionRequestRoutes } from "./deletion-request/routes";

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
// ver si rotuer.use(middleware) funciona para todas las de de abajo el validateJWT 
		router.use("/api/users", UserRoutes.routes);

		router.use("/api/uploads", this.uploadRoutes.routes);

		router.use("/api/projects", ProjectRoutes.routes);

        router.use('/api/deletion-requests', DeletionRequestRoutes.routes)

        return router;
    }
}

