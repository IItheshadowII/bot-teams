# Usa una imagen base que ya tiene todo lo necesario para Puppeteer
# Esto evita problemas con librerías de Chrome en sistemas operativos base.
FROM ghcr.io/puppeteer/puppeteer:latest

# Define el usuario no-root que usará Puppeteer
USER root

# Define el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de configuración
COPY package*.json ./

# Instala las dependencias de Node
RUN npm install

# Copia el script principal
COPY enviar_teams.js .

# Comando que se ejecuta al iniciar el contenedor
# TEMPORAL: mantener el contenedor vivo para permitir `docker exec` durante el login
CMD ["sleep", "infinity"]