export class AssignVerifierDto {
	private constructor(
		public verifierRequestId: string,
		public assignedVerifierId: string,
		public reviewerId: string
	) {}

	static create(object: {
		verifierRequestId: string;
		assignedVerifierId: string;
		reviewerId: string;
	}): [string?, AssignVerifierDto?] {
		const { verifierRequestId, assignedVerifierId, reviewerId } = object;

		if (!verifierRequestId || verifierRequestId.trim() === "") {
			return ["El identificador de la solicitud de verificador es obligatorio."];
		}

		if (!assignedVerifierId || assignedVerifierId.trim() === "") {
			return ["Debe seleccionar un verificador para asignar."];
		}

		if (!reviewerId || reviewerId.trim() === "") {
			return ["El identificador del revisor (admin) es obligatorio."];
		}

		return [
			undefined,
			new AssignVerifierDto(verifierRequestId, assignedVerifierId, reviewerId),
		];
	}
}
