# mflow-v1


# env

1. instalar dependencias con el comando ```npm i``` 
2. clonar el archivo .env.template a .env
3. configurar las variables de entorno
4. Para levantar docker ir a la carpeta mflow-v1/backend y correr ```docker compose up -d``` para levantar mongo en docker - el "-d" signfica detached, se puede cerrar la terminal una vez levnatado
5. correr ```npm run dev```


## Nota:
Para probar la funcionalidad de envio de mail cuado se realiza el registro para validar el email se tiene que activar con la flag ```SEND_EMAIL``` en el archivo ```.env```.




