export class CreateDeletionRequestDto {
    constructor(
      public readonly project: string,
      public readonly motive: string,
      public readonly requestingUser: string,
      public readonly state: string,
      public readonly reviewedAt: Date,
      public readonly reviewer: string | null,
     
     
    ) {}
  
    static create(object: { [key: string]: any }): [string?, CreateDeletionRequestDto?] {
      const { motive, requestingUser, project } = object;
      const state = 'PENDIENTE'
      const reviewedAt = new Date
      const reviewer = null
  
      if (!motive) return ['Motive is requeried'];
      if (!requestingUser) return ['Requesting User is requeried'];
    
      return [
        undefined,
        new CreateDeletionRequestDto(project, motive, requestingUser, state, reviewedAt, reviewer),
      ];
    }
  }
  