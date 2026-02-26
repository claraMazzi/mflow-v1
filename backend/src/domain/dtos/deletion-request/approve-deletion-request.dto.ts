export class ApproveDeletionRequestDto {
  constructor(
    public readonly deletionRequestId: string,
    public readonly reviewer: string,
    public readonly reviewedAt: Date
  ) {}

  static create(object: { [key: string]: any }): [string?, ApproveDeletionRequestDto?] {
    const { deletionRequestId, reviewer } = object;
    const reviewedAt = new Date();

    if (!deletionRequestId) return ['El identificador de la solicitud de eliminación es obligatorio.'];
    if (!reviewer) return ['El identificador del usuario que está evaluando la solicitud es obligatorio.'];

    return [
      undefined,
      new ApproveDeletionRequestDto(deletionRequestId, reviewer, reviewedAt),
    ];
  }
}
