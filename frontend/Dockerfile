FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM nginx:1.27-alpine

# Create nginx user and set permissions for OpenShift
RUN chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html && \
    chmod -R g=u /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html && \
    chmod g=u /etc/passwd

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Run as non-root user
USER 1001

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]