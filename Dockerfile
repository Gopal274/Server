# Base image
FROM node:20-alpine

# Working directory
WORKDIR /app

# Install build dependencies for fluent-ffmpeg and native modules
RUN apk add --no-cache ffmpeg python3 make g++ 

# Copy package.json and package-lock.json from the CURRENT directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code from the CURRENT directory
COPY . .

# Expose port
EXPOSE 8000

# Start command
CMD ["npm", "run", "start"]
