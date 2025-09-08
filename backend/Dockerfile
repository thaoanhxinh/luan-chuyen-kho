# Sử dụng Node.js
FROM node:20

# Tạo thư mục app
WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ source
COPY . .

# Chạy ứng dụng
CMD ["npm", "start"]

# Expose port
EXPOSE 5000
