export class RequestRevisionDto {
	private constructor(
		public versionId: string,
		public requestingUserId: string,
		public assignRandomVerifier: boolean,
		public selectedVerifierId: string | null
	) {}

	static create(object: {
		versionId: string;
		requestingUserId: string;
		assignRandomVerifier?: boolean;
		selectedVerifierId?: string;
	}): [string?, RequestRevisionDto?] {
		const { versionId, requestingUserId, assignRandomVerifier, selectedVerifierId } = object;

		if (!versionId) {
			return ["El identificador de la versión es obligatorio."];
		}

		if (!requestingUserId) {
			return ["El identificador del usuario solicitante es obligatorio."];
		}

		const hasCheckbox = assignRandomVerifier === true;
		const hasVerifier = selectedVerifierId && selectedVerifierId.trim() !== "";

		// Validation: Cannot select both options
		if (hasCheckbox && hasVerifier) {
			return ["No puede seleccionar ambas opciones."];
		}

		// Validation: Must select at least one option
		if (!hasCheckbox && !hasVerifier) {
			return ["Debe seleccionar un verificador o marcar la opción para asignar uno automáticamente."];
		}

		return [
			undefined,
			new RequestRevisionDto(
				versionId,
				requestingUserId,
				hasCheckbox,
				hasVerifier ? selectedVerifierId : null
			),
		];
	}
}

