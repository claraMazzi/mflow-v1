import express, { Router } from "express";
import { ProjectModel, UserModel, VersionModel } from "../data";
import { bcryptAdapter } from "../config";
import { Server as SocketIO } from "socket.io";
import { VersionService } from "./services";
import fs from "fs/promises";
import { error, timeStamp } from "console";
import { envs, jwtAdapter } from "../config";
import path from "path";
import { CollaborationRoom } from "./collaboration/collaborationRoom";
import { AppRoutes } from "./routes";
import { getProperty, setValue } from "../types/socket-events";
import { SocketServer } from "./socket-server";

interface Options {
	port?: number;
	frontEndURL?: string;
}
export class Server {
	private app = express();
	private port: number;
	private frontEndURL: string;
	private routes: Router | null;
	private serverListener: any;
	private socketServer: SocketServer | null;
	private activeCollaborationRooms: Map<string, CollaborationRoom>;

	constructor(options: Options) {
		const { port, frontEndURL } = options;
		this.frontEndURL = frontEndURL ?? "http://localhost:3001";
		this.port = port ?? 3000;
		this.activeCollaborationRooms = new Map();
		this.routes = null;
		this.socketServer = null;
	}

	//punto de inicio de la aplicacion
	async start() {
		//* para servir todo lo que tengo en mi carpeta publica uso un middleware
		//middleware - funciones que se ejecutan cada vez que el codigo pase por x ruta y antes del controller

		var cors = require("cors");

		//* Middlewares
		this.app.use(express.json()); // raw - extrae el body en un jsin
		this.app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded - extrae el form en json
		this.app.use(
			cors({
				origin: this.frontEndURL,
			})
		);

		//* Public folder
		this.app.use(express.static("/public"));

		//pongo a la app a escuchar peticiones
		this.serverListener = this.app.listen(this.port, () => {
			console.info(`Server running on port ${this.port}`);
		});

		this.socketServer = new SocketServer({
			serverListener: this.serverListener,
			frontEndURL: this.frontEndURL,
		});

		// Setup App Routes
		this.routes = new AppRoutes({
			socketServer: this.socketServer,
		}).routes;

		//* Routes
		this.app.use(this.routes);

		//Uncomment when needed
		//this.createTestEntities();
		//this.seedUsers();
	}

	private async seedUsers() {
		const hashedPassword = await bcryptAdapter.hash("123456");

		const users = [
			{
				name: "Ana",
				lastName: "González",
				email: "ana.admin@example.com",
				password: hashedPassword,
				roles: ["ADMIN"],
				emailValidated: true,
			},
			{
				name: "Carlos",
				lastName: "Pérez",
				email: "carlos.verificador@example.com",
				password: hashedPassword,
				roles: ["VERIFICADOR"],
				emailValidated: false,
			},
			{
				name: "Lucía",
				lastName: "Martínez",
				email: "lucia.modelador@example.com",
				password: hashedPassword,
				roles: ["MODELADOR"],
				emailValidated: true,
			},
			{
				name: "Juan",
				lastName: "Rodríguez",
				email: "juan.multi@example.com",
				password: hashedPassword,
				roles: ["MODELADOR", "VERIFICADOR"],
				emailValidated: true,
			},
		];

		await UserModel.insertMany(users);
	}

	private async createTestEntities() {
		//Warning! - Drops all collections to allow for a fresh start
		UserModel.collection.drop();
		ProjectModel.collection.drop();
		VersionModel.collection.drop();

		const hashedPassword = await bcryptAdapter.hash("123456");

		const user = new UserModel({
			name: "Juan",
			lastName: "Albani",
			email: "juanalbani48@gmail.com",
			password: hashedPassword,
			emailValidated: true,
			roles: ["MODELADOR"],
		});

		user.save();

		const version = new VersionModel({
			_id: "67d8321cd76cf5bc5bd75c79",
			title: "Version 1",
			conceptualModel: {
				objective: "",
				structureDiagram: {
					usesPlantText: true,
					plantTextCode: "",
					imageFilePath: "",
				},
				flowDiagram: {
					usesPlantText: true,
					plantTextCode: "",
					imageFilePath: "",
				},
			},
		});

		version.save();

		const project = new ProjectModel({
			name: "P1",
			description: "Whatever",
			owner: user._id,
		});

		project.versions.push(version._id);

		project.save();
	}

	public close() {
		this.serverListener?.close();
	}
}
