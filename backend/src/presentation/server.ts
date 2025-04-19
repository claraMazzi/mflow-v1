import express, { Router } from "express";
import { ProjectModel, UserModel, VersionModel } from "../data";
import { Server as SocketIO } from "socket.io";
import { VersionService } from "./services";

type BaseSocketEventPayload = { type: string; timestamp: Date };

enum CLIENT_WS_EVENT_TYPES {
	JOIN_ROOM = "join-room",
}

type JoinRoomEventPayload = BaseSocketEventPayload & {
	type: CLIENT_WS_EVENT_TYPES.JOIN_ROOM;
	roomId: string;
	username: string;
};

type FirstInRoomPayload = BaseSocketEventPayload & {
	type: SERVER_WS_EVENT_TYPES.FIRST_IN_ROOM;
};

type UsersInRoomChangePayload = BaseSocketEventPayload & {
	type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE;
	socketsInRoom: string[];
};

type InitializeConceptualModelPayload = BaseSocketEventPayload & {
	type: SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL;
	conceptualModel: any;
};

enum SERVER_WS_EVENT_TYPES {
	FIRST_IN_ROOM = "first-in-room",
	USERS_IN_ROOM_CHANGE = "users-in-room-change",
	INITIALIZE_CONCEPTUAL_MODEL = "initialize-conceptual-model",
}

interface Options {
	port?: number;
	routes: Router;
}
export class Server {
	private app = express();
	private port: number;
	private routes: Router;
	private serverListener: any;

	constructor(options: Options) {
		const { port, routes } = options;
		this.port = port ?? 3000;
		this.routes = routes;
	}

	//punto de inicio de la aplicacion
	async start() {
		//* para servir todo lo que tengo en mi carpeta publica uso un middleware
		//middleware - funciones que se ejecutan cada vez que el codigo pase por x ruta y antes del controller

		//* Middlewares
		this.app.use(express.json()); // raw - extrae el body en un jsin
		this.app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded - extrae el form en json

		//* Public folder
		this.app.use(express.static("/public"));

		//* Routes
		this.app.use(this.routes);

		//pongo a la app a escuchar peticiones
		this.serverListener = this.app.listen(this.port, () => {
			console.log(`Server running on port ${this.port}`);
		});

		// Setup Socket IO
		const io = new SocketIO(this.serverListener, {
			cors: {
				origin: "http://localhost:3000",
				methods: ["GET", "POST"],
			},
		});

		const versionService = new VersionService();

		io.on("connection", (socket) => {
			console.log("New Socket Connection: ", socket.id);

			socket.on(
				CLIENT_WS_EVENT_TYPES.JOIN_ROOM,
				async (payload: JoinRoomEventPayload) => {
					//TODO: ADD CHECK OF VALIDIY BEFORE ADDING THE SOCKET TO THE ROOM
					const { version } = await versionService.getVersionById(
						payload.roomId
					);

					socket.emit(SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL, {
						type: SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL,
						timestamp: new Date(),
						conceptualModel: { ...(version as any).conceptualModel._doc },
					} satisfies InitializeConceptualModelPayload);

					await socket.join(payload.roomId);

					const socketsInRoom = await io.in(payload.roomId).fetchSockets();
					if (socketsInRoom.length <= 1) {
						socket.emit(SERVER_WS_EVENT_TYPES.FIRST_IN_ROOM, {
							type: SERVER_WS_EVENT_TYPES.FIRST_IN_ROOM,
							timestamp: new Date(),
						} satisfies FirstInRoomPayload);
					}

					io.to(payload.roomId).emit(
						SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
						{
							type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
							socketsInRoom: socketsInRoom.map((s) => s.id),
							timestamp: new Date(),
						} satisfies UsersInRoomChangePayload
					);
				}
			);

			socket.on(
				"client-volatile-broadcast",
				(payload: {
					roomId: string;
					userId: string;
					mousePosition: { relativeX: number; relativeY: number };
					type: string;
					timestamp: Date;
				}) => {
					socket.to(payload.roomId).emit("server-volatile-broadcast", {
						socketId: socket.id,
						userId: payload.userId,
						mousePosition: payload.mousePosition,
						type: payload.type,
						timestamp: payload.timestamp,
					});
				}
			);

			const parsePropertyPath = (conceptualModel: any, path: string) => {
				const pathParts = path.split(".");
				for (let i = 0; i < pathParts.length - 1; i++) {
					if (Array.isArray(conceptualModel[pathParts[i]])) {
						pathParts[i + 1] = conceptualModel[pathParts[i]].findIndex(
							(e: any) => e._id.equals(pathParts[i + 1])
						);
					}
					conceptualModel = conceptualModel[pathParts[i]];
				}
				return pathParts;
			};

			socket.on(
				"field-update",
				async (payload: { fieldName: string; value: any; roomId: string }) => {
					const { version } = await versionService.getVersionById(
						payload.roomId
					);

					const setValue = (
						conceptualModel: any,
						properyPath: string,
						value: any
					) => {
						const parts = parsePropertyPath(conceptualModel, properyPath);
						console.log("Updated Field Path Parts: ", parts);
						while (
							parts.length > 1
							//parts.length > 1 &&
							//conceptualModel.hasOwnProperty(parts[0])
						) {
							conceptualModel = conceptualModel[parts.shift()!];
						}
						conceptualModel[parts[0]] = value;
					};

					setValue(
						(version as any).conceptualModel,
						payload.fieldName,
						payload.value
					);
					version.save();

					io.to(payload.roomId).emit("field-update", {
						fieldName: payload.fieldName,
						value: payload.value,
					});
				}
			);

			const getProperty = (conceptualModel: any, propertyPath: string) => {
				const pathParts = parsePropertyPath(conceptualModel, propertyPath);
				while (
					pathParts.length > 1
					//parts.length > 1 &&
					//conceptualModel.hasOwnProperty(parts[0])
				) {
					conceptualModel = conceptualModel[pathParts.shift()!];
				}
				return conceptualModel[pathParts[0]];
			};

			socket.on("add-item-to-list", async ({ roomId, listFieldPath }) => {
				const { version } = await versionService.getVersionById(roomId);

				let listField = getProperty(version.conceptualModel, listFieldPath);
				listField.push({ description: "" });

				version.save();

				listField = getProperty(version.conceptualModel, listFieldPath);
				let newItem = listField.at(listField.length - 1);
				newItem = newItem._doc;

				io.to(roomId).emit("item-added-to-list", { listFieldPath, newItem });
			});

			socket.on(
				"remove-item-from-list",
				async ({ roomId, listFieldPath, itemId }) => {
					const { version } = await versionService.getVersionById(roomId);

					let listField = getProperty(version.conceptualModel, listFieldPath);
					const itemToDelete = listField.find((s : any) => s._id.equals(itemId));
					listField.remove(itemToDelete);

					version.save();

					io.to(roomId).emit("item-removed-from-list", {
						listFieldPath,
						itemId,
					});
				}
			);

			socket.on("disconnecting", async () => {
				console.log("Socket Disconnected ", socket.id);
				for (const roomID of Array.from(socket.rooms)) {
					const otherClients = (await io.in(roomID).fetchSockets()).filter(
						(_socket) => _socket.id !== socket.id
					);

					if (otherClients.length > 0) {
						socket.broadcast
							.to(roomID)
							.emit(SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE, {
								type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
								socketsInRoom: otherClients.map((s) => s.id),
								timestamp: new Date(),
							} satisfies UsersInRoomChangePayload);
					}
				}
			});
		});

		//Uncomment when needed
		//this.createTestEntities();
	}

	private createTestEntities() {
		//Warning! - Drops all collections to allow for a fresh start
		UserModel.collection.drop();
		ProjectModel.collection.drop();
		VersionModel.collection.drop();

		const user = new UserModel({
			name: "Juan",
			lastName: "Albani",
			email: "juanalbani48@gmail.com",
			password: "hola123",
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
