import { Router } from "express";
import { Authroutes } from "./auth/routes";
import { UserRoutes } from "./user/routes";
import { Projectroutes } from "./project/routes";

export class AppRoutes {
    static get routes(): Router {
        const router = Router();

        //Definir las rutas
        router.use('/api/auth', Authroutes.routes );

        router.use('/api/users', UserRoutes.routes );

        router.use('/api/projects', Projectroutes.routes)


        return router;
    }
}