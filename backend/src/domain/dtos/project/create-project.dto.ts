export class CreateProjectDto {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly owner: string,
    public readonly collaborators: string[],
    public readonly state: string,
    public readonly versions: string[]
    
  ) {}

  static create(object: { [key: string]: any }): [string?, CreateProjectDto?] {
    const { name, description:reqDes, owner } = object;
    const state = 'CREADO'
    const collaborators = [] as string[]
    const versions = [] as string[]
    const description = reqDes ? reqDes : ''

    if (!name) return ['Name is requeried'];
    if (!owner) return ['Owner is requeried'];

  
    return [
      undefined,
      new CreateProjectDto(name, description, owner, collaborators, state, versions),
    ];
  }
}
