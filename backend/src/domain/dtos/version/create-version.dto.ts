export class CreateVersionDto {
    constructor(
        public readonly title: string,
        public readonly projectId: string,
        public readonly parentVersionId: string | null,
        public readonly migrateTodoItems: boolean,
    ) {}

    static create(object: { [key: string]: any }): [string?, CreateVersionDto?] {
        const { title, parentVersionId, projectId, migrateTodoItems } = object;
        
        if (!title) return ['El título de la versión es obligatorio.'];
        if (!projectId) return ['Debe especificar el proyecto al que pertenece esta versión.'];
        
        return [
            undefined,
            new CreateVersionDto(
                title,
                projectId,
                parentVersionId || null,
                migrateTodoItems ?? true
            )
        ];
    }
}