import express, { Router } from "express";

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
    //middleware - funciones que se ejecutan cada vez que el codigo pase por x ruta

    //* Middlewares
    this.app.use( express.json() ); // raw
    this.app.use( express.urlencoded({ extended: true }) ); // x-www-form-urlencoded

    //* Public folder
    this.app.use(express.static("/public"));

    //* Routes
    this.app.use(this.routes);

    console.log("server started");

    //pongo a la app a escuchar peticiones
    this.serverListener = this.app.listen(this.port, () => {
      console.log(`Server running on port ${ this.port }`);
    });

  }

  public close() {
    this.serverListener?.close();
  }
  
}
