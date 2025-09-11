import { emailRegex, passwordRegex } from "../../../config";

//pongo los campos que necesito pasar por la request no mas
export class UpdateUserRolesrDto {
  constructor(
    public readonly id: string,
    public readonly roles: string[],
  ) {}

  static create(object: { [key: string]: any }): [string?, UpdateUserRolesrDto?] {
    const { roles, id } = object;
    if (!id) return ["Missing id"];
  
    return [
      undefined,
      new UpdateUserRolesrDto(id, roles),
    ];
  }
}
