import { emailRegex, passwordRegex } from "../../../config";

//pongo los campos que necesito pasar por la request no mas
export class UpdateUserRolesDto {
  constructor(
    public readonly id: string,
    public readonly roles: string[],
  ) {}

  static create(object: { [key: string]: any }): [string?, UpdateUserRolesDto?] {
    const { roles, id } = object;
    if (!id) return ["Missing id"];
  
    return [
      undefined,
      new UpdateUserRolesDto(id, roles),
    ];
  }
}
