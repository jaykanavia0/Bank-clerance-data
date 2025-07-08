#!/bin/bash

echo "Starting build process..."

# Build React frontend
echo "Building React frontend..."
cd frontend
npm install
npm run build
cd ..

# Install Python dependencies
echo "Installing Python dependencies..."
# If requirements.txt is in root directory:
#pip install -r requirements.txt

# If requirements.txt is in backend directory, use this instead:
pip install -r backend/requirements.txt

echo "Build complete!"
echo "React build created in frontend/build/"
echo "Python dependencies installed"
