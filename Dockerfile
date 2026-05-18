# Etapa 1: Construcción (Build)
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalación limpia y exacta de dependencias
RUN npm ci

# Copiamos el código fuente
COPY . .

# Compilamos la aplicación para producción utilizando Angular 21
RUN npm run build -- --configuration production

# Etapa 2: Servidor Web (Runtime)
FROM nginx:alpine

LABEL maintainer="your-email@example.com"
LABEL version="1.0"

# Reemplaza 'as241-s5-aej-05-fe' por el valor exacto de la propiedad "name" de tu package.json
COPY --from=build /app/dist/*/browser/ /usr/share/nginx/html/

# Copiamos configuración optimizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check compatible con Alpine (Wget integrado de forma nativa)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]