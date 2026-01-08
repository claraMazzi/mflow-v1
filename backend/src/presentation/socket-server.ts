import { Socket, Server as SocketIO } from "socket.io";
import { CollaborationRoom } from "./collaboration/collaborationRoom";
import { Server } from "http";
import {
	EditingPrivilegesAlreadyGrantedError,
	EditingPrivilegesRequiredException,
	EditingRequestNotFoundError,
	InvalidApprovalAuthorityException,
	PendingRequestConflictError,
} from "../domain/errors/collaborationRoom.errors";
import { VersionService } from "./services";
import { jwtAdapter } from "../config";
import { UserModel } from "../data";
import { getProperty, setValue } from "../types/socket-events";
import { ConceptualModel } from "../data/mongo/models/subdocuments-schemas";
import { Version } from "../data/mongo/models/version.model";
import { VersionImage } from "../data/mongo/models/version-image.model";
const plantumlEncoder = require("plantuml-encoder");

type BaseSocketEventPayload = { type: string; timestamp: Date };

enum CLIENT_WS_EVENT_TYPES {
	JOIN_ROOM = "join-room",
	PLANT_TEXT_GET_IMAGE = "plant-text-get-image",
}

type JoinRoomEventPayload = BaseSocketEventPayload & {
	type: CLIENT_WS_EVENT_TYPES.JOIN_ROOM;
	roomId: string;
};

// type PlantTextCodeChangePayload = BaseSocketEventPayload & {
// 	type: CLIENT_WS_EVENT_TYPES.PLANT_TEXT_CODE_CHANGE;
// 	versionId: string;
// 	propertyPath: string;
// 	plantTextCode: string;
// };

type PlantTextGetImagePayload = BaseSocketEventPayload & {
	type: CLIENT_WS_EVENT_TYPES.PLANT_TEXT_GET_IMAGE;
	versionId: string;
	propertyPath: string;
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
	version: Version;
	imageInfos: (Pick<
		VersionImage,
		"originalFilename" | "url" | "createdAt" | "sizeInBytes"
	> & {
		id: string;
	})[];
};

type PlantTextImageUpdatePayload = BaseSocketEventPayload & {
	type: SERVER_WS_EVENT_TYPES.PLANT_TEXT_IMAGE_UPDATE;
	propertyPath: string;
	imageUrl: string;
	plantTextToken: string;
};

enum SERVER_WS_EVENT_TYPES {
	USERS_IN_ROOM_CHANGE = "users-in-room-change",
	INITIALIZE_CONCEPTUAL_MODEL = "initialize-conceptual-model",
	PLANT_TEXT_IMAGE_UPDATE = "plant-text-image-update",
}

export class SocketServer {
	private socketServer: SocketIO;
	private activeCollaborationRooms: Map<string, CollaborationRoom>;
	private versionService: VersionService;

	constructor({
		serverListener,
		frontEndURL,
	}: {
		serverListener: Server;
		frontEndURL: string;
	}) {
		this.socketServer = new SocketIO(serverListener, {
			cors: {
				origin: frontEndURL,
				methods: ["GET", "POST"],
			},
		});
		this.activeCollaborationRooms = new Map();
		this.versionService = new VersionService();

		this.setupMiddleware();
		this.setupConnectionHandlers();
		this.setupCleanupInterval();
	}

	private setupMiddleware() {
		// Socket Authentication Middleware
		this.socketServer.use(async (socket, next) => {
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
	}

	private setupConnectionHandlers() {
		this.socketServer.on("connection", async (socket) => {
			console.info(
				`New Socket Connection: ${socket.id} - User: ${socket.data.userId}`
			);

			// Individual room for the user
			await socket.join(`user@${socket.data.userId}`);

			this.setupSocketEventHandlers(socket);
		});
	}

	private setupSocketEventHandlers(socket: Socket) {
		socket.on(
			CLIENT_WS_EVENT_TYPES.JOIN_ROOM,
			(payload: JoinRoomEventPayload) => this.handleJoinRoom(socket, payload)
		);

		socket.on(
			"client-volatile-broadcast",
			(payload: {
				roomId: string;
				currentTab: string;
				mousePosition?: { relativeX: number; relativeY: number };
			}) => this.handleVolatileBroadcast(socket, payload)
		);

		socket.on(
			"field-update",
			(payload: { propertyPath: string; value: any; roomId: string }) =>
				this.handleFieldUpdate(socket, payload)
		);

		socket.on("request-editing-privilege", (payload: { roomId: string }) =>
			this.handleRequestEditingPrivilege(socket, payload)
		);

		socket.on(
			"accept-editing-request",
			(payload: { roomId: string; requestId: string }) =>
				this.handleAcceptEditingRequest(socket, payload)
		);

		socket.on(
			"decline-editing-request",
			(payload: { roomId: string; requestId: string }) =>
				this.handleDeclineEditingRequest(socket, payload)
		);

		socket.on(
			"add-item-to-list",
			(payload: {
				roomId: string;
				listPropertyPath: string;
				itemType:
					| "assumption"
					| "simplification"
					| "entity"
					| "input"
					| "output"
					| "property";
			}) => this.handleAddItemToList(socket, payload)
		);

		socket.on(
			"remove-item-from-list",
			(payload: { roomId: string; listPropertyPath: string; itemId: string }) =>
				this.handleRemoveItemFromList(socket, payload)
		);

/* 		socket.on(
			CLIENT_WS_EVENT_TYPES.PLANT_TEXT_GET_IMAGE,
			(payload: PlantTextGetImagePayload) =>
				this.handlePlantTextGetImage(socket, payload)
		); */

		socket.on("finalize-version", (payload: { roomId: string }) =>
			this.handleFinalizeVersion(socket, payload)
		);

		socket.on("finalize-version-confirm", (payload: { roomId: string }) =>
			this.handleFinalizeVersionConfirm(socket, payload)
		);

		socket.on("finalize-version-modal-close", (payload: { roomId: string }) =>
			this.handleFinalizeVersionModalClose(socket, payload)
		);

		socket.on("disconnecting", () => this.handleDisconnecting(socket));
	}

	private setupCleanupInterval() {
		setInterval(() => {
			const allActiveSocketIds = new Set<string>();

			// Collect all currently connected socket IDs
			this.socketServer.sockets.sockets.forEach((socket) => {
				allActiveSocketIds.add(socket.id);
			});

			const roomsToRemove: string[] = [];
			this.activeCollaborationRooms.forEach((room, roomId) => {
				const hasRoomChanged = room.cleanUpStaleConnections(allActiveSocketIds);
				if (room.isEmpty()) {
					roomsToRemove.push(roomId);
				} else {
					if (hasRoomChanged) {
						this.emitUsersInRoomChange(roomId, { collabRoom: room });
					}
				}
			});

			roomsToRemove.forEach((roomId) => {
				console.info("Stale collaboration room deleted:", roomId);
				this.activeCollaborationRooms.delete(roomId);
			});
		}, 30000);
	}

	// Event Handler Methods
	private async handleJoinRoom(socket: Socket, payload: JoinRoomEventPayload) {
		//TODO: ADD CHECK OF VALIDITY BEFORE ADDING THE SOCKET TO THE ROOM -- verificar que es colaborador del proyecto --
		const { version } = await this.versionService.getVersionByIdWithImages(
			payload.roomId
		);

		if (!this.activeCollaborationRooms.has(version.id)) {
			console.info("New collaboration room created:", version.id);
			this.activeCollaborationRooms.set(
				version.id,
				new CollaborationRoom(version.id)
			);
		}
		const collabRoom = this.activeCollaborationRooms.get(version.id)!;

		this.emitInitializeConceptualModel(socket, {
			version: version,
			imageInfos: version.imageInfos,
		});

		await socket.join(payload.roomId);

		console.info(`Collaborator Added: ${socket.id} - ${socket.data.userId}`);
		//TODO: hacer el ADD colaborator si el usuario es colaboradora
		collabRoom.addCollaborator({
			socketId: socket.id,
			userInfo: socket.data,
		});

		this.emitUsersInRoomChange(payload.roomId, {
			collabRoom,
		});
	}

	private handleVolatileBroadcast(
		socket: Socket,
		payload: {
			roomId: string;
			currentTab: string;
			mousePosition?: { relativeX: number; relativeY: number };
		}
	) {
		socket.to(payload.roomId).emit("server-volatile-broadcast", {
			socketId: socket.id,
			userId: socket.data.userId,
			currentTab: payload.currentTab,
			mousePosition: payload.mousePosition,
		});
	}

	// TODO agregar un handler pare el text field de plantext change.

	/*
	cuando el plantext code cambia el servidor es el encargado de generar la URL de la imagen plant text y enviarsela a todos los clientes para quee la actualice en el front. 
	Ahora se esta generando en el front directamente. 



	ahora todos reciben el texto -- generan el token, llaman al encoder y muestran la imagen 

	desintalar el encoder del front 
	instalarlo en el back
	escuchar por el evento del field de plant text 
	generar el token
	guardar el cambio que hubo en el plant text field y guardar el token para no vovler a generarlo.-- diagramSchema

	generar el link 

	*/

	private async handleFieldUpdate(
		//funciona para todos los text fields
		socket: Socket,
		payload: {
			propertyPath: string;
			value: any;
			roomId: string;
		}
	) {
		console.log("----------handleFieldUpdate");
		const { version } = await this.versionService.getVersionById(
			payload.roomId
		);

		// Check if this is a plantTextCode field update
		const isPlantTextCodeUpdate =
			payload.propertyPath.endsWith(".plantTextCode");

		if (isPlantTextCodeUpdate) {
			// Get the diagram object from the property path (remove .plantTextCode to get diagram path)
			const diagramPath = payload.propertyPath.replace(/\.plantTextCode$/, "");
			const plantTextTokenPath = diagramPath + ".plantTextToken";
			const diagram = getProperty(version.conceptualModel, diagramPath);

			if (!diagram) {
				console.error(`Diagram not found at property path: ${diagramPath}`);
				return;
			}

			// Normalize strings for comparison (normalize line endings and remove trailing newlines)
			const normalizeString = (str: string | undefined): string => {
				if (!str) return "";
				// Normalize line endings to LF
				let normalized = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
				// Remove trailing newlines only (preserve leading/trailing spaces on lines)
				normalized = normalized.replace(/\n+$/, "");
				return normalized;
			};

			const currentPlantTextCode = normalizeString(diagram.plantTextCode);
			const newPlantTextCode = normalizeString(payload.value);

			// Check if the plantTextCode has actually changed
			if (currentPlantTextCode === newPlantTextCode) {
				console.log("PlantTextCode unchanged, skipping update");
				return; // No change, skip update
			}

			// Generate token for the plantTextCode
			const plantTextToken = plantumlEncoder.encode(payload.value);
			console.log("plantTextToken", plantTextToken);

			// Update the diagram with new plantTextCode and token
			diagram.plantTextCode = payload.value;
			diagram.plantTextToken = plantTextToken;

			/* // Update the field value in the conceptual model (setValue updates the nested path)
			setValue(version.conceptualModel, payload.propertyPath, payload.value); */

			// Save the version
			await version.save();

			// Generate the image URL
			// const imageUrl = `http://www.plantuml.com/plantuml/img/${plantTextToken}`;

			// console.log("imageUrl", imageUrl);
			// Emit the plantText image update to all clients in the room
			/* this.emitPlantTextImageUpdate(payload.roomId, {
				propertyPath: diagramPath,
				imageUrl,
				plantTextToken,
			}); */
			this.emitFieldUpdate(payload.roomId, {
				propertyPath: plantTextTokenPath,
				value: plantTextToken,
			});

			// Also emit the field update for other clients
			this.emitFieldUpdate(payload.roomId, {
				propertyPath: payload.propertyPath,
				value: payload.value,
			});

			console.log(`PlantText image updated for property: ${diagramPath}`);
		} else {
			// Regular field update (non-plantTextCode)
			setValue(version.conceptualModel, payload.propertyPath, payload.value);
			// console.log("Version Conceptual Model: ", version.conceptualModel);
			version.save();
			//agregar try catch para manejar errores
			console.log(
				"handleFieldUpdate payload",
				payload.propertyPath,
				payload.value
			);
			this.emitFieldUpdate(payload.roomId, {
				propertyPath: payload.propertyPath,
				value: payload.value,
			});
		}
	}

	private handleRequestEditingPrivilege(
		socket: Socket,
		payload: { roomId: string }
	) {
		const collabRoom = this.activeCollaborationRooms.get(payload.roomId);

		if (!collabRoom) {
			console.info(
				`An Editing Request was ignored for Room: ${payload.roomId} - Requester UserId: ${socket.data.userId}`
			);
			return;
		}

		const callbackFunction = ({ requestId }: { requestId: string }) => {
			this.emitEditingRequestApproved(payload.roomId, { requestId });
			this.emitUsersInRoomChange(payload.roomId, { collabRoom });
		};

		try {
			const { requestId, editorUserId, timeoutStartTimestamp } =
				collabRoom.addEditingRequest({
					requesterUserId: socket.data.userId,
					callbackFunction,
				});

			this.emitEditingRequestStarted(payload.roomId, {
				requestId,
				editorUserId,
				timeoutStartTimestamp,
				requesterUserId: socket.data.userId,
			});
		} catch (error) {
			if (
				error instanceof PendingRequestConflictError ||
				error instanceof EditingPrivilegesAlreadyGrantedError
			) {
				console.error(error.message);
				this.emitEditingRequestCreationRefused(socket);
			} else {
				console.error(
					`Unexpected error during Editing Request Creation: ${error}`
				);
				throw error;
			}
		}
	}

	private handleAcceptEditingRequest(
		socket: Socket,
		payload: {
			roomId: string;
			requestId: string;
		}
	) {
		const collabRoom = this.activeCollaborationRooms.get(payload.roomId);

		if (!collabRoom) {
			console.debug(
				`The approval of an editing request was skipped because the specified room ${payload.roomId} didn't exist.`
			);
			return;
		}

		try {
			collabRoom.approveEditingRequest({
				requestId: payload.requestId,
				evaluatorUserId: socket.data.userId,
			});

			console.debug(
				`The approval of the editing request: ${payload.requestId} in the room: ${payload.roomId} was successful.`
			);

			this.emitEditingRequestApproved(payload.roomId, {
				requestId: payload.requestId,
			});

			this.emitUsersInRoomChange(payload.roomId, { collabRoom });
		} catch (error) {
			if (
				error instanceof EditingRequestNotFoundError ||
				error instanceof InvalidApprovalAuthorityException ||
				error instanceof EditingPrivilegesRequiredException
			) {
				console.error(error.message);
				this.emitEditingRequestApprovalFailed(socket, {
					requestId: payload.requestId,
				});
			} else {
				console.error(
					`Unexpected error during Editing Request Approval: ${error}`
				);
				throw error;
			}
		}
	}

	private handleDeclineEditingRequest(
		socket: Socket,
		payload: {
			roomId: string;
			requestId: string;
		}
	) {
		const collabRoom = this.activeCollaborationRooms.get(payload.roomId);

		if (!collabRoom) {
			console.info(
				`The refusal of an editing request was skipped because the specified room ${payload.roomId} didn't exist.`
			);
			return;
		}

		try {
			collabRoom.declineEditingRequest({
				requestId: payload.requestId,
				evaluatorUserId: socket.data.userId,
			});

			console.debug(
				`The refusal of the editing request: ${payload.requestId} in the room: ${payload.roomId} was successful.`
			);

			this.emitEditingRequestDeclined(payload.roomId, {
				requestId: payload.requestId,
			});
		} catch (error) {
			if (
				error instanceof EditingRequestNotFoundError ||
				error instanceof InvalidApprovalAuthorityException ||
				error instanceof EditingPrivilegesRequiredException
			) {
				console.error(error.message);
				this.emitEditingRequestRefusalFailed(socket, {
					requestId: payload.requestId,
				});
			} else {
				console.error(
					`Unexpected error during Editing Request Refusal: ${error}`
				);
				throw error;
			}
		}
	}

	private async handleAddItemToList(
		socket: Socket,
		payload: {
			roomId: string;
			listPropertyPath: string;
			itemType:
				| "assumption"
				| "simplification"
				| "entity"
				| "input"
				| "output"
				| "property";
		}
	) {
		//add try catch
		//agregar que tipo de entidad agrego.

		//va a tener problema cuando quiera agregar una propiedad dentro de una entidad
		// -- entidad1 y quiero agregar una entrada o una salida, para poder agregar esa entrada o salida voy a necesitar el id de la entidad sobre la que estoy aplicando y el tipo de dato que vas a agregar a esa lista, si es una entrada tiene otros atributos distintos a lo de la salida, depende de que quiero agregar

		const { version } = await this.versionService.getVersionById(
			payload.roomId
		);

		let listField = getProperty(
			version.conceptualModel,
			payload.listPropertyPath
		);

		switch (payload.itemType) {
			case "assumption":
				listField.push({ description: "" });
				break;
			case "entity":
				listField.push({
					name: "",
					scopeDecision: {
						include: true,
						justification: "",
						argumentType: "SALIDA",
					},
					dynamicDiagram: {},
					properties: [],
				});
				break;
			case "input":
				listField.push({ description: "", type: "PARAMETRO" });
				break;
			case "output":
				listField.push({ description: "", entity: null });
				break;
			case "simplification":
				listField.push({ description: "" });
				break;
			case "property":
				listField.push({
					name: "",
					detailLevelDecision: {
						include: true,
						justification: "",
						argumentType: "CALCULO SALIDA",
					},
				});
				break;
		}

		version.save();

		listField = getProperty(version.conceptualModel, payload.listPropertyPath);
		let newItem = listField.at(listField.length - 1);
		newItem = newItem.toObject();

		this.emitItemAddedToList(payload.roomId, {
			listPropertyPath: payload.listPropertyPath,
			newItem,
		});
	}

	private async handleRemoveItemFromList(
		socket: Socket,
		payload: {
			roomId: string;
			listPropertyPath: string;
			itemId: string;
		}
	) {
		const { version } = await this.versionService.getVersionById(
			payload.roomId
		);

		const listField = getProperty(
			version.conceptualModel,
			payload.listPropertyPath
		);
		console.log("List Field: ", listField);
		const itemToDelete = listField.find((s: any) =>
			s._id.equals(payload.itemId)
		);
		listField.remove(itemToDelete);

		version.save();

		this.emitItemRemovedFromList(payload.roomId, {
			listPropertyPath: payload.listPropertyPath,
			itemId: payload.itemId,
		});
	}

/* 	private async handlePlantTextGetImage(
		socket: Socket,
		payload: PlantTextGetImagePayload
	) {
		try {
			const { version } = await this.versionService.getVersionById(
				payload.versionId
			);

			// Get the diagram object from the property path
			const diagram = getProperty(
				version.conceptualModel,
				payload.propertyPath
			);

			if (!diagram) {
				console.error(
					`Diagram not found at property path: ${payload.propertyPath}`
				);
				return;
			}

			// Check if we have existing plantTextCode and token
			if (!diagram.plantTextCode || !diagram.plantTextToken) {
				console.log("No existing plantTextCode or token found");
				return;
			}

			// Generate the image URL from existing token
			const imageUrl = `http://www.plantuml.com/plantuml/img/${diagram.plantTextToken}`;

			console.log("Sending existing imageUrl", imageUrl);
			// Emit the plantText image update to the requesting client only
			socket.emit(SERVER_WS_EVENT_TYPES.PLANT_TEXT_IMAGE_UPDATE, {
				type: SERVER_WS_EVENT_TYPES.PLANT_TEXT_IMAGE_UPDATE,
				propertyPath: payload.propertyPath,
				imageUrl,
				plantTextToken: diagram.plantTextToken,
				timestamp: new Date(),
			});

			console.log(
				`PlantText existing image sent for property: ${payload.propertyPath}`
			);
		} catch (error) {
			console.error("Error handling plantText get image:", error);
		}
	} */

	private handleFinalizeVersion(socket: Socket, payload: { roomId: string }) {
		const collabRoom = this.activeCollaborationRooms.get(payload.roomId);

		if (!collabRoom) {
			console.info(
				`Finalize version request was ignored for Room: ${payload.roomId} - UserId: ${socket.data.userId}`
			);
			return;
		}

		// Check if user has editing rights
		if (collabRoom.getCurrentEditingUser() !== socket.data.userId) {
			console.info(
				`Finalize version request was refused - User ${socket.data.userId} does not have editing rights`
			);
			return;
		}

		// Broadcast the finalize modal to all users in the room
		this.emitFinalizeVersionModal(payload.roomId, {
			initiatedBy: socket.data.userId,
		});
	}

	private async handleFinalizeVersionConfirm(
		socket: Socket,
		payload: { roomId: string }
	) {
		const collabRoom = this.activeCollaborationRooms.get(payload.roomId);

		if (!collabRoom) {
			console.info(
				`Finalize version confirm was ignored for Room: ${payload.roomId} - UserId: ${socket.data.userId}`
			);
			return;
		}

		// Check if user has editing rights
		if (collabRoom.getCurrentEditingUser() !== socket.data.userId) {
			console.info(
				`Finalize version confirm was refused - User ${socket.data.userId} does not have editing rights`
			);
			return;
		}
		console.log("Finalizing version for room: ", payload.roomId);
		try {
			// Validate and finalize the version
			const validationResult =
				await this.versionService.validateAndFinalizeVersion(payload.roomId);
			console.log("Validation result: ", validationResult);
			// Emit the validation results to all users in the room
			this.emitFinalizeVersionResult(payload.roomId, {
				isValid: validationResult.isValid,
				errors: validationResult.errors,
				warnings: validationResult.warnings,
			});
		} catch (error) {
			console.error("Error finalizing version:", error);
			// Emit error to the user who initiated
			socket.emit("finalize-version-error", {
				type: "finalize-version-error",
				message: "Ocurrió un error al finalizar la versión.",
				timestamp: new Date(),
			});
		}
	}

	private async handleDisconnecting(socket: Socket) {
		console.info("Socket Disconnected ", socket.id);
		for (const roomId of Array.from(socket.rooms)) {
			const collabRoom = this.activeCollaborationRooms.get(roomId);

			if (!collabRoom) continue;

			console.info(
				`Collaborator Removed: ${socket.id} - ${socket.data.userId}`
			);
			collabRoom.removeCollaborator({
				socketId: socket.id,
				userId: socket.data.userId,
			});
			if (!collabRoom.isEmpty()) {
				this.emitUsersInRoomChange(roomId, { collabRoom });
			} else {
				console.info("Collaboration room deleted:", roomId);
				this.activeCollaborationRooms.delete(roomId);
			}
		}
	}

	// Emit Event Methods
	public emitUsersInRoomChange(
		roomId: string,
		{
			collabRoom,
		}: {
			collabRoom: CollaborationRoom;
		}
	) {
		this.socketServer
			.to(roomId) //sends to all sockets inside the room - includingm me
			.emit(SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE, {
				type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
				roomState: collabRoom.getRoomState(),
				timestamp: new Date(),
			} satisfies UsersInRoomChangePayload);
	}

	public emitInitializeConceptualModel(
		socket: Socket,
		{
			version,
			imageInfos,
		}: {
			version: Version;
			imageInfos: (Pick<
				VersionImage,
				"originalFilename" | "url" | "createdAt" | "sizeInBytes"
			> & {
				id: string;
			})[];
		}
	) {
		//socket.to(roomId) mandaria a todos en la room menos a mi
		socket.emit(SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL, {
			type: SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL,
			timestamp: new Date(),
			version,
			imageInfos,
		} satisfies InitializeConceptualModelPayload);
	}

	public emitImageFileAdded(
		roomId: string,
		imageInfo: Pick<VersionImage, "originalFilename" | "url"> & {
			id: string;
		}
	) {
		this.socketServer.to(roomId).emit("image-added", {
			type: "image-added",
			timestamp: new Date(),
			imageInfo,
		});
	}

	public emitImageFileRemoved(
		roomId: string,
		{ imageId }: { imageId: string }
	) {
		this.socketServer.to(roomId).emit("image-removed", {
			type: "image-removed",
			timestamp: new Date(),
			imageId,
		});
	}

	public emitFieldUpdate(
		roomId: string,
		payload: { propertyPath: string; value: any }
	) {
		this.socketServer.to(roomId).emit("field-update", {
			propertyPath: payload.propertyPath,
			value: payload.value,
		});
	}

	public emitEditingRequestStarted(
		roomId: string,
		payload: {
			requestId: string;
			editorUserId: string;
			timeoutStartTimestamp: any;
			requesterUserId: string;
		}
	) {
		this.socketServer.to(roomId).emit("editing-request-started", {
			type: "editing-request-started",
			requestId: payload.requestId,
			editorUserId: payload.editorUserId,
			timeoutStartTimestamp: payload.timeoutStartTimestamp,
			requesterUserId: payload.requesterUserId,
			timestamp: new Date(),
		});
	}

	public emitEditingRequestApproved(
		roomId: string,
		payload: { requestId: string }
	) {
		this.socketServer.to(roomId).emit("editing-request-approved", {
			type: "editing-request-approved",
			requestId: payload.requestId,
			timeStamp: new Date(),
		});
	}

	public emitEditingRequestDeclined(
		roomId: string,
		payload: { requestId: string }
	) {
		this.socketServer.to(roomId).emit("editing-request-declined", {
			type: "editing-request-declined",
			requestId: payload.requestId,
			timestamp: new Date(),
		});
	}

	public emitEditingRequestCreationRefused(socket: Socket) {
		socket.emit("editing-request-creation-refused", {
			type: "editing-request-creation-refused",
			timestamp: new Date(),
		});
	}

	public emitEditingRequestApprovalFailed(
		socket: Socket,
		payload: { requestId: string }
	) {
		socket.emit("editing-request-approval-failed", {
			requestId: payload.requestId,
			type: "editing-request-approval-failed",
			timestamp: new Date(),
		});
	}

	public emitEditingRequestRefusalFailed(
		socket: Socket,
		payload: { requestId: string }
	) {
		socket.emit("editing-request-refusal-failed", {
			requestId: payload.requestId,
			type: "editing-request-refusal-failed",
			timestamp: new Date(),
		});
	}

	public emitItemAddedToList(
		roomId: string,
		payload: { listPropertyPath: string; newItem: any }
	) {
		this.socketServer.to(roomId).emit("item-added-to-list", {
			listPropertyPath: payload.listPropertyPath,
			newItem: payload.newItem,
		});
	}

	public emitItemRemovedFromList(
		roomId: string,
		payload: { listPropertyPath: string; itemId: string }
	) {
		this.socketServer.to(roomId).emit("item-removed-from-list", {
			listPropertyPath: payload.listPropertyPath,
			itemId: payload.itemId,
		});
	}

/* 	public emitPlantTextImageUpdate(
		roomId: string,
		payload: { propertyPath: string; imageUrl: string; plantTextToken: string }
	) {
		this.socketServer
			.to(roomId)
			.emit(SERVER_WS_EVENT_TYPES.PLANT_TEXT_IMAGE_UPDATE, {
				type: SERVER_WS_EVENT_TYPES.PLANT_TEXT_IMAGE_UPDATE,
				propertyPath: payload.propertyPath,
				imageUrl: payload.imageUrl,
				plantTextToken: payload.plantTextToken,
				timestamp: new Date(),
			} satisfies PlantTextImageUpdatePayload);
	} */

	public emitFinalizeVersionModal(
		roomId: string,
		payload: { initiatedBy: string }
	) {
		this.socketServer.to(roomId).emit("finalize-version-modal", {
			type: "finalize-version-modal",
			initiatedBy: payload.initiatedBy,
			timestamp: new Date(),
		});
	}

	public emitFinalizeVersionModalClose(roomId: string) {
		this.socketServer.to(roomId).emit("finalize-version-modal-close", {
			type: "finalize-version-modal-close",
			timestamp: new Date(),
		});
	}

	public emitFinalizeVersionResult(
		roomId: string,
		payload: {
			isValid: boolean;
			errors: string[];
			warnings: string[];
		}
	) {
		this.socketServer.to(roomId).emit("finalize-version-result", {
			type: "finalize-version-result",
			isValid: payload.isValid,
			errors: payload.errors,
			warnings: payload.warnings,
			timestamp: new Date(),
		});
	}

	private handleFinalizeVersionModalClose(
		socket: Socket,
		payload: { roomId: string }
	) {
		// Broadcast the close event to all users in the room
		this.emitFinalizeVersionModalClose(payload.roomId);
	}

	public getCollaborationRoomState({ roomId }: { roomId: string }) {
		const collabRoom = this.activeCollaborationRooms.get(roomId);
		return collabRoom?.getRoomState();
	}
}
