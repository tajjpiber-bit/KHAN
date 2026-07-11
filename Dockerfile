FROM node:20

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Hugging Face Spaces run on port 7860 by default
EXPOSE 7860
ENV PORT=7860

# Start server
CMD ["node", "server.js"]
