import jwt from "jsonwebtoken";
import { envs } from "./envs";

const JWT_SEED = envs.JWT_SEED;

export const jwtAdapter = {
  generateToken: async (payload: any, duration: string = "2h") => {
    return new Promise((resolve) => {
      jwt.sign(
        payload,
        JWT_SEED,
        { expiresIn: duration as jwt.SignOptions["expiresIn"] },
        (err, token) => {
          if (err) return resolve(null);

          resolve(token);
        }
      );
    });
  },

  validateToken: (token: string) => {
    return new Promise((resolve) => {
      jwt.verify(token, JWT_SEED, (err, decoded) => {
        if (err) return resolve(null);
        resolve(decoded);
      });
    });
  },
};
