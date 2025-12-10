# Use Node 22
FROM node:22

# Set working directory
WORKDIR /workspace

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .
# Start the server
CMD ["npm", "start"]
