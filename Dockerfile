# Dockerfile para Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Aceitar build args para variáveis de ambiente VITE
# TODAS as variáveis DEVEM ser passadas via docker-compose.yml (não hardcoded aqui por segurança)
ARG VITE_API_URL
ARG VITE_MERCADOPAGO_PUBLIC_KEY
ARG VITE_GOOGLE_CLIENT_ID

# Definir como variáveis de ambiente para o build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_MERCADOPAGO_PUBLIC_KEY=${VITE_MERCADOPAGO_PUBLIC_KEY}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

# Copiar arquivos de dependências
COPY package*.json ./
COPY yarn.lock ./

# Instalar dependências
RUN yarn install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
RUN yarn build

# Estágio de produção com Nginx
FROM nginx:alpine

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Nginx já inicia automaticamente, mas podemos garantir com CMD
CMD ["nginx", "-g", "daemon off;"]

