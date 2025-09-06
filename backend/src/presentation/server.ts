import express, { Router } from "express";
import { ProjectModel, UserModel, VersionModel } from "../data";
import { Server as SocketIO } from "socket.io";
import { VersionService } from "./services";
import fs from "fs/promises";
import { error, timeStamp } from "console";
import { envs, jwtAdapter } from "../config";
import path from "path";
import { CollaborationRoom } from "./collaboration/collaborationRoom";
import {
	EditingPrivilegesAlreadyGrantedError,
	EditingPrivilegesRequiredException,
	EditingRequestNotFoundError,
	InvalidApprovalAuthorityException,
	PendingRequestConflictError,
} from "../domain/errors/collaborationRoom.errors";

type BaseSocketEventPayload = { type: string; timestamp: Date };

enum CLIENT_WS_EVENT_TYPES {
	JOIN_ROOM = "join-room",
}

type JoinRoomEventPayload = BaseSocketEventPayload & {
	type: CLIENT_WS_EVENT_TYPES.JOIN_ROOM;
	roomId: string;
};

type UsersInRoomChangePayload = BaseSocketEventPayload & {
	type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE;
	roomState: {
		roomId: string;
		currentEditingUser: string | null;
		collaborators: {
			userId: string;
			name: string;
			lastName: string;
			email: string;
			socketIds: string[];
		}[];
	};
};

type InitializeConceptualModelPayload = BaseSocketEventPayload & {
	type: SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL;
	conceptualModel: any;
};

enum SERVER_WS_EVENT_TYPES {
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
	private collaborationRooms: Map<string, CollaborationRoom> = new Map();

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
			console.info(`Server running on port ${this.port}`);
		});

		// Setup Socket IO
		const io = new SocketIO(this.serverListener, {
			cors: {
				origin: "http://localhost:3000",
				methods: ["GET", "POST"],
			},
		});

		setInterval(() => {
			const allActiveSocketIds = new Set<string>();

			// Collect all currently connected socket IDs
			io.sockets.sockets.forEach((socket) => {
				allActiveSocketIds.add(socket.id);
			});

			const roomsToRemove: string[] = [];
			this.collaborationRooms.forEach((room, roomId) => {
				room.cleanupStaleConnections(allActiveSocketIds);
				if (room.isEmpty()) {
					roomsToRemove.push(roomId);
				}
			});

			roomsToRemove.forEach((roomId) => {
				console.info("Stale collaboration room deleted:", roomId);
				this.collaborationRooms.delete(roomId);
			});
		}, 30000);

		//Socket Authentication Middleware
		io.use(async (socket, next) => {
			const sessionToken = socket.handshake.auth.sessionToken;

			try {
				const payload = await jwtAdapter.validateToken<{ id: string }>(
					sessionToken
				);
				if (!payload) return next(new Error("Invalid token"));

				const user = await UserModel.findById(payload.id);

				if (!user) return next(new Error(`Invalid user token`));

				socket.data.userId = user.id;
				socket.data.name = user.name;
				socket.data.lastName = user.lastName;
				socket.data.email = user.email;

				next();
			} catch (error) {
				console.error(error);
				return next(new Error("Internal server error"));
			}
		});

		const versionService = new VersionService();

		io.on("connection", async (socket) => {
			console.info(
				`New Socket Connection: ${socket.id} - User: ${socket.data.userId}`
			);

			//Individual room for the user
			await socket.join(`user@${socket.data.userId}`);

			socket.on(
				CLIENT_WS_EVENT_TYPES.JOIN_ROOM,
				async (payload: JoinRoomEventPayload) => {
					//TODO: ADD CHECK OF VALIDIY BEFORE ADDING THE SOCKET TO THE ROOM
					const { version } = await versionService.getVersionById(
						payload.roomId
					);

					if (!this.collaborationRooms.has(version.id)) {
						console.info("New collaboration room created:", version.id);
						this.collaborationRooms.set(
							version.id,
							new CollaborationRoom(version.id)
						);
					}
					const collabRoom = this.collaborationRooms.get(version.id)!;

					socket.emit(SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL, {
						type: SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL,
						timestamp: new Date(),
						conceptualModel: { ...(version as any).conceptualModel._doc },
					} satisfies InitializeConceptualModelPayload);

					await socket.join(payload.roomId);

					console.info(
						`Collaborator Added: ${socket.id} - ${socket.data.userId}`
					);
					collabRoom.addCollaborator({
						socketId: socket.id,
						userInfo: socket.data,
					});

					io.to(payload.roomId).emit(
						SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
						{
							type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
							roomState: collabRoom.getRoomState(),
							timestamp: new Date(),
						} satisfies UsersInRoomChangePayload
					);
				}
			);

			socket.on(
				"client-volatile-broadcast",
				({
					roomId,
					currentTab,
					mousePosition,
				}: {
					roomId: string;
					currentTab: string;
					mousePosition?: { relativeX: number; relativeY: number };
				}) => {
					socket.to(roomId).emit("server-volatile-broadcast", {
						socketId: socket.id,
						userId: socket.data.userId,
						currentTab: currentTab,
						mousePosition: mousePosition,
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

			const setValue = (
				conceptualModel: any,
				properyPath: string,
				value: any
			) => {
				const parts = parsePropertyPath(conceptualModel, properyPath);
				console.info("Updated Field Path Parts: ", parts);
				while (
					parts.length > 1
					//parts.length > 1 &&
					//conceptualModel.hasOwnProperty(parts[0])
				) {
					conceptualModel = conceptualModel[parts.shift()!];
				}
				conceptualModel[parts[0]] = value;
			};

			socket.on(
				"field-update",
				async (payload: {
					propertyPath: string;
					value: any;
					roomId: string;
				}) => {
					const { version } = await versionService.getVersionById(
						payload.roomId
					);

					setValue(
						(version as any).conceptualModel,
						payload.propertyPath,
						payload.value
					);
					version.save();

					io.to(payload.roomId).emit("field-update", {
						propertyPath: payload.propertyPath,
						value: payload.value,
					});
				}
			);

			socket.on(
				"request-editing-privilege",
				({ roomId }: { roomId: string }) => {
					const collabRoom = this.collaborationRooms.get(roomId);

					if (!collabRoom) {
						console.info(
							`An Editing Request was ignored for Room: ${roomId} - Requester UserId: ${socket.data.userId}`
						);
						return;
					}

					const callbackFunction = () => {
						io.to(roomId).emit(SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE, {
							type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
							roomState: collabRoom.getRoomState(),
							timestamp: new Date(),
						} satisfies UsersInRoomChangePayload);
					};

					try {
						const { requestId, editorUserId, timeoutStartTimestamp } =
							collabRoom.addEditingRequest({
								requesterUserId: socket.data.userId,
								callbackFunction,
							});

						io.to(roomId).emit("editing-request-started", {
							type: "editing-request-started",
							requestId,
							editorUserId,
							timeoutStartTimestamp,
							requesterUserId: socket.data.userId,
							timestamp: new Date(),
						});
					} catch (error) {
						if (
							error instanceof PendingRequestConflictError ||
							error instanceof EditingPrivilegesAlreadyGrantedError
						) {
							console.error(error.message);
							io.to(`user@${socket.data.userId}`).emit(
								"editing-request-creation-refused",
								{
									type: "editing-request-creation-refused",
									timestamp: new Date(),
								}
							);
						} else {
							console.error(
								`Unexpected error during Editing Request Creation: ${error}`
							);
							throw error;
						}
					}
				}
			);

			socket.on(
				"accept-editing-request",
				({ roomId, requestId }: { roomId: string; requestId: string }) => {
					const collabRoom = this.collaborationRooms.get(roomId);

					if (!collabRoom) {
						console.debug(
							`The approval of an editing request was skipped because the specified room ${roomId} didn't exist.`
						);
						return;
					}

					try {
						collabRoom.approveEditingRequest({
							requestId,
							evaluatorUserId: socket.data.userId,
						});

						console.debug(
							`The approval of the editing request: ${requestId} in the room: ${roomId} was successful.`
						);

						io.to(roomId).emit("editing-request-approved", {
							type: "editing-request-approved",
							requestId,
							timeStamp: new Date(),
						});

						io.to(roomId).emit(SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE, {
							type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
							roomState: collabRoom.getRoomState(),
							timestamp: new Date(),
						} satisfies UsersInRoomChangePayload);
					} catch (error) {
						if (
							error instanceof EditingRequestNotFoundError ||
							error instanceof InvalidApprovalAuthorityException ||
							error instanceof EditingPrivilegesRequiredException
						) {
							console.error(error.message);
							io.to(`user@${socket.data.userId}`).emit(
								"editing-request-approval-failed",
								{
									requestId,
									type: "editing-request-approval-failed",
									timestamp: new Date(),
								}
							);
						} else {
							console.error(
								`Unexpected error during Editing Request Approval: ${error}`
							);
							throw error;
						}
					}
				}
			);

			socket.on(
				"decline-editing-request",
				({ roomId, requestId }: { roomId: string; requestId: string }) => {
					const collabRoom = this.collaborationRooms.get(roomId);

					if (!collabRoom) {
						console.info(
							`The refusal of an editing request was skipped because the specified room ${roomId} didn't exist.`
						);
						return;
					}

					try {
						const requesterUserId = collabRoom.declineEditingRequest({
							requestId,
							evaluatorUserId: socket.data.userId,
						});

						console.debug(
							`The refusal of the editing request: ${requestId} in the room: ${roomId} was successful.`
						);

						io.to(`user@${requesterUserId}`).emit("editing-request-declined", {
							type: "editing-request-declined",
							requestId,
							timestamp: new Date(),
						});
					} catch (error) {
						if (
							error instanceof EditingRequestNotFoundError ||
							error instanceof InvalidApprovalAuthorityException ||
							error instanceof EditingPrivilegesRequiredException
						) {
							console.error(error.message);
							io.to(`user@${socket.data.userId}`).emit(
								"editing-request-refusal-failed",
								{
									requestId,
									type: "editing-request-refusal-failed",
									timestamp: new Date(),
								}
							);
						} else {
							console.error(
								`Unexpected error during Editing Request Refusal: ${error}`
							);
							throw error;
						}
					}
				}
			);

			socket.on(
				"add-item-to-list",
				async ({
					roomId,
					listPropertyPath,
					itemType,
				}: {
					roomId: string;
					listPropertyPath: string;
					itemType: "assumption" | "simplification" | "entity";
				}) => {
					const { version } = await versionService.getVersionById(roomId);

					let listField = getProperty(
						version.conceptualModel,
						listPropertyPath
					);

					switch (itemType) {
						case "assumption":
							listField.push({ description: "" });
							break;
						case "entity":
							listField.push({
								name: "",
								scopeDecision: {},
								dynamicDiagram: {},
								properties: [],
							});
							break;
						case "simplification":
							listField.push({ description: "" });
							break;
					}

					version.save();

					listField = getProperty(version.conceptualModel, listPropertyPath);
					let newItem = listField.at(listField.length - 1);
					newItem = newItem._doc;

					io.to(roomId).emit("item-added-to-list", {
						listPropertyPath,
						newItem,
					});
				}
			);

			socket.on(
				"remove-item-from-list",
				async ({ roomId, listPropertyPath, itemId }) => {
					const { version } = await versionService.getVersionById(roomId);

					let listField = getProperty(
						version.conceptualModel,
						listPropertyPath
					);
					const itemToDelete = listField.find((s: any) => s._id.equals(itemId));
					listField.remove(itemToDelete);

					version.save();

					io.to(roomId).emit("item-removed-from-list", {
						listPropertyPath,
						itemId,
					});
				}
			);

			socket.on("disconnecting", async () => {
				console.info("Socket Disconnected ", socket.id);
				for (const roomId of Array.from(socket.rooms)) {
					const collabRoom = this.collaborationRooms.get(roomId);

					if (!collabRoom) continue;

					console.info(
						`Collaborator Removed: ${socket.id} - ${socket.data.userId}`
					);
					collabRoom.removeCollaborator({
						socketId: socket.id,
						userId: socket.data.userId,
					});
					if (!collabRoom.isEmpty()) {
						io.to(roomId).emit(SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE, {
							type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
							roomState: collabRoom.getRoomState(),
							timestamp: new Date(),
						} satisfies UsersInRoomChangePayload);
					} else {
						console.info("Collaboration room deleted:", roomId);
						this.collaborationRooms.delete(roomId);
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
