
//pongo los campos que necesito pasar por la request no mas
export class UpdateProjectDto {
  constructor(
    public readonly id: string,
    public readonly title?: string,
    public readonly description?: string,
  ) {}

  static create(object: { [key: string]: any }): [string?, UpdateProjectDto?] {
    const { title, description, id } = object;
    if (!id) return ["Missing id"];
  
    return [
      undefined,
      new UpdateProjectDto(id, title, description),
    ];
  }
}
