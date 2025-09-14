//pongo los campos que necesito pasar por la request no mas
export class UpdateUsersRolesDto {
  constructor(public readonly email: string, public readonly roles: string[]) {}

  static create(object: {
    [key: string]: any;
  }): [string?, UpdateUsersRolesDto[]?] {
    const { users } = object;

    if (!users || !Array.isArray(users) || !users.length) {
      return ["Users data should be a non-empty array"];
    }

    const usersDto: UpdateUsersRolesDto[] = [];

    for (const user of users) {
      const { roles, email} = user;

      if (!email) {
        return ["Missing email"];
      }
      if (!roles || !Array.isArray(roles)) {
        return ["Roles should be an array"];
      }
      if (roles && Array.isArray(roles) && !roles.length) {
        return ["Roles can't be empty"];
      }

      usersDto.push(new UpdateUsersRolesDto(email, roles));
    }

    if (!usersDto.length) {
      return ["No valid user data provided"];
    }

    return [undefined, usersDto];
  }
}
