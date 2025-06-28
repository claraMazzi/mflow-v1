import { Router } from "express";
import { Authroutes } from "./auth/routes";
import { UserRoutes } from "./user/routes";
import { UploadRoutes } from "./upload/routes";
import { ProjectRoutes } from "./project/routes";


export class AppRoutes {
    static get routes(): Router {
        const router = Router();

        //Definir las rutas
        router.use('/api/auth', Authroutes.routes );

        router.use('/api/users', UserRoutes.routes );

        router.use('/api/uploads', UploadRoutes.routes)

        router.use('/api/projects', ProjectRoutes.routes)

        return router;
    }
}