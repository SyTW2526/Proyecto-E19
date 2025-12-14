### Multi-stage Dockerfile: build React with Node, serve with nginx
FROM node:20-alpine AS builder
WORKDIR /app

# copy only package manifests first for better caching
COPY package.json package-lock.json* ./
RUN npm install --silent

# copy source & build
COPY . .
RUN npm run build

### Stage: nginx to serve the static build
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy a custom nginx config if present
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
