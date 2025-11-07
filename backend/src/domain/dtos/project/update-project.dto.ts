
//pongo los campos que necesito pasar por la request no mas
export class UpdateProjectDto {
  constructor(
    public readonly id: string,
    public readonly requestingUserId: string,
    public readonly title?: string,
    public readonly description?: string,
  ) {}

  static create(object: { [key: string]: any }): [string?, UpdateProjectDto?] {
    const { title, description, id, requestingUserId } = object;
    if (!id) return ["El identificador del proyecto es obligatorio."];
    if (!requestingUserId) return ["Debe haber iniciado sesión para poder modificar un proyecto."];
    if (!title) return ['El título del proyecto es obligatorio.'];
  
    return [
      undefined,
      new UpdateProjectDto(id, requestingUserId, title, description),
    ];
  }
}
