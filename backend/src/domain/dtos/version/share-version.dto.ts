export class ShareVersionDto {
	constructor(
		public readonly versionId: string,
		public readonly senderId: string,
		public readonly emails: string[]
	) {}

	static create(object: { [key: string]: any }): [string?, ShareVersionDto?] {
		const { versionId, senderId, collaborators: emails } = object;

		if (!versionId) return ["El identificador de la versión es requerido."];
		if (!senderId) return ["Debe haber iniciado sesión para realizar esta acción."];
		if (!emails || !Array.isArray(emails) || emails.length === 0)
			return ["Se requiere de al menos un email para enviar las invitaciones."];

		return [undefined, new ShareVersionDto(versionId, senderId, emails)];
	}
}
