import express, { Router } from "express";
import { ProjectModel, UserModel, VersionModel } from "../data";
import { bcryptAdapter } from "../config";

interface Options {
	port?: number;
	routes: Router;
}
export class Server {
	private app = express();
	private port: number;
	private routes: Router;
	private serverListener?: any;

	constructor(options: Options) {
		const { port, routes } = options;
		this.port = port ?? 3000;
		this.routes = routes;
	}

	//punto de inicio de la aplicacion
	async start() {
		//* para servir todo lo que tengo en mi carpeta publica uso un middleware
		//middleware - funciones que se ejecutan cada vez que el codigo pase por x ruta y antes del controller

		//* Middlewares
		this.app.use(express.json()); // raw - extrae el body en un jsin
		this.app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded - extrae el form en json

		//* Public folder
		this.app.use(express.static("/public"));

		//* Routes
		this.app.use(this.routes);

		console.log("server started");

		//pongo a la app a escuchar peticiones
		this.serverListener = this.app.listen(this.port, () => {
			console.log(`Server running on port ${this.port}`);
		});

    //Uncomment when needed
		//this.createTestEntities();
		// this.seedUsers();
	}

	private async seedUsers() {
		const hashedPassword = await bcryptAdapter.hash("123456");
		
				const users = [
					{
						name: "Ana",
						lastName: "González",
						email: "ana.admin@example.com",
						password: hashedPassword,
						roles: ["ADMIN"],
						emailValidated: true,
					},
					{
						name: "Carlos",
						lastName: "Pérez",
						email: "carlos.verificador@example.com",
						password: hashedPassword,
						roles: ["VERIFICADOR"],
						emailValidated: false,
					},
					{
						name: "Lucía",
						lastName: "Martínez",
						email: "lucia.modelador@example.com",
						password: hashedPassword,
						roles: ["MODELADOR"],
						emailValidated: true,
					},
					{
						name: "Juan",
						lastName: "Rodríguez",
						email: "juan.multi@example.com",
						password: hashedPassword,
						roles: ["MODELADOR", "VERIFICADOR"],
						emailValidated: true,
					},
				];
		
				await UserModel.insertMany(users);
	}

	private createTestEntities() {
    //Warning! - Drops all collections to allow for a fresh start 
    UserModel.collection.drop();
    ProjectModel.collection.drop();
    VersionModel.collection.drop();

		const user = new UserModel({
			name: "Juan",
			lastName: "Albani",
			email: "juanalbani48@gmail.com",
      password: "hola123",
      emailValidated: true,
      roles: ["MODELADOR"]
		});

		user.save();

    const version = new VersionModel({
      title: "Version 1"
    });

    version.save();

    const project = new ProjectModel({
      name: "P1",
      description: "Whatever",
      owner: user._id,
    });

    project.versions.push(version._id)

    project.save();
	}

	public close() {
		this.serverListener?.close();
	}
}
