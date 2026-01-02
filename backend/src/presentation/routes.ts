import { Router } from "express";
import { Authroutes } from "./auth/routes";
import { UserRoutes } from "./user/routes";
import { UploadRoutes } from "./upload/routes";
import { ProjectRoutes } from "./project/routes";
import { SocketServer } from "./socket-server";
import { DeletionRequestRoutes } from "./deletion-request/routes";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { VersionRoutes } from "./version/routes";

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

		//auth routes
		router.use("/api/auth", Authroutes.routes);
		//user routes
		router.use("/api/users", UserRoutes.routes);
		
		//file upload routes
		router.use("/api/uploads", this.uploadRoutes.routes);
		
		//-----------user needs to be logged in routes
		router.use(AuthMiddleware.validateJWT);

		//projects routes
		router.use("/api/projects", ProjectRoutes.routes);

		router.use("/api/versions", VersionRoutes.routes)

		//-----------user needs to be admin routes
		router.use(AuthMiddleware.validateRequiredRoles(["ADMIN"]));
		
		//deletion requests routes
        router.use('/api/deletion-requests', DeletionRequestRoutes.routes)

        return router;
    }
}

