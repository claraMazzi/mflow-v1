export class ShareProjectLinkDto {
  constructor(
    public readonly projectId: string,
    public readonly senderId: string,
    
  ) {}

  static create(object: { [key: string]: any }): [string?, ShareProjectLinkDto?] {
    const { projectId, senderId } = object;
  

    if (!projectId) return ['Project id is requeried'];
    if (!senderId) return ['Sender Id is requeried'];
 
    return [
      undefined,
      new ShareProjectLinkDto(projectId, senderId),
    ];
  }
}
