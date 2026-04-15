FROM node:20-slim

# Install FFmpeg (required for audio assembly)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

# Create output directory
RUN mkdir -p output

EXPOSE 3000

CMD ["node", "server.js"]
