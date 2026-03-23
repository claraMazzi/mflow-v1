# mflow-v1


# env

node v ```22.13.0```

1. instalar dependencias con el comando ```npm i``` 
2. clonar el archivo .env.template a .env
3. configurar las variables de entorno
4. Para levantar docker ir a la carpeta mflow-v1/backend y correr ```docker compose up -d``` para levantar mongo en docker - el "-d" signfica detached, se puede cerrar la terminal una vez levnatado
5. correr ```npm run dev```


## Nota (email con Resend)
Para enviar correos (registro, invitaciones, recuperación de contraseña, etc.) activá `SEND_EMAIL=true` en `.env` y configurá [Resend](https://resend.com): `RESEND_API_KEY` y un remitente verificado en `RESEND_FROM_EMAIL` (por ejemplo `MFLOW <noreply@tudominio.com>`, o `onboarding@resend.dev` solo para pruebas).




