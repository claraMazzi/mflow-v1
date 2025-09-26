export class DenyDeletionRequestDto {
  constructor(
    public readonly deletionRequestId: string,
    public readonly reviewer: string,
    public readonly reviewedAt: Date,
    public readonly reason?: string
  ) {}

  static create(object: { [key: string]: any }): [string?, DenyDeletionRequestDto?] {
    const { deletionRequestId, reviewer, reason } = object;
    const reviewedAt = new Date();

    if (!deletionRequestId) return ['Deletion request ID is required'];
    if (!reviewer) return ['Reviewer is required'];

    return [
      undefined,
      new DenyDeletionRequestDto(deletionRequestId, reviewer, reviewedAt, reason),
    ];
  }
}
