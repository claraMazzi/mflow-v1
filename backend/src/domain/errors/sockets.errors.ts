

export class EditingPrivilegesAlreadyGrantedError extends Error {

    constructor(
      public readonly roomId: string,
      public readonly userId: string,
    ){
      super(`The user: ${userId} already has editing privileges for the collaboration room: ${roomId}.`);
    }
  
  }

export class PendingRequestConflictError extends Error {

    constructor(
      public readonly roomId: string,
      public readonly userId: string,
    ){
      super(`The user: ${userId} already has a pending request in the collaboration room: ${roomId}.`);
    }
  
  }