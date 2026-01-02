export class ShareProjectLinkDto {
  constructor(
    public readonly projectId: string,
    public readonly senderId: string,
    
  ) {}

  static create(object: { [key: string]: any }): [string?, ShareProjectLinkDto?] {
    const { projectId, senderId } = object;

    if (!projectId) return ['El identificador del proyecto es requerido.'];
    if (!senderId) return ['Debe haber iniciado sesión para realizar esta acción.'];
 
    return [
      undefined,
      new ShareProjectLinkDto(projectId, senderId),
    ];
  }
}
