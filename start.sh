#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   Starting Intelligent Contact Routing System   ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Check if the data file exists
if [ ! -f "WesternGridEscalationMatrix.xlsx" ]; then
    echo -e "${RED}Error: WesternGridEscalationMatrix.xlsx file not found.${NC}"
    echo -e "Please place the data file in the current directory and try again."
    exit 1
fi

# Check if model files exist, if not run the training script
if [ ! -d "models" ] || [ ! -d "data" ]; then
    echo -e "${YELLOW}Model and data files not found. Running training script...${NC}"
    python train_model.py
else
    echo -e "${GREEN}Model and data files found.${NC}"
fi

# Determine running mode
if command -v docker-compose &> /dev/null || command -v docker compose &> /dev/null; then
    echo -e "\n${YELLOW}Docker Compose found. Do you want to use Docker? (y/n)${NC}"
    read -r use_docker
    
    if [[ $use_docker =~ ^[Yy]$ ]]; then
        echo -e "\n${BLUE}Starting application with Docker Compose...${NC}"
        
        # Check if using docker compose or docker-compose
        if command -v docker compose &> /dev/null; then
            docker compose up --build -d
        else
            docker-compose up --build -d
        fi
        
        echo -e "\n${GREEN}Application started successfully!${NC}"
        echo -e "Frontend is available at: ${BLUE}http://localhost:3000${NC}"
        echo -e "Backend API is available at: ${BLUE}http://localhost:5000/api${NC}"
    else
        dev_mode
    fi
else
    echo -e "\n${YELLOW}Docker Compose not found. Starting in development mode...${NC}"
    dev_mode
fi

function dev_mode() {
    echo -e "\n${BLUE}Starting application in development mode...${NC}"
    
    # Start backend
    echo -e "\n${YELLOW}Starting backend server...${NC}"
    cd backend
    
    # Create and activate virtual environment
    if [ ! -d "venv" ]; then
        echo -e "${BLUE}Creating virtual environment...${NC}"
        python -m venv venv
    fi
    
    # Activate based on OS
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    # Install dependencies and start backend
    pip install -r requirements.txt
    echo -e "${GREEN}Starting Flask server...${NC}"
    flask run &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend
    echo -e "\n${YELLOW}Starting frontend server...${NC}"
    cd frontend
    echo -e "${BLUE}Installing npm packages...${NC}"
    npm install
    echo -e "${GREEN}Starting Vite dev server...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo -e "\n${GREEN}Application started successfully!${NC}"
    echo -e "Frontend is available at: ${BLUE}http://localhost:5173${NC}"
    echo -e "Backend API is available at: ${BLUE}http://localhost:5000/api${NC}"
    
    # Handle cleanup on exit
    trap cleanup INT TERM
    function cleanup() {
        echo -e "\n${YELLOW}Stopping servers...${NC}"
        kill $BACKEND_PID
        kill $FRONTEND_PID
        echo -e "${GREEN}Servers stopped.${NC}"
        exit 0
    }
    
    # Wait for user to press Ctrl+C
    echo -e "\n${BLUE}Press Ctrl+C to stop the servers${NC}"
    wait
}

# End of script
