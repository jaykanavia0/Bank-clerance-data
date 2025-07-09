@echo off
echo Starting build process...

echo Installing Python dependencies...
pip install -r requirements.txt

echo Installing Node.js dependencies...
cd frontend
npm install

echo Building React frontend...
npm run build

echo Going back to root...
cd ..

echo Build completed successfully!
pause@echo off
echo Starting build process...

echo Installing Python dependencies...
pip install -r requirements.txt

echo Installing Node.js dependencies...
cd frontend
npm install

echo Building React frontend...
npm run build

echo Going back to root...
cd ..

echo Build completed successfully!
pause