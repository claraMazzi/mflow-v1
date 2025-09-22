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
import { VersionImage } from "../data/mongo/models/version-image.model";

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
	conceptualModel: ConceptualModel;
	imageInfos: (Pick<VersionImage, "originalFilename" | "url"> & {
		id: string;
	})[];
};

enum SERVER_WS_EVENT_TYPES {
	USERS_IN_ROOM_CHANGE = "users-in-room-change",
	INITIALIZE_CONCEPTUAL_MODEL = "initialize-conceptual-model",
}

export class SocketServer {
	private socketServer: SocketIO;
	private activeCollaborationRooms: Map<string, CollaborationRoom>;
	private versionService: VersionService;

	constructor({ serverListener }: { serverListener: Server }) {
		this.socketServer = new SocketIO(serverListener, {
			cors: {
				origin: "http://localhost:3000",
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
				itemType: "assumption" | "simplification" | "entity";
			}) => this.handleAddItemToList(socket, payload)
		);

		socket.on(
			"remove-item-from-list",
			(payload: { roomId: string; listPropertyPath: string; itemId: string }) =>
				this.handleRemoveItemFromList(socket, payload)
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
						this.emitUsersInRoomChange({ roomId, collabRoom: room });
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
		//TODO: ADD CHECK OF VALIDITY BEFORE ADDING THE SOCKET TO THE ROOM
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
			conceptualModel: version.conceptualModel,
			imageInfos: version.imageInfos,
		});

		await socket.join(payload.roomId);

		console.info(`Collaborator Added: ${socket.id} - ${socket.data.userId}`);
		collabRoom.addCollaborator({
			socketId: socket.id,
			userInfo: socket.data,
		});

		this.emitUsersInRoomChange({
			roomId: payload.roomId,
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

	private async handleFieldUpdate(
		socket: Socket,
		payload: {
			propertyPath: string;
			value: any;
			roomId: string;
		}
	) {
		const { version } = await this.versionService.getVersionById(
			payload.roomId
		);

		setValue(version.conceptualModel, payload.propertyPath, payload.value);
		version.save();

		this.emitFieldUpdate(payload.roomId, {
			propertyPath: payload.propertyPath,
			value: payload.value,
		});
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
			this.emitUsersInRoomChange({ roomId: payload.roomId, collabRoom });
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

			this.emitUsersInRoomChange({ roomId: payload.roomId, collabRoom });
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
			const requesterUserId = collabRoom.declineEditingRequest({
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
			itemType: "assumption" | "simplification" | "entity";
		}
	) {
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
				this.emitUsersInRoomChange({ roomId, collabRoom });
			} else {
				console.info("Collaboration room deleted:", roomId);
				this.activeCollaborationRooms.delete(roomId);
			}
		}
	}

	// Emit Event Methods
	public emitUsersInRoomChange({
		roomId,
		collabRoom,
	}: {
		roomId: string;
		collabRoom: CollaborationRoom;
	}) {
		this.socketServer
			.to(roomId)
			.emit(SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE, {
				type: SERVER_WS_EVENT_TYPES.USERS_IN_ROOM_CHANGE,
				roomState: collabRoom.getRoomState(),
				timestamp: new Date(),
			} satisfies UsersInRoomChangePayload);
	}

	public emitInitializeConceptualModel(
		socket: Socket,
		{
			conceptualModel,
			imageInfos,
		}: {
			conceptualModel: ConceptualModel;
			imageInfos: (Pick<VersionImage, "originalFilename" | "url"> & {
				id: string;
			})[];
		}
	) {
		socket.emit(SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL, {
			type: SERVER_WS_EVENT_TYPES.INITIALIZE_CONCEPTUAL_MODEL,
			timestamp: new Date(),
			conceptualModel,
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

	public getCollaborationRoomState({ roomId }: { roomId: string }) {
		const collabRoom = this.activeCollaborationRooms.get(roomId);
		return collabRoom?.getRoomState();
	}
}
