export class CollaborationRoom {
	private roomId: string;
	private userIdToUserInfoMap: Map<
		string,
		{
			userId: string;
			name: string;
			lastName: string;
			email: string;
			socketIds: string[];
		}
	>;
	private pendingEditingRequests: Map<
		string,
		{ requesterUserId: string; editorUserId: String; timeoutId: number }
	>;
	private currentEditingUser: string | null;

	constructor(roomId: string) {
		this.roomId = roomId;
		this.userIdToUserInfoMap = new Map();
		this.pendingEditingRequests = new Map();
		this.currentEditingUser = null;
	}

	getRoomState() {
		return {
			roomId: this.roomId,
			currentEditingUser: this.currentEditingUser,
			collaborators: Array.from(this.userIdToUserInfoMap.values()),
		};
	}

	assignEditingRightsTo(userId: string) {
		if (userId === this.currentEditingUser) {
			return;
		}
		if (!this.userIdToUserInfoMap.has(userId)) {
			return;
		}
		this.currentEditingUser = userId;
		//If the user with editing right changed, then invalidate all editing rights requests
		this.cancelAllPendingRequest();
	}

	private cancelAllPendingRequest() {
		const pendingRequests = Array.from(this.pendingEditingRequests.values());
		for (const request of pendingRequests) {
			clearTimeout(request.timeoutId);
		}
		this.pendingEditingRequests.clear();
	}

	addCollaborator(
		socketId: string,
		userInfo: { userId: string; name: string; lastName: string; email: string }
	) {
		const wasEmpty = this.isEmpty();
		if (!this.userIdToUserInfoMap.has(userInfo.userId)) {
			this.userIdToUserInfoMap.set(userInfo.userId, {
				...userInfo,
				socketIds: [],
			});
		}
		this.userIdToUserInfoMap.get(userInfo.userId)!.socketIds.push(socketId);
		if (wasEmpty) {
			this.assignEditingRightsTo(userInfo.userId);
		}
	}

	removeCollaborator(socketId: string, userId: string) {
		if (!this.userIdToUserInfoMap.has(userId)) return;

		const remainingSocketIds = this.userIdToUserInfoMap
			.get(userId)!
			.socketIds.filter((s) => s !== socketId);

		if (remainingSocketIds.length !== 0) {
			this.userIdToUserInfoMap.set(userId, {
				...this.userIdToUserInfoMap.get(userId)!,
				socketIds: remainingSocketIds,
			});
			return;
		}

		this.userIdToUserInfoMap.delete(userId);
		const remainingUsers = Array.from(this.userIdToUserInfoMap.keys());
		if (this.currentEditingUser === userId) {
			if (this.isEmpty()) {
				this.currentEditingUser = null;
				this.cancelAllPendingRequest();
			} else {
				const randomUser =
					remainingUsers[Math.floor(Math.random() * remainingUsers.length)];
				this.assignEditingRightsTo(randomUser);
			}
		}
	}

	isEmpty() {
		return this.userIdToUserInfoMap.size === 0;
	}
}
