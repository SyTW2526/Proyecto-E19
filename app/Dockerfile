# Imagen base
FROM node:20-alpine

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Instalar curl para healthchecks
RUN apk add --no-cache curl

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de archivos de la app
COPY . .

# Puerto expuesto
EXPOSE 4000

# Comando por defecto al iniciar
CMD ["npm", "run", "dev"]
