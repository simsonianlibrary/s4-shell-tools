# Use the official Node.js image from the Docker registry
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY / ./

RUN npm run build && npm run postbuild

# Expose a port if needed (this is usually useful for web apps, but optional here)
EXPOSE 3000


# ENTRYPOINT ["node", "dist/S4ShellTools.js"]
CMD ["/bin/sh"]
