# esbilla-api/Dockerfile
FROM node:20

# Creación del directoriu de trabayu
WORKDIR /app

# Copia de ficheros de dependencies
COPY package*.json ./
RUN npm install --production

# Copia del restu del códigu y del SDK
COPY . .

# Esposición del puertu
EXPOSE 3000

# Execución del servidor
CMD ["node", "src/index.js"]