#!/bin/bash

echo "Starting build process for contact-routing-system..."

# Build React frontend
echo "Building React frontend..."
cd frontend
echo "Installing frontend dependencies..."
npm install
echo "Building React app..."
npm run build
cd ..

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "Build complete!"
echo "React build created in frontend/build/"
echo "Python dependencies installed"