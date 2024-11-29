# Use the official Node.js image from the Docker registry
FROM node:16

# Set the working directory inside the container
WORKDIR /app

# Install any dependencies (optional, if you have a package.json)
COPY dist/ /app/

# Install the Node.js dependencies (use yarn or npm as per your project)
RUN npm install

# Expose a port if needed (this is usually useful for web apps, but optional here)
EXPOSE 3000

# Define the entrypoint to the build tool/script
# If you're using npm run build or a custom script, add it here.
ENTRYPOINT ["node", "S4ShellTools.js"]
CMD ["-h"]
