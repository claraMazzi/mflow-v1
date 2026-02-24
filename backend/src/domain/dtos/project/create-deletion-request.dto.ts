export class CreateDeletionRequestDto {
    constructor(
      public readonly project: string,
      public readonly motive: string,
      public readonly requestingUser: string,
    ) {}
  
    static create(object: { [key: string]: any }): [string?, CreateDeletionRequestDto?] {
      const { motive, requestingUser, project } = object;
  
      if (!motive) return ['El motivo es obligatorio.'];
      if (!requestingUser) return ['Se debe especificar el usuario que solcitó la eliminación.'];
      if (!project) return ["El identificador del proyecto es obligatorio."]
    
      return [
        undefined,
        new CreateDeletionRequestDto(project, motive, requestingUser),
      ];
    }
  }
  