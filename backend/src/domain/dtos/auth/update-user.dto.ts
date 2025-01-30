import { emailRegex, passwordRegex } from "../../../config";

//pongo los campos que necesito pasar por la request no mas
export class UpdateUserDto {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly lastName?: string,
  ) {}

  static create(object: { [key: string]: any }): [string?, UpdateUserDto?] {
    const { name, lastName, ßid } = object;
    if (!id) return ["Missing id"];
  
    return [
      undefined,
      new UpdateUserDto(id, name, lastName),
    ];
  }
}
