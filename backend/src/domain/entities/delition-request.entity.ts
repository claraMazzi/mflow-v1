import { CustomError } from "../errors/custom.error";

export class DelitionRequestEntity {
  constructor(
    public id: string,
    public project: string,
    public motive: string,
    public requestingUser: string,
    public reviewer: string,
    public state: string,
    public reviewedAt: Date
  ) {}

  static fromObject(object: { [key: string]: any }) {
    const {
      id,
      _id,
      project,
      motive,
      requestingUser,
      reviewer,
      state,
      reviewedAt,
    } = object;

    if (!_id && !id) throw CustomError.badRequest("Missing id");
    if (!project) throw CustomError.badRequest("Missing project");
    if (!motive) throw CustomError.badRequest("Missing motive");
    if (!requestingUser) throw CustomError.badRequest("Missing requestingUser");
    if (!state) throw CustomError.badRequest("Missing state");
    if (!reviewedAt) throw CustomError.badRequest("Missing reviewedAt");
    
    return new DelitionRequestEntity(
      _id || id,
      project,
      motive,
      requestingUser,
      reviewer,
      state,
      reviewedAt
    );
  }
}
