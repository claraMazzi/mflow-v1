import { NextFunction, Response, Request } from "express";
import { jwtAdapter } from "../../config";
import { UserModel } from "../../data";

export class AuthMiddleware {

  static async validateJWT(req: Request, res: Response, next: NextFunction) {
    const authorization = req.header("Authorization");
    if (!authorization) {
      return res.status(401).json({ error: "No se proporcionó ningún token de autenticación." });
    }
    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No se proporcionó ningún token de autenticación." });
    }

    const token = authorization.split(" ").at(1);
    if (!token) {
      return res.status(401).json({ error: "No se proporcionó ningún token de autenticación." });
    }

    try {
      const payload = await jwtAdapter.validateToken<{ id: string }>(token);

      if (!payload) return res.status(401).json({ error: "El token de sesión es inválido o ha expirado." });

      const user = await UserModel.findOne({_id: payload.id, deletedAt: null});

      if (!user) return res.status(404).json({ error: `No se encontró el usuario asociado al token de sesión o el usuario ha sido dado de baja.` });

      req.session = { userId: user.id, roles: user.roles };

      next(); 
    } catch (error) {
      console.error("Authentication middleware error: ", error);

      res.status(500).json({ error: "Ocurrió un error interno en el servidor." });
    }
  }

  static validateRequiredRoles(requiredRoles: string[]) {

    return (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.session) {
          return res.status(401).json({ error: "No se encontró una sesión activa." });
        }

        const hasAllRequiredRoles = requiredRoles.every(requiredRole => 
          req.session!.roles.includes(requiredRole)
        );

        if (!hasAllRequiredRoles) {
          return res.status(403).json({ 
            error: `Acceso denegado. Se requieren los siguientes roles: ${requiredRoles.join(", ")}.` 
          });
        }

        next();
      } catch (error) {
        console.error("Authorization middleware error: ", error);
        res.status(500).json({ error: "Ocurrió un error interno al verificar los permisos del usuario." });
      }
    };
  }
  
}
