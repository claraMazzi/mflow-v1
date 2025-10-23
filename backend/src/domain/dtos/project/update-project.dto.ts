
//pongo los campos que necesito pasar por la request no mas
export class UpdateProjectDto {
  constructor(
    public readonly id: string,
    public readonly owner: string,
    public readonly title?: string,
    public readonly description?: string,
  ) {}

  static create(object: { [key: string]: any }): [string?, UpdateProjectDto?] {
    const { title, description, id, owner } = object;
    if (!id) return ["Missing id"];
    if (!owner) return ["Missing owner"];
  
    return [
      undefined,
      new UpdateProjectDto(id, owner, title, description),
    ];
  }
}
