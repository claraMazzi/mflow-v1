
//pongo los campos que necesito pasar por la request no mas
export class UpdateProjectDto {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
  ) {}

  static create(object: { [key: string]: any }): [string?, UpdateProjectDto?] {
    const { name, description, id } = object;
    if (!id) return ["Missing id"];
  
    return [
      undefined,
      new UpdateProjectDto(id, name, description),
    ];
  }
}
