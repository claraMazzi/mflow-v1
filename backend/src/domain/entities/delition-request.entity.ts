import { CustomError } from "../errors/custom.error";

export class DelitionRequestEntity {
  constructor(
    public id: string,
    public project: string,
    public motive: string,
    public requestingUser: string,
    public reviewer: string,
    public state: string,
    public reviewedAt: Date,
    public registeredAt: Date
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
      registeredAt,
    } = object;

    if (!_id && !id) throw CustomError.badRequest("El identificador de la solicitud es obligatorio.");
    if (!project) throw CustomError.badRequest("El identificador del proyecto es obligatorio.");
    if (!motive) throw CustomError.badRequest("El motivo de la solictud es obligatorio.");
    if (!requestingUser) throw CustomError.badRequest("El identificador del usuario solicitante es obligatorio.");
    if (!state) throw CustomError.badRequest("El estado del usuario es obligatorio.");
    if (!registeredAt) throw CustomError.badRequest("La fecha de registro de la solicitud es obligatoria.");

    return new DelitionRequestEntity(
      _id || id,
      project,
      motive,
      requestingUser,
      reviewer,
      state,
      reviewedAt,
      registeredAt
    );
  }
}
