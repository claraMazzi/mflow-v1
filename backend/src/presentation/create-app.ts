import express from "express";
import cors from "cors";
import { AppRoutes } from "./routes";
import { SocketServer } from "./socket-server";

/**
 * Creates an Express application with the same middlewares and routes as the main server.
 * Used for integration tests (Supertest) without starting an HTTP server or Socket.IO.
 * When socketServer is not provided, a mock is used so version/project/auth routes work.
 */
export function createApp(options?: {
	socketServer?: SocketServer | null;
	frontEndURL?: string;
}): express.Application {
	const app = express();
	const frontEndURL = options?.frontEndURL ?? "http://localhost:3001";

	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(cors({ origin: frontEndURL }));
	app.use(express.static("/public"));

	// For integration tests we don't have a real HTTP server; use a type-safe mock so routes register
	const socketServer =
		options?.socketServer ??
		(({} as unknown) as SocketServer);

	const routes = new AppRoutes({ socketServer }).routes;
	app.use(routes);

	return app;
}
