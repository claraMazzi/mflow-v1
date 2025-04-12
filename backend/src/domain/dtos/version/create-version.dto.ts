


export class CreateVersionDto {
    constructor(
        public readonly title: string,
        public readonly parentVersion: string,
        public readonly projectId: string,
    ){}

    static create( object: {[key:string]:any}): [string?, CreateVersionDto?] {
        const {title, parentVersion, projectId} = object;
        if (!title) return ['Title is missing'];
        if (!projectId) return ['Missing Old Password'];
        return [undefined, new CreateVersionDto(title, parentVersion, projectId)]
    }
}