# Intelligent Contact Routing System

A machine learning-based system for routing banking issues to appropriate contacts based on issue type, severity, and bank characteristics.

## Features

- Automatically determine the best contact person for banking issues
- Predict appropriate escalation levels based on issue type and severity
- Interactive web interface for submitting issues
- Displays contact information with confidence score
- API for integration with other systems

## Installation and Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- Excel file with bank contacts data (`WesternGridEscalationMatrix.xlsx`)

### Method 1: Local Development Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/contact-routing-system.git
   cd contact-routing-system
   ```

2. Place the `WesternGridEscalationMatrix.xlsx` file in the project root

3. Train the model
   ```
   python train_model.py
   ```

4. Start the backend (in a new terminal)
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   flask run
   ```

5. Start the frontend (in a new terminal)
   ```
   cd frontend
   npm install
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5173`

### Method 2: Docker Compose

1. Make sure you have Docker and Docker Compose installed

2. Place the `WesternGridEscalationMatrix.xlsx` file in the project root

3. Train the model
   ```
   python train_model.py
   ```

4. Start the application using Docker Compose
   ```
   docker-compose up -d
   ```

5. Access the application at `http://localhost:3000`

## Usage

1. Select a bank from the dropdown menu
2. Choose the issue category
3. Select the severity level
4. Set the time sensitivity
5. Click "Find Best Contact"
6. The system will display the recommended contact with confidence score

## Architecture

- **Frontend**: React with Vite, Tailwind CSS
- **Backend**: Flask REST API
- **ML Model**: Random Forest Classifier
- **Data Processing**: Pandas, NumPy, Scikit-learn

## License

MIT


## How to start the application

1. Backend
   - "docker-compose restart backend""

2. Frontend
   - "docker-compose down"
   - "docker-compose build frontend"
   - "docker-compose up -d"

3. Final start up
   - "./start.sh