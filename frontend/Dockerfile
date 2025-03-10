FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Install react-icons explicitly
RUN npm install react-icons

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PORT 3000
ENV NODE_OPTIONS="--max-http-header-size=16384 --max-old-space-size=4096"
ENV NEXT_PUBLIC_API_URL http://fastapi:8000

# Expose the port
EXPOSE 3000

# Run the application in development mode
CMD ["npm", "run", "dev"] 