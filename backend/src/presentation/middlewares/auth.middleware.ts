import { NextFunction, Response, Request } from "express";
import { jwtAdapter } from "../../config";
import { UserModel } from "../../data";

export class AuthMiddleware {
  /** si necesito realizar inyeccion de dependencias entonces necesito
   * un constructor para poder instanciar la clase y pasarle las dependencias
   *
   * Si no uso inyeccion de dependencias, no necesito instanciar la clase y mi metodo
   * constructor puede ser static
   */

  static async validateJWT(req: Request, res: Response, next: NextFunction) {
    const authorization = req.header("Authorization");
    if (!authorization)
      return res.status(401).json({ error: "No token provided" });
    if (!authorization.startsWith("Bearer "))
      return res.status(500).json({ error: "Invalid bearer token" });
    const token = authorization.split(" ").at(1) || "";

    try {
      const payload = await jwtAdapter.validateToken<{ id: string }>(token);
      if (!payload) return res.status(401).json({ error: "Invalid token" });

      const user = await UserModel.findById(payload.id);

      if (!user) return res.status(404).json({ error: `Invalid token user` });

      //TODO: validar si el usuario esta acitvo
      //todo argregar los user roles y abajo llamarlo solo del req.session
      req.session = { userId: user.id, roles: user.roles };

      next(); //procede con el siguiente middleware o el proximo controlador de ruta
    } catch (error) {
      //errores no controlados
      console.log("middleware error", error);

      res.status(500).json({ error: "Internal server error" });
    }
  }

  static validateRequiredRoles(requiredRoles: string[]) {
    //le paso por parametro la lista de required roles --req: Request, res:Response, next: NextFunction

    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Check if session exists
        if (!req.session) {
          return res.status(401).json({ error: "No session found" });
        }

        // Check if user has roles
        if (!req.session.roles || !Array.isArray(req.session.roles)) {
          return res.status(403).json({ error: "User has no roles assigned" });
        }

        // Check if user has all required roles
        const hasAllRequiredRoles = requiredRoles.every(requiredRole => 
          req.session!.roles.includes(requiredRole)
        );

        if (!hasAllRequiredRoles) {
          return res.status(403).json({ 
            error: `User does not have required roles. Required: ${requiredRoles.join(', ')}` 
          });
        }

        // User has all required roles, proceed to next middleware
        next();
      } catch (error) {
        //errores no controlados
        console.log("validateRequiredRoles middleware error", error);
        res.status(500).json({ error: "Internal server error" });
      }
    };
  }
  
}
