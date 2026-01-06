export class ShareProjectLinkDto {
  constructor(
    public readonly projectId: string,
    public readonly requestingUser: string,
  ) {}

  static create(object: { [key: string]: any }): [string?, ShareProjectLinkDto?] {
    const { projectId, requestingUser } = object;

    if (!projectId) return ['El identificador del proyecto es requerido.'];
    if (!requestingUser) return ['Debe haber iniciado sesión para realizar esta acción.'];
 
    return [
      undefined,
      new ShareProjectLinkDto(projectId, requestingUser),
    ];
  }
}
