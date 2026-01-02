export class ShareProjectDto {
  constructor(
    public readonly projectId: string,
    public readonly senderId: string,
    public readonly emails: string[],
  ) {}

  static create(object: { [key: string]: any }): [string?, ShareProjectDto?] {
    const { projectId, senderId, collaborators: emails } = object;

    if (!projectId) return ['El identificador del proyecto es requerido.'];
    if (!senderId) return ['Debe haber iniciado sesión para realizar esta acción.'];
    if (!emails || !Array.isArray(emails) || emails.length === 0) return ['Se requiere de al menos un email para enviar las invitaciones.'];
  
    return [
      undefined,
      new ShareProjectDto(projectId, senderId, emails),
    ];
  }
}
