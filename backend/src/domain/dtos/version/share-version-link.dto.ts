export class ShareVersionLinkDto {
	constructor(
		public readonly versionId: string,
		public readonly requestingUser: string
	) {}

	static create(object: { [key: string]: any }): [string?, ShareVersionLinkDto?] {
		const { versionId, requestingUser } = object;

		if (!versionId) return ["El identificador de la versión es obligatorio."];
		if (!requestingUser) return ["Debe haber iniciado sesión para realizar esta acción."];

		return [undefined, new ShareVersionLinkDto(versionId, requestingUser)];
	}
}
