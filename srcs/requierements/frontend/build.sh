#!/bin/bash

# Build frontend script
echo "Building frontend..."

# Create directories
mkdir -p public/js public/css

# Install dependencies
npm install

# Build TypeScript
npm run build

# Build CSS
npm run build-css

echo "Frontend build complete!"
