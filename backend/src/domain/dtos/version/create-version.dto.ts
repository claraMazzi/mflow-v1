


export class CreateVersionDto {
    constructor(
        public readonly title: string,
        public readonly parentVersion: string,
        public readonly projectId: string,
    ){}

    static create( object: {[key:string]:any}): [string?, CreateVersionDto?] {
        const {title, parentVersion, projectId} = object;
        if (!title) return ['El título de la versión es obligatorio.'];
        if (!projectId) return ['Debe especificar el proyecto al que pertenece esta versión.'];
        return [undefined, new CreateVersionDto(title, parentVersion, projectId)]
    }
}