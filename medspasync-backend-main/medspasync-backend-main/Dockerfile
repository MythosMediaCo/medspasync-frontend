# Use official Node runtime
FROM node:18-bullseye


# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# ✅ Copy Prisma schema early so postinstall can run `prisma generate`
COPY prisma ./prisma

# Install dependencies
RUN npm install

# Copy the rest of the app source
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
