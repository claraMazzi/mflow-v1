export class EditingPrivilegesAlreadyGrantedError extends Error {
	constructor(public readonly roomId: string, public readonly userId: string) {
		super(
			`The user: ${userId} already has editing privileges for the collaboration room: ${roomId}.`
		);
	}
}

export class PendingRequestConflictError extends Error {
	constructor(public readonly roomId: string, public readonly userId: string) {
		super(
			`The user: ${userId} already has a pending request in the collaboration room: ${roomId}.`
		);
	}
}

export class EditingRequestNotFoundError extends Error {
	constructor(
		public readonly roomId: string,
		public readonly requestId: string
	) {
		super(
			`The specified editing request: ${requestId} was not found in the collaboration room: ${roomId}.`
		);
	}
}

export class EditingPrivilegesRequiredException extends Error {
	constructor(public readonly roomId: string, public readonly userId: string) {
		super(
			`The user: ${userId} doesnt't have the editing rights required for the operation in the room: ${roomId}.`
		);
	}
}

export class InvalidApprovalAuthorityException extends Error {
	constructor(
		public readonly roomId: string,
		public readonly requestId: string,
		public readonly userId: string
	) {
		super(
			`The user: ${userId} can't evaluate the request: ${requestId} in the room: ${roomId}.`
		);
	}
}
