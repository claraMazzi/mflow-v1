import {
	EditingPrivilegesAlreadyGrantedError,
	EditingRequestNotFoundError,
	EditingPrivilegesRequiredException,
	PendingRequestConflictError as PendingEditingRequestConflictError,
	InvalidApprovalAuthorityException,
} from "../../domain/errors/collaborationRoom.errors";

export class CollaborationRoom {
	private roomId: string;
	private userIdToUserInfoMap: Map<
		string,
		{
			userId: string;
			name: string;
			lastName: string;
			email: string;
			socketIds: Set<string>;
		}
	>;
	private pendingEditingRequests: Map<
		string,
		{
			requesterUserId: string;
			editorUserId: string;
			timeoutStartTimestamp: number;
			timeoutId: NodeJS.Timeout;
		}
	>;
	private currentEditingUser: string | null;

	constructor(roomId: string) {
		this.roomId = roomId;
		this.userIdToUserInfoMap = new Map();
		this.pendingEditingRequests = new Map();
		this.currentEditingUser = null;
	}

	getRoomState() {
		const collaboratorsArray = Array.from(
			this.userIdToUserInfoMap.values()
		).map((c) => ({ ...c, socketIds: Array.from(c.socketIds.values()) }));

		return {
			roomId: this.roomId,
			currentEditingUser: this.currentEditingUser,
			collaborators: collaboratorsArray,
		};
	}

	addEditingRequest({
		requesterUserId,
		callbackFunction,
	}: {
		requesterUserId: string;
		callbackFunction: ({ requestId }: { requestId: string }) => void;
	}) {
		const isEditingUser = this.currentEditingUser === requesterUserId;

		if (isEditingUser) {
			console.info(
				`An Editing Request was refused for Room: ${this.roomId} - Requester UserId: ${requesterUserId}`
			);
			throw new EditingPrivilegesAlreadyGrantedError(
				this.roomId,
				requesterUserId
			);
		}

		const hasAlreadyMadeARequest =
			Array.from(this.pendingEditingRequests.values()).filter(
				(v) => v.requesterUserId === requesterUserId
			).length !== 0;

		if (hasAlreadyMadeARequest) {
			console.info(
				`An Editing Request was refused for Room: ${this.roomId} - Requester UserId: ${requesterUserId}`
			);
			throw new PendingEditingRequestConflictError(
				this.roomId,
				requesterUserId
			);
		}

		const requestId = `${Date.now()}-${requesterUserId}`;
		const timeoutId = setTimeout(() => {
			console.debug(
				`Due to timeout, the editing request: ${requestId} in the room: ${this.roomId} was approved.`
			);
			this.removeEditingRequest({ requestId });
			this.assignEditingRightsTo({ userId: requesterUserId });
			callbackFunction({ requestId });
		}, 10 * 1000);
		this.pendingEditingRequests.set(requestId, {
			requesterUserId,
			timeoutStartTimestamp: Date.now(),
			editorUserId: this.currentEditingUser!,
			timeoutId,
		});

		return {
			requestId,
			timeoutStartTimestamp: Date.now(),
			editorUserId: this.currentEditingUser!,
		};
	}

	cleanUpStaleConnections(activeSocketIds: Set<string>): boolean {
		let hasRoomChanged = false;
		const usersToRemove: string[] = [];
		for (const [userId, userInfo] of this.userIdToUserInfoMap.entries()) {
			const staleSocketIds: string[] = [];

			for (const socketId of userInfo.socketIds) {
				if (!activeSocketIds.has(socketId)) {
					staleSocketIds.push(socketId);
				}
			}

			staleSocketIds.forEach((socketId) => {
				hasRoomChanged = true;
				userInfo.socketIds.delete(socketId);
				console.log(`Cleaned up stale socket ${socketId} for user ${userId}`);
			});

			if (userInfo.socketIds.size === 0) {
				usersToRemove.push(userId);
			}
		}

		usersToRemove.forEach((userId) => {
			this.userIdToUserInfoMap.delete(userId);
			console.log(`Removed user ${userId} due to no active connections`);

			if (this.currentEditingUser === userId) {
				const remainingUsers = Array.from(this.userIdToUserInfoMap.keys());
				if (this.isEmpty()) {
					this.currentEditingUser = null;
					this.cancelAllPendingEditingRequests();
				} else {
					this.removeAllPendingEditingRequestsFor({ userId });
					const randomUser =
						remainingUsers[Math.floor(Math.random() * remainingUsers.length)];
					this.assignEditingRightsTo({ userId: randomUser });
				}
			}
		});

		return hasRoomChanged;
	}

	private removeEditingRequest({ requestId }: { requestId: string }) {
		const pendingRequest = this.pendingEditingRequests.get(requestId);
		if (!pendingRequest) return;
		clearTimeout(pendingRequest.timeoutId);
		this.pendingEditingRequests.delete(requestId);
	}

	assignEditingRightsTo({ userId }: { userId: string }) {
		if (userId === this.currentEditingUser) {
			return;
		}
		if (!this.userIdToUserInfoMap.has(userId)) {
			return;
		}
		this.currentEditingUser = userId;
		//If the user with editing right changed, then invalidate all editing rights requests
		this.cancelAllPendingEditingRequests();
	}

	private cancelAllPendingEditingRequests() {
		const pendingRequests = Array.from(this.pendingEditingRequests.values());
		for (const request of pendingRequests) {
			clearTimeout(request.timeoutId);
		}
		this.pendingEditingRequests.clear();
	}

	approveEditingRequest({
		requestId,
		evaluatorUserId,
	}: {
		requestId: string;
		evaluatorUserId: string;
	}) {
		const request = this.pendingEditingRequests.get(requestId);

		if (!request) {
			throw new EditingRequestNotFoundError(this.roomId, requestId);
		}

		const hasEditorChanged = request.editorUserId !== evaluatorUserId;

		if (hasEditorChanged) {
			throw new InvalidApprovalAuthorityException(
				this.roomId,
				requestId,
				evaluatorUserId
			);
		}

		const evaluatorHasEditRights = this.currentEditingUser === evaluatorUserId;

		if (!evaluatorHasEditRights) {
			throw new EditingPrivilegesRequiredException(
				this.roomId,
				evaluatorUserId
			);
		}

		this.assignEditingRightsTo({ userId: request.requesterUserId });
	}

	declineEditingRequest({
		requestId,
		evaluatorUserId,
	}: {
		requestId: string;
		evaluatorUserId: string;
	}) {
		const request = this.pendingEditingRequests.get(requestId);

		if (!request) {
			throw new EditingRequestNotFoundError(this.roomId, requestId);
		}

		const hasEditorChanged = request.editorUserId !== evaluatorUserId;

		if (hasEditorChanged) {
			throw new InvalidApprovalAuthorityException(
				this.roomId,
				requestId,
				evaluatorUserId
			);
		}

		const evaluatorHasEditRights = this.currentEditingUser === evaluatorUserId;

		if (!evaluatorHasEditRights) {
			throw new EditingPrivilegesRequiredException(
				this.roomId,
				evaluatorUserId
			);
		}

		this.removeEditingRequest({ requestId });
	}

	addCollaborator({
		socketId,
		userInfo,
	}: {
		socketId: string;
		userInfo: { userId: string; name: string; lastName: string; email: string };
	}) {
		const wasEmpty = this.isEmpty();
		if (!this.userIdToUserInfoMap.has(userInfo.userId)) {
			this.userIdToUserInfoMap.set(userInfo.userId, {
				...userInfo,
				socketIds: new Set<string>(),
			});
		}
		this.userIdToUserInfoMap.get(userInfo.userId)!.socketIds.add(socketId);
		if (wasEmpty) {
			this.assignEditingRightsTo({ userId: userInfo.userId });
		}
	}

	private removeAllPendingEditingRequestsFor({ userId }: { userId: string }) {
		Array.from(this.pendingEditingRequests.entries())
			.filter(([k, v]) => v.requesterUserId === userId)
			.forEach(([k, v]) => {
				clearTimeout(v.timeoutId);
				this.pendingEditingRequests.delete(k);
			});
	}

	removeCollaborator({
		socketId,
		userId,
	}: {
		socketId: string;
		userId: string;
	}) {
		if (!this.userIdToUserInfoMap.has(userId)) return;

		const collaboratorSocketIds =
			this.userIdToUserInfoMap.get(userId)!.socketIds;

		collaboratorSocketIds.delete(socketId);

		if (collaboratorSocketIds.size !== 0) {
			return;
		}

		this.userIdToUserInfoMap.delete(userId);
		const remainingUsers = Array.from(this.userIdToUserInfoMap.keys());
		if (this.currentEditingUser === userId) {
			if (this.isEmpty()) {
				this.currentEditingUser = null;
				this.cancelAllPendingEditingRequests();
			} else {
				this.removeAllPendingEditingRequestsFor({ userId });
				const randomUser =
					remainingUsers[Math.floor(Math.random() * remainingUsers.length)];
				this.assignEditingRightsTo({ userId: randomUser });
			}
		}
	}

	isEmpty() {
		return this.userIdToUserInfoMap.size === 0;
	}

	getCurrentEditingUser() {
		return this.currentEditingUser;
	}
}
