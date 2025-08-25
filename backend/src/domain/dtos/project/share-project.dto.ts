export class ShareProjectDto {
  constructor(
    public readonly projectId: string,
    public readonly senderId: string,
    public readonly collaborators: string[],
    
  ) {}

  static create(object: { [key: string]: any }): [string?, ShareProjectDto?] {
    const { projectId, senderId, collaborators } = object;
  

    if (!projectId) return ['Project id is requeried'];
    if (!senderId) return ['Sender Id is requeried'];
    if (!collaborators || !Array.isArray(collaborators) || collaborators.length === 0) return ['At least one collaborator is required'];
    if (collaborators.includes(senderId)) return ['Sender Id cannot be a collaborator'];

  
    return [
      undefined,
      new ShareProjectDto(projectId, senderId, collaborators),
    ];
  }
}
