import { CustomError } from "../errors/custom.error";
import { UserEntity } from "./user.entity";

interface ReducedUserEntity { 
  email: string,
  id: string
}

export class ProjectEntity {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public owner: string,
    public collaborators: ReducedUserEntity[],
    public state: string,
    public versions: string[]
  ) {}

  static fromObject(object: { [key: string]: any }) {
    const { id, _id, name, description, owner, collaborators, state, versions} = object;
    
    if (!_id && !id)throw CustomError.badRequest("Missing id");
    if (!name) throw CustomError.badRequest("Missing name");
    if (!owner) throw CustomError.badRequest("Missing owner");
    if (!collaborators) throw CustomError.badRequest("Missing collaborators");
    if (!versions) throw CustomError.badRequest("Missing versions");
  
    return new ProjectEntity(
      _id || id,
      name,
      description,
      owner,
      collaborators.map((item: UserEntity) =>({email: item.email, id: item.id})),
      state,
      versions
    );
  }
}
