export class ApproveDeletionRequestDto {
  constructor(
    public readonly deletionRequestId: string,
    public readonly reviewer: string,
    public readonly reviewedAt: Date
  ) {}

  static create(object: { [key: string]: any }): [string?, ApproveDeletionRequestDto?] {
    const { deletionRequestId, reviewer } = object;
    const reviewedAt = new Date();

    if (!deletionRequestId) return ['Deletion request ID is required'];
    if (!reviewer) return ['Reviewer is required'];

    return [
      undefined,
      new ApproveDeletionRequestDto(deletionRequestId, reviewer, reviewedAt),
    ];
  }
}
