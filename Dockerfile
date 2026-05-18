# Etapa 1: Dependencias (Dependencies)
# Preparamos las dependencias de producción
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copiamos package files
COPY package*.json ./

# Instalamos SOLO las dependencias de producción
RUN npm ci --only=production

# Etapa 2: Construcción (Build)
# Compilamos la aplicación Angular
FROM node:18-alpine AS build

WORKDIR /app

# Copiamos package files
COPY package*.json ./

# Instalamos todas las dependencias (incluyendo devDependencies para build)
RUN npm ci

# Copiamos el código fuente
COPY . .

# Compilamos la aplicación
RUN npm run build -- --configuration production

# Etapa 3: Servidor Web (Runtime)
# Imagen final con Nginx y solo archivos necesarios
FROM nginx:alpine

# Metadatos
LABEL maintainer="your-email@example.com"
LABEL version="1.0"

# Copiamos solo los archivos compilados necesarios
COPY --from=build /app/dist/*/browser /usr/share/nginx/html/

# Copiamos configuración optimizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]