# Intelligent Contact Routing System

A machine learning-based system for routing banking issues to appropriate contacts based on issue type, severity, and bank characteristics.

## Features

- Automatically determine the best contact person for banking issues
- Predict appropriate escalation levels based on issue type and severity
- Interactive web interface for submitting issues
- Contacts directory to browse decision-makers and technical staff
- Modern UI with responsive design

## Installation and Setup

### Prerequisites

- Docker and Docker Compose
- Python 3.8+
- Node.js 16+ (for local development)
- WesternGridEscalationMatrix.xlsx file with bank contacts data

### Initial Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/contact-routing-system.git
   cd contact-routing-system
   ```

2. Place the `WesternGridEscalationMatrix.xlsx` file in the project root directory

3. Start the application using the provided script
   ```
   ./start.sh
   ```

   The script will:
   - Check for required data files
   - Train the ML model if needed
   - Start the application (with Docker by default)

4. Access the application at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## Development Workflow

### Modifying Backend Files

The backend is built with Flask and uses a machine learning model to route banking issues to appropriate contacts.

1. Make changes to backend files in the `contact-routing-system/backend/` directory

2. Rebuild and restart the backend container:
   ```
   docker-compose down
   docker-compose build backend
   docker-compose up -d
   ```

3. To see logs and debug backend issues:
   ```
   docker logs banking-contact-backend
   ```

4. If you modify the model or training process:
   ```
   # Re-train the model
   docker exec -it banking-contact-backend bash -c "cd /app && python train_model.py"
   
   # Restart the backend to load the new model
   docker-compose restart backend
   ```

### Modifying Frontend Files

The frontend is built with React, Vite, and Tailwind CSS.

1. Make changes to frontend files in the `contact-routing-system/frontend/` directory

2. Rebuild and restart the frontend container:
   ```
   docker-compose down
   docker-compose build frontend
   docker-compose up -d
   ```

3. To see logs and debug frontend issues:
   ```
   docker logs banking-contact-frontend
   ```

4. If you're adding new dependencies:
   ```
   # Add dependencies to package.json first, then rebuild
   cd contact-routing-system/frontend
   npm install [package-name]
   
   # Update the container
   docker-compose build frontend
   docker-compose up -d
   ```

### Adding New Components

#### Backend: Adding a New API Endpoint

1. Edit `app.py` to add your new endpoint:
   ```python
   @app.route('/api/your-new-endpoint', methods=['GET'])
   def your_new_function():
       # Your implementation here
       return jsonify({'success': True, 'data': result})
   ```

2. Rebuild and restart the backend container:
   ```
   docker-compose build backend
   docker-compose up -d
   ```

#### Frontend: Adding a New Component

1. Create your new component in `contact-routing-system/frontend/src/components/`:
   ```jsx
   // NewComponent.jsx
   function NewComponent() {
     return (
       <div>
         <h2>New Component</h2>
         {/* Your component content */}
       </div>
     )
   }
   
   export default NewComponent
   ```

2. Add the component to your pages:
   ```jsx
   import NewComponent from '../components/NewComponent'
   
   function SomePage() {
     return (
       <div>
         <NewComponent />
       </div>
     )
   }
   ```

3. Rebuild the frontend container:
   ```
   docker-compose build frontend
   docker-compose up -d
   ```

## Common Issues and Solutions

### 1. Docker container not showing latest changes

If your changes don't appear after rebuilding:

```bash
# Force a clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 2. Missing dependencies in frontend

If you see errors about missing packages:

```bash
# Add the dependency to package.json
cd contact-routing-system/frontend
npm install package-name

# Rebuild the container
docker-compose build frontend
docker-compose up -d
```

### 3. Backend model issues

If you encounter model loading errors:

```bash
# You can run a simplified training script that avoids model complications
docker exec -it banking-contact-backend bash -c "cd /app && python simple_train.py"
docker-compose restart backend
```

### 4. Docker networking issues

If containers can't communicate with each other:

```bash
# Check network status
docker network ls
docker network inspect contact-routing-system_app-network

# Recreate the network
docker-compose down
docker network prune
docker-compose up -d
```

## Architecture

- **Frontend**: React with Vite, Tailwind CSS
- **Backend**: Flask REST API
- **ML Model**: Random Forest Classifier
- **Data Processing**: Pandas, NumPy, Scikit-learn
- **Containerization**: Docker & Docker Compose

## License

MIT