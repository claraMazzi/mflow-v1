import mongoose from "mongoose";

interface ConnectionOptions {
    mongoUrl: string;
    dbName: string;
}


export class MongoDatabase {
    static async connect(options: ConnectionOptions) {
        const {dbName, mongoUrl} = options;

        try {
            //si se quieren configurar mas cosas van en el objeto de configuracion
            await mongoose.connect( mongoUrl, {
                dbName: dbName
            });
            console.log('Mongo connected');
        } catch (error) {
            console.log('Mongo connection error');
            throw error;
        }
    }
}