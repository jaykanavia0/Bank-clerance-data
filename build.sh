#!/usr/bin/env bash

# Exit on error
set -e

echo "Starting build process..."

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies and build frontend
echo "Installing Node.js dependencies..."
cd frontend
npm install

echo "Building React frontend..."
npm run build

# Go back to root
cd ..

echo "Build completed successfully!"