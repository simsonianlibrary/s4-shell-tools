# Use the official Node.js image from the Docker registry
FROM node:16

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY s4-shell-tools/package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application files
COPY s4-shell-tools/ ./

RUN npm run build && npm run postbuild

# Expose a port if needed (this is usually useful for web apps, but optional here)
EXPOSE 3000

# Define the entrypoint to the build tool/script
# If you're using npm run build or a custom script, add it here.
ENTRYPOINT ["node", "dist/S4ShellTools.js"]
CMD ["-h"]
