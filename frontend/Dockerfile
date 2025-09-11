# Stage 1: Build Frontend
FROM node:20 as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Build the application
RUN npm run build

    # Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the custom nginx.conf to override the default configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

    # Copy built files from the build stage to Nginx's HTML directory
COPY --from=build /app/dist /usr/share/nginx/html

    # Expose port 80
EXPOSE 80

    # Start Nginx
CMD ["nginx", "-g", "daemon off;"]