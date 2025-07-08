#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   Setting up Intelligent Contact Routing System   ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Create project directory structure
echo -e "\n${YELLOW}Creating project directory structure...${NC}"
mkdir -p contact-routing-system/{frontend,backend,models,data}
cd contact-routing-system

# ----- BACKEND SETUP -----
echo -e "\n${YELLOW}Setting up Python backend...${NC}"
cd backend

# Create virtual environment and activate it
echo -e "${GREEN}Creating Python virtual environment...${NC}"
python -m venv venv

# Activate virtual environment based on OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install backend dependencies
echo -e "${GREEN}Installing Python dependencies...${NC}"
pip install flask flask-cors pandas numpy scikit-learn matplotlib seaborn python-dotenv gunicorn

# Create backend files
echo -e "${GREEN}Creating backend files...${NC}"

# Create app.py
cat > app.py << 'EOL'
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import pickle
import os
import logging
from logging.handlers import RotatingFileHandler

# Configure app
app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

# Configure logging
if not os.path.exists('logs'):
    os.mkdir('logs')

file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)

app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)
app.logger.info('Contact Routing System startup')

# Global variables for model and data
routing_model = None
scaler = None
feature_columns = None
df_clean = None
routing_features = None

# Issue categories and severity levels
issue_categories = ['Account_Access', 'Transaction_Failure', 'Technical_Error', 
                   'Fraud_Alert', 'Customer_Service', 'Data_Sync']

severity_levels = ['Low', 'Medium', 'High', 'Critical']

# Escalation level mapping
escalation_mapping = {
    1: 'Level_1',
    2: 'Level_2',
    3: 'Level_3',
    4: 'Tech_Level_1',
    5: 'Tech_Level_2',
    6: 'Head_GM'
}

# Numerical columns for scaling
numerical_cols = ['Time_Sensitivity', 'Complete_Levels_Count', 'Generic_Email_Count',
                 'Corporate_Email_Count', 'Personal_Email_Count',
                 'Email_Completeness', 'Phone_Completeness']

def load_model_and_data():
    """Load the model and data files"""
    global routing_model, scaler, feature_columns, df_clean, routing_features
    
    # Only load if not already loaded
    if routing_model is None:
        app.logger.info("Loading model and data...")
        
        try:
            # Load the model
            with open('../models/routing_model.pkl', 'rb') as file:
                routing_model = pickle.load(file)
            
            # Load the scaler
            with open('../models/feature_scaler.pkl', 'rb') as file:
                scaler = pickle.load(file)
            
            # Load feature columns
            with open('../models/feature_columns.pkl', 'rb') as file:
                feature_columns = pickle.load(file)
            
            # Load the cleaned data
            df_clean = pd.read_pickle('../data/df_clean.pkl')
            routing_features = pd.read_pickle('../data/routing_features.pkl')
            
            app.logger.info("Model and data loaded successfully")
        except Exception as e:
            app.logger.error(f"Error loading model and data: {str(e)}")
            raise

# Load model and data at startup
load_model_and_data()

@app.route('/api/banks', methods=['GET'])
def get_banks():
    """Get list of banks for the dropdown"""
    try:
        banks = routing_features[['Bank_ID', 'Bank_Name']].drop_duplicates().sort_values('Bank_Name')
        return jsonify({
            'success': True,
            'banks': banks.to_dict('records')
        })
    except Exception as e:
        app.logger.error(f"Error retrieving banks: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get list of issue categories"""
    return jsonify({
        'success': True,
        'categories': [{'id': cat, 'name': cat.replace('_', ' ')} for cat in issue_categories]
    })

@app.route('/api/severities', methods=['GET'])
def get_severities():
    """Get list of severity levels"""
    return jsonify({
        'success': True,
        'severities': [{'id': sev, 'name': sev} for sev in severity_levels]
    })

@app.route('/api/route_issue', methods=['POST'])
def route_issue():
    """Route an issue to the appropriate contact"""
    try:
        data = request.json
        
        # Get form data
        bank_id = int(data.get('bank_id'))
        issue_category = data.get('issue_category')
        severity = data.get('severity')
        time_sensitivity = int(data.get('time_sensitivity'))
        
        app.logger.info(f"Routing issue: Bank ID {bank_id}, Category {issue_category}, Severity {severity}")
        
        # Get bank features
        bank_features = routing_features[routing_features['Bank_ID'] == bank_id]
        
        if len(bank_features) == 0:
            return jsonify({
                'success': False,
                'error': f"Bank ID {bank_id} not found in feature database."
            }), 404
        
        # Create a dataframe for the new issue
        new_issue = pd.DataFrame({
            'Time_Sensitivity': [time_sensitivity],
            'Has_Shared_Emails': bank_features['Has_Shared_Emails'].values,
            'Has_Shared_Phones': bank_features['Has_Shared_Phones'].values,
            'Complete_Levels_Count': bank_features['Complete_Levels_Count'].values,
            'Generic_Email_Count': bank_features['Generic_Email_Count'].values,
            'Corporate_Email_Count': bank_features['Corporate_Email_Count'].values,
            'Personal_Email_Count': bank_features['Personal_Email_Count'].values,
            'Email_Completeness': bank_features['Email_Completeness'].values,
            'Phone_Completeness': bank_features['Phone_Completeness'].values
        })
        
        # One-hot encode category and severity
        for cat in issue_categories:
            new_issue[f'Category_{cat}'] = 1 if issue_category == cat else 0
            
        for sev in severity_levels:
            new_issue[f'Severity_{sev}'] = 1 if severity == sev else 0
        
        # Add region features
        for col in feature_columns:
            if col.startswith('Region_') and col not in new_issue.columns:
                new_issue[col] = bank_features[col].values if col in bank_features.columns else 0
        
        # Make sure all features from the training set are present
        for col in feature_columns:
            if col not in new_issue.columns:
                new_issue[col] = 0
        
        # Reorder columns to match the training data
        new_issue = new_issue[feature_columns]
        
        # Scale numerical features
        new_issue[numerical_cols] = scaler.transform(new_issue[numerical_cols])
        
        # Predict the escalation level
        predicted_level = routing_model.predict(new_issue)[0]
        prediction_proba = routing_model.predict_proba(new_issue)[0]
        confidence = float(np.max(prediction_proba) * 100)
        
        # Map back to level name
        level_name = escalation_mapping[predicted_level]
        
        # Get the original bank data to retrieve contact info
        bank_data_rows = df_clean[df_clean['Sl No'] == bank_id]
        if len(bank_data_rows) == 0:
            return jsonify({
                'success': False,
                'error': f"No contact data found for bank ID {bank_id}"
            }), 404
        
        bank_data = bank_data_rows.iloc[0]
        
        # Determine which contact to use based on predicted level
        try:
            if level_name == 'Level_1':
                contact_name = bank_data['Official Name (1st Level)']
                contact_phone = bank_data['Mobile Number']
                contact_email = bank_data['Mail Id']
            elif level_name == 'Level_2':
                contact_name = bank_data['Official Name (2nd Level)']
                contact_phone = bank_data['Mobile Number2']
                contact_email = bank_data['Mail Id2']
            elif level_name == 'Level_3':
                contact_name = bank_data['Official Name (3rd Level)']
                contact_phone = bank_data['Mobile Number3']
                contact_email = bank_data['Mail Id3']
            elif level_name == 'Tech_Level_1':
                contact_name = bank_data['Official Name from Technology (1st Level )']
                contact_phone = bank_data['Mobile Number4']
                contact_email = bank_data['Mail Id4']
            elif level_name == 'Tech_Level_2':
                contact_name = bank_data['Official Name from Technology (2nd Level )']
                contact_phone = bank_data['Mobile Number5']
                contact_email = bank_data['Mail Id5']
            elif level_name == 'Head_GM':
                contact_name = bank_data['Official Name (Head or GM)']
                contact_phone = bank_data['Mobile Number6']
                contact_email = bank_data['Mail Id6']
            
            # Fallback for any missing values
            if pd.isna(contact_name) or contact_name == '':
                contact_name = bank_data['Official Name (1st Level)']
            
            if pd.isna(contact_phone) or contact_phone == '':
                contact_phone = bank_data['Mobile Number']
            
            if pd.isna(contact_email) or contact_email == '':
                contact_email = bank_data['Mail Id']
        
            return jsonify({
                'success': True,
                'result': {
                    'bank': str(bank_data['Bank Name']),
                    'level_name': level_name,
                    'contact_name': str(contact_name),
                    'contact_phone': str(contact_phone),
                    'contact_email': str(contact_email),
                    'confidence': confidence
                }
            })
            
        except Exception as e:
            app.logger.error(f"Error retrieving contact details: {str(e)}")
            return jsonify({
                'success': False,
                'error': f"Error retrieving contact details: {str(e)}"
            }), 500
            
    except Exception as e:
        app.logger.error(f"Error in route_issue: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Serve the React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
EOL

# Create requirements.txt
cat > requirements.txt << 'EOL'
flask==2.3.3
flask-cors==4.0.0
pandas==2.1.0
numpy==1.25.2
scikit-learn==1.3.0
matplotlib==3.7.2
seaborn==0.12.2
python-dotenv==1.0.0
gunicorn==21.2.0
EOL

# Create Dockerfile for backend
cat > Dockerfile << 'EOL'
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_APP=app.py
ENV FLASK_DEBUG=0

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
EOL

# Create .env file
cat > .env << 'EOL'
FLASK_APP=app.py
FLASK_DEBUG=1
EOL

# ----- FRONTEND SETUP -----
cd ..
echo -e "\n${YELLOW}Setting up React frontend with Vite...${NC}"
cd frontend

# Initialize package.json
echo -e "${GREEN}Initializing package.json...${NC}"
cat > package.json << 'EOL'
{
  "name": "contact-routing-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "react-icons": "^4.10.1",
    "react-toastify": "^9.1.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.15",
    "postcss": "^8.4.29",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
}
EOL

# Create project structure and files
echo -e "${GREEN}Creating frontend project structure...${NC}"
mkdir -p src/{components,pages,services,assets,styles}

# Create index.html
cat > index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bank Contact Routing System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOL

# Create main.jsx
cat > src/main.jsx << 'EOL'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ToastContainer position="top-right" autoClose={3000} />
  </React.StrictMode>,
)
EOL

# Create App.jsx
cat > src/App.jsx << 'EOL'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Header from './components/Header'

function App() {
  return (
    <Router>
      <div className="app-container min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>
        <footer className="text-center py-4 text-sm text-gray-600">
          © {new Date().getFullYear()} Bank Contact Routing System
        </footer>
      </div>
    </Router>
  )
}

export default App
EOL

# Create Header component
cat > src/components/Header.jsx << 'EOL'
import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          Banking Contact Routing
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link to="/" className="hover:text-blue-200">
                Dashboard
              </Link>
            </li>
            <li>
              <a 
                href="https://github.com/yourusername/contact-routing-system" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-200"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
EOL

# Create Dashboard page
cat > src/pages/Dashboard.jsx << 'EOL'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import apiService from '../services/apiService'
import RoutingForm from '../components/RoutingForm'
import ResultCard from '../components/ResultCard'
import Spinner from '../components/Spinner'
import StatsCard from '../components/StatsCard'

function Dashboard() {
  const [banks, setBanks] = useState([])
  const [categories, setCategories] = useState([])
  const [severities, setSeverities] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalBanks: 0,
    regionsCount: 0,
    routedIssues: 0
  })

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true)
        
        // Fetch banks
        const banksResponse = await apiService.getBanks()
        setBanks(banksResponse.banks)
        
        // Fetch categories
        const categoriesResponse = await apiService.getCategories()
        setCategories(categoriesResponse.categories)
        
        // Fetch severities
        const severitiesResponse = await apiService.getSeverities()
        setSeverities(severitiesResponse.severities)
        
        // Set basic stats
        setStats({
          totalBanks: banksResponse.banks.length,
          regionsCount: new Set(banksResponse.banks.map(bank => bank.Region_Name)).size || 5,
          routedIssues: localStorage.getItem('routedIssues') ? 
                        parseInt(localStorage.getItem('routedIssues')) : 0
        })
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching initial data:', err)
        toast.error('Failed to load initial data. Please refresh the page.')
        setLoading(false)
      }
    }
    
    fetchInitialData()
  }, [])

  const handleSubmit = async (formData) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.routeIssue(formData)
      
      if (response.success) {
        setResult(response.result)
        
        // Update routed issues count
        const currentCount = localStorage.getItem('routedIssues') ? 
                            parseInt(localStorage.getItem('routedIssues')) : 0
        localStorage.setItem('routedIssues', currentCount + 1)
        
        setStats(prev => ({
          ...prev,
          routedIssues: currentCount + 1
        }))
      } else {
        setError(response.error || 'An error occurred while routing the issue')
        toast.error(response.error || 'Failed to route issue')
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error routing issue:', err)
      setError('Failed to connect to server. Please try again.')
      toast.error('Failed to connect to server')
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bank Contact Routing Dashboard</h1>
        <p className="text-gray-600">
          Route customer issues to the appropriate contact based on issue details.
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard 
          title="Banks in System" 
          value={stats.totalBanks} 
          icon="bank" 
          color="blue"
        />
        <StatsCard 
          title="Banking Regions" 
          value={stats.regionsCount} 
          icon="globe" 
          color="green"
        />
        <StatsCard 
          title="Issues Routed" 
          value={stats.routedIssues} 
          icon="ticket" 
          color="purple"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Routing Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Route New Issue</h2>
          {loading && !result ? (
            <div className="flex justify-center my-8">
              <Spinner />
              <p className="ml-2">Processing request...</p>
            </div>
          ) : (
            <RoutingForm 
              banks={banks} 
              categories={categories} 
              severities={severities} 
              onSubmit={handleSubmit}
              disabled={loading}
            />
          )}
        </div>
        
        {/* Result Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Routing Result</h2>
          
          {error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
              <p>{error}</p>
            </div>
          ) : loading && !result ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-400 mb-2">Submit an issue to see routing result</p>
            </div>
          ) : result ? (
            <ResultCard result={result} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-400 mb-2">Submit an issue to see routing result</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
EOL

# Create RoutingForm component
cat > src/components/RoutingForm.jsx << 'EOL'
import { useState } from 'react'

function RoutingForm({ banks, categories, severities, onSubmit, disabled }) {
  const [formData, setFormData] = useState({
    bank_id: '',
    issue_category: '',
    severity: '',
    time_sensitivity: 5
  })
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Bank
        </label>
        <select
          name="bank_id"
          value={formData.bank_id}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
          disabled={disabled}
        >
          <option value="">Choose a bank...</option>
          {banks.map(bank => (
            <option key={bank.Bank_ID} value={bank.Bank_ID}>
              {bank.Bank_Name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issue Category
        </label>
        <select
          name="issue_category"
          value={formData.issue_category}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
          disabled={disabled}
        >
          <option value="">Select issue type...</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Severity Level
        </label>
        <select
          name="severity"
          value={formData.severity}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
          disabled={disabled}
        >
          <option value="">Select severity...</option>
          {severities.map(severity => (
            <option key={severity.id} value={severity.id}>
              {severity.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Time Sensitivity (1-10)
        </label>
        <div className="flex items-center">
          <input
            type="range"
            name="time_sensitivity"
            min="1"
            max="10"
            value={formData.time_sensitivity}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={disabled}
          />
          <span className="ml-2 w-8 text-center font-medium">
            {formData.time_sensitivity}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
      
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:bg-blue-300"
        disabled={disabled}
      >
        Find Best Contact
      </button>
    </form>
  )
}

export default RoutingForm
EOL

# Create ResultCard component
cat > src/components/ResultCard.jsx << 'EOL'
import { FiUser, FiMail, FiPhone, FiCheckCircle } from 'react-icons/fi'

function ResultCard({ result }) {
  const getConfidenceColor = (confidence) => {
    if (confidence < 50) return 'bg-red-500'
    if (confidence < 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  
  return (
    <div className="border-l-4 border-blue-500 pl-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{result.bank}</h3>
        <p className="text-sm text-gray-600">
          Recommended Escalation: <span className="font-medium">{result.level_name.replace('_', ' ')}</span>
        </p>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center mb-3">
          <div className="mr-3 text-blue-500">
            <FiUser size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact Name</p>
            <p className="font-medium">{result.contact_name}</p>
          </div>
        </div>
        
        <div className="flex items-center mb-3">
          <div className="mr-3 text-blue-500">
            <FiMail size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <a 
              href={`mailto:${result.contact_email}`}
              className="font-medium text-blue-600 hover:underline"
            >
              {result.contact_email}
            </a>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="mr-3 text-blue-500">
            <FiPhone size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <a 
              href={`tel:${result.contact_phone}`}
              className="font-medium text-blue-600 hover:underline"
            >
              {result.contact_phone}
            </a>
          </div>
        </div>
      </div>
      
      <div>
        <p className="text-sm text-gray-500 mb-1">Routing Confidence</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
          <div 
            className={`h-2.5 rounded-full ${getConfidenceColor(result.confidence)}`} 
            style={{ width: `${result.confidence}%` }}
          ></div>
        </div>
        <p className="text-sm font-medium">
          {result.confidence.toFixed(1)}% 
          {result.confidence >= 75 && (
            <span className="text-green-600 inline-flex items-center ml-2">
              <FiCheckCircle className="mr-1" /> High confidence
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

export default ResultCard
EOL

# Create Spinner component
cat > src/components/Spinner.jsx << 'EOL'
function Spinner() {
  return (
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
  )
}

export default Spinner
EOL

# Create StatsCard component
cat > src/components/StatsCard.jsx << 'EOL'
import { FiBarChart2, FiGlobe, FiCreditCard, FiBriefcase, FiUsers } from 'react-icons/fi'

function StatsCard({ title, value, icon, color }) {
  const getIcon = () => {
    switch (icon) {
      case 'bank':
        return <FiBriefcase size={24} />
      case 'globe':
        return <FiGlobe size={24} />
      case 'ticket':
        return <FiCreditCard size={24} />
      case 'users':
        return <FiUsers size={24} />
      default:
        return <FiBarChart2 size={24} />
    }
  }
  
  const getColorClass = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600'
      case 'green':
        return 'bg-green-100 text-green-600'
      case 'purple':
        return 'bg-purple-100 text-purple-600'
      case 'orange':
        return 'bg-orange-100 text-orange-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-3">
        <div className={`p-3 rounded-full mr-4 ${getColorClass()}`}>
          {getIcon()}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{value.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </div>
    </div>
  )
}

export default StatsCard
EOL

# Create API service
cat > src/services/apiService.js << 'EOL'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

const apiService = {
  // Get list of banks
  getBanks: () => {
    return apiClient.get('/banks')
  },
  
  // Get list of issue categories
  getCategories: () => {
    return apiClient.get('/categories')
  },
  
  // Get list of severity levels
  getSeverities: () => {
    return apiClient.get('/severities')
  },
  
  // Route an issue to get contact information
  routeIssue: (formData) => {
    return apiClient.post('/route_issue', formData)
  }
}

export default apiService
EOL

# Create CSS file
cat > src/styles/index.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
    'Helvetica Neue', Arial, sans-serif;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}
EOL

# Create vite.config.js
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
EOL

# Create .env files
cat > .env << 'EOL'
VITE_API_URL=http://localhost:5000/api
EOL

cat > .env.production << 'EOL'
VITE_API_URL=/api
EOL

# Create tailwind.config.js
cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL

# Create postcss.config.js
cat > postcss.config.js << 'EOL'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

# Go back to project root
cd ../..

# ----- CREATE MODEL TRAINING SCRIPT -----
echo -e "\n${YELLOW}Creating model training script...${NC}"

cat > train_model.py << 'EOL'
#!/usr/bin/env python3
"""
Model Training Script for Contact Routing System

This script trains a machine learning model to predict the
appropriate escalation level for banking issues.
"""

import pandas as pd
import numpy as np
import re
import pickle
import os
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

print("Contact Routing System - Model Training")
print("=======================================")

# Check if data file exists
if not os.path.exists('WesternGridEscalationMatrix.xlsx'):
    print("Error: WesternGridEscalationMatrix.xlsx file not found.")
    print("Please place the file in the current directory and try again.")
    exit(1)

# Load data
print("\nLoading data...")
df = pd.read_excel('WesternGridEscalationMatrix.xlsx')
print(f"Loaded data with {df.shape[0]} records and {df.shape[1]} columns")

# Data preprocessing
print("\nPreprocessing data...")

# Create a clean version of the dataframe
df_clean = df.copy()

# Function to clean phone numbers
def clean_phone_number(phone):
    if pd.isna(phone):
        return np.nan
    
    phone_str = str(phone).strip()
    
    # Remove any non-digit characters
    phone_digits = re.sub(r'\D', '', phone_str)
    
    # Handle empty or invalid (like '0') phone numbers
    if not phone_digits or phone_digits == '0':
        return np.nan
    
    # Format as a 10-digit number when possible
    if len(phone_digits) > 10 and phone_digits.startswith('91'):
        return phone_digits[-10:]
    
    return phone_digits[-10:] if len(phone_digits) >= 10 else phone_digits

# Function to clean and normalize email addresses
def clean_email(email):
    if pd.isna(email):
        return np.nan
    
    email_str = str(email).strip().lower()
    
    # Simple validation - check for @ symbol
    if '@' not in email_str:
        return np.nan
    
    # Remove any commas if multiple emails
    if ',' in email_str:
        return email_str.split(',')[0].strip()
    
    return email_str

# Handle specific missing values
print("Handling missing values...")
# For single missing Bank Routing Number
if df_clean['Bank Routing Number'].isna().sum() > 0:
    most_common_prefix = str(df_clean['Bank Routing Number'].mode()[0])[:3]
    df_clean['Bank Routing Number'] = df_clean['Bank Routing Number'].fillna(
        int(most_common_prefix + '000000')
    )

# For missing email addresses and officials' names
for col in ['Mail Id2', 'Mail Id3', 'Mail Id4', 'Mail Id5']:
    if df_clean[col].isna().sum() > 0:
        previous_col = col.replace('2', '') if '2' in col else col.replace('3', '2') if '3' in col else col.replace('4', '')
        df_clean[col] = df_clean.apply(
            lambda row: row[previous_col] if pd.isna(row[col]) else row[col], 
            axis=1
        )

# Handle missing official names similarly
if df_clean['Official Name (3rd Level)'].isna().sum() > 0:
    df_clean['Official Name (3rd Level)'] = df_clean.apply(
        lambda row: row['Official Name (2nd Level)'] if pd.isna(row['Official Name (3rd Level)']) else row['Official Name (3rd Level)'],
        axis=1
    )

if df_clean['Official Name from Technology (1st Level )'].isna().sum() > 0:
    df_clean['Official Name from Technology (1st Level )'] = df_clean.apply(
        lambda row: row['Official Name (1st Level)'] if pd.isna(row['Official Name from Technology (1st Level )']) else row['Official Name from Technology (1st Level )'],
        axis=1
    )

if df_clean['Official Name from Technology (2nd Level )'].isna().sum() > 0:
    df_clean['Official Name from Technology (2nd Level )'] = df_clean.apply(
        lambda row: row['Official Name from Technology (1st Level )'] if pd.isna(row['Official Name from Technology (2nd Level )']) else row['Official Name from Technology (2nd Level )'],
        axis=1
    )

# Apply cleaning functions
phone_columns = ['Mobile Number', 'Mobile Number2', 'Mobile Number3', 
                 'Mobile Number4', 'Mobile Number5', 'Mobile Number6']

email_columns = ['Mail Id', 'Mail Id2', 'Mail Id3', 'Mail Id4', 'Mail Id5', 'Mail Id6']

for col in phone_columns:
    df_clean[col] = df_clean[col].apply(clean_phone_number)

for col in email_columns:
    df_clean[col] = df_clean[col].apply(clean_email)

# Extract region codes
print("Extracting geographic information...")
def extract_region_code(routing_number):
    if pd.isna(routing_number):
        return 'unknown'
    routing_str = str(routing_number)
    if len(routing_str) >= 3:
        return routing_str[:3]
    return 'unknown'

df_clean['Region Code'] = df_clean['Bank Routing Number'].apply(extract_region_code)

# Create a mapping of region codes to region names
region_name_mapping = {
    '400': 'Mumbai',
    '410': 'Maharashtra (excluding Mumbai)',
    '411': 'Pune',
    '413': 'Western Maharashtra',
    '416': 'Kolhapur/Sangli',
    '422': 'Nashik',
    '431': 'Aurangabad/Marathwada',
    '440': 'Nagpur/Vidarbha',
    '380': 'Ahmedabad',
    '390': 'Vadodara/Baroda',
    '395': 'Surat',
    '360': 'Rajkot',
    '370': 'Kutch',
    '396': 'South Gujarat'
}

# Map the region codes to region names
df_clean['Region Name'] = df_clean['Region Code'].map(
    lambda x: region_name_mapping.get(x, f'Other ({x})')
)

# Feature engineering
print("\nPerforming feature engineering...")

# Identify contacts that are shared across multiple levels
def is_shared_contact(row, field_type):
    if field_type == 'email':
        fields = [row['Mail Id'], row['Mail Id2'], row['Mail Id3'], 
                 row['Mail Id4'], row['Mail Id5'], row['Mail Id6']]
    else:  # phone
        fields = [row['Mobile Number'], row['Mobile Number2'], row['Mobile Number3'], 
                 row['Mobile Number4'], row['Mobile Number5'], row['Mobile Number6']]
    
    # Filter out None/NaN values
    valid_fields = [f for f in fields if not pd.isna(f)]
    
    # Check if any field is duplicated
    return len(valid_fields) != len(set(valid_fields))

df_clean['Has Shared Emails'] = df_clean.apply(lambda row: is_shared_contact(row, 'email'), axis=1)
df_clean['Has Shared Phones'] = df_clean.apply(lambda row: is_shared_contact(row, 'phone'), axis=1)

# Create flags for contact completeness
def has_complete_contacts(row, level):
    if level == 1:
        return (not pd.isna(row['Official Name (1st Level)']) and 
                not pd.isna(row['Mobile Number']) and 
                not pd.isna(row['Mail Id']))
    elif level == 2:
        return (not pd.isna(row['Official Name (2nd Level)']) and 
                not pd.isna(row['Mobile Number2']) and 
                not pd.isna(row['Mail Id2']))
    elif level == 3:
        return (not pd.isna(row['Official Name (3rd Level)']) and 
                not pd.isna(row['Mobile Number3']) and 
                not pd.isna(row['Mail Id3']))
    elif level == 4:  # Tech Level 1
        return (not pd.isna(row['Official Name from Technology (1st Level )']) and 
                not pd.isna(row['Mobile Number4']) and 
                not pd.isna(row['Mail Id4']))
    elif level == 5:  # Tech Level 2
        return (not pd.isna(row['Official Name from Technology (2nd Level )']) and 
                not pd.isna(row['Mobile Number5']) and 
                not pd.isna(row['Mail Id5']))
    elif level == 6:  # Head/GM
        return (not pd.isna(row['Official Name (Head or GM)']) and 
                not pd.isna(row['Mobile Number6']) and 
                not pd.isna(row['Mail Id6']))
    return False

for level in range(1, 7):
    df_clean[f'Complete_Level_{level}'] = df_clean.apply(
        lambda row: has_complete_contacts(row, level), axis=1
    )

# Check for generic email patterns
def is_generic_email(email):
    if pd.isna(email):
        return False
    
    generic_patterns = ['info@', 'admin@', 'contact@', 'support@', 'helpdesk@', 'email@']
    return any(pattern in email.lower() for pattern in generic_patterns)

for col in email_columns:
    df_clean[f'{col}_is_generic'] = df_clean[col].apply(is_generic_email)

# Create features for email domain types
def get_email_domain_type(email):
    if pd.isna(email):
        return 'missing'
    
    email_lower = email.lower()
    if '@gmail' in email_lower:
        return 'personal_gmail'
    elif '@yahoo' in email_lower or '@rediff' in email_lower or '@hotmail' in email_lower:
        return 'personal_other'
    else:
        return 'corporate'

for col in email_columns:
    df_clean[f'{col}_domain_type'] = df_clean[col].apply(get_email_domain_type)

# Create routing features
print("Creating routing features...")
routing_features = pd.DataFrame()
routing_features['Bank_ID'] = df_clean['Sl No']
routing_features['Bank_Name'] = df_clean['Bank Name']
routing_features['Region_Code'] = df_clean['Region Code']
routing_features['Region_Name'] = df_clean['Region Name']
routing_features['Has_Shared_Emails'] = df_clean['Has Shared Emails'].astype(int)
routing_features['Has_Shared_Phones'] = df_clean['Has Shared Phones'].astype(int)

# Count the number of complete levels for each bank
routing_features['Complete_Levels_Count'] = df_clean[[
    'Complete_Level_1', 'Complete_Level_2', 'Complete_Level_3',
    'Complete_Level_4', 'Complete_Level_5', 'Complete_Level_6'
]].sum(axis=1)

# Calculate the count of generic emails
generic_email_cols = [col for col in df_clean.columns if col.endswith('_is_generic')]
routing_features['Generic_Email_Count'] = df_clean[generic_email_cols].sum(axis=1)

# Calculate counts of corporate vs personal email domains
corporate_email_count = 0
personal_email_count = 0
for col in email_columns:
    domain_col = f'{col}_domain_type'
    corporate_email_count += (df_clean[domain_col] == 'corporate').astype(int)
    personal_email_count += ((df_clean[domain_col] == 'personal_gmail') | 
                             (df_clean[domain_col] == 'personal_other')).astype(int)

routing_features['Corporate_Email_Count'] = corporate_email_count
routing_features['Personal_Email_Count'] = personal_email_count

# Calculate email and phone completeness ratios
email_cols_count = len(email_columns)
phone_cols_count = len(phone_columns)

routing_features['Email_Completeness'] = df_clean[email_columns].notna().sum(axis=1) / email_cols_count
routing_features['Phone_Completeness'] = df_clean[phone_columns].notna().sum(axis=1) / phone_cols_count

# One-hot encode the region name
region_dummies = pd.get_dummies(routing_features['Region_Name'], prefix='Region')
routing_features = pd.concat([routing_features, region_dummies], axis=1)

# Simulate issue data for training
print("\nGenerating simulated training data...")
np.random.seed(42)  # For reproducibility

# Generate simulated issue data
n_simulated_issues = 1000

# Create issue categories
issue_categories = ['Account_Access', 'Transaction_Failure', 'Technical_Error', 
                   'Fraud_Alert', 'Customer_Service', 'Data_Sync']

# Create severity levels
severity_levels = ['Low', 'Medium', 'High', 'Critical']

# Generate random issues
simulated_issues = pd.DataFrame({
    'Bank_ID': np.random.choice(routing_features['Bank_ID'], n_simulated_issues),
    'Issue_Category': np.random.choice(issue_categories, n_simulated_issues),
    'Severity': np.random.choice(severity_levels, n_simulated_issues),
    'Time_Sensitivity': np.random.randint(1, 11, n_simulated_issues)  # Scale 1-10
})

# Determine appropriate escalation level based on category and severity
def determine_escalation_level(row):
    category = row['Issue_Category']
    severity = row['Severity']
    
    # Technical issues typically go to tech contacts
    if category in ['Technical_Error', 'Data_Sync']:
        if severity in ['High', 'Critical']:
            return 'Tech_Level_2'  # More severe tech issues go to higher tech level
        else:
            return 'Tech_Level_1'  # Less severe tech issues go to first tech level
    
    # Fraud alerts always go high in escalation
    if category == 'Fraud_Alert':
        if severity == 'Critical':
            return 'Head_GM'  # Critical fraud directly to top
        else:
            return 'Level_3'  # Other fraud to high regular level
    
    # Regular business escalation based on severity
    if severity == 'Critical':
        return 'Level_3'
    elif severity == 'High':
        return 'Level_2'
    else:  # Low or Medium
        return 'Level_1'

simulated_issues['Ideal_Escalation'] = simulated_issues.apply(determine_escalation_level, axis=1)

# Map the ideal escalation to numeric values for modeling
escalation_mapping = {
    'Level_1': 1,
    'Level_2': 2,
    'Level_3': 3,
    'Tech_Level_1': 4,
    'Tech_Level_2': 5,
    'Head_GM': 6
}

simulated_issues['Escalation_Level'] = simulated_issues['Ideal_Escalation'].map(escalation_mapping)

# Add the corresponding bank features to each issue
issue_with_features = simulated_issues.merge(
    routing_features, 
    on='Bank_ID', 
    how='left'
)

# One-hot encode the issue category and severity
category_dummies = pd.get_dummies(issue_with_features['Issue_Category'], prefix='Category')
severity_dummies = pd.get_dummies(issue_with_features['Severity'], prefix='Severity')

# Combine all features
X = pd.concat([
    issue_with_features[['Time_Sensitivity', 'Has_Shared_Emails', 'Has_Shared_Phones',
                         'Complete_Levels_Count', 'Generic_Email_Count',
                         'Corporate_Email_Count', 'Personal_Email_Count',
                         'Email_Completeness', 'Phone_Completeness']],
    category_dummies,
    severity_dummies,
    issue_with_features.iloc[:, issue_with_features.columns.get_loc('Region_Region (302)'):] # Region dummies
], axis=1)

y = issue_with_features['Escalation_Level']

# Train the model
print("\nTraining the model...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Scale the numerical features
scaler = StandardScaler()
numerical_cols = ['Time_Sensitivity', 'Complete_Levels_Count', 'Generic_Email_Count',
                 'Corporate_Email_Count', 'Personal_Email_Count',
                 'Email_Completeness', 'Phone_Completeness']

X_train[numerical_cols] = scaler.fit_transform(X_train[numerical_cols])
X_test[numerical_cols] = scaler.transform(X_test[numerical_cols])

# Train Random Forest model
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)

# Evaluate the model
print("\nEvaluating model performance...")
y_pred = rf_model.predict(X_test)
report = classification_report(y_test, y_pred, output_dict=True)

print("\nClassification Report:")
for label, metrics in report.items():
    if isinstance(metrics, dict):
        label_name = [k for k, v in escalation_mapping.items() if v == int(label)] if label.isdigit() else [label]
        if label_name:
            print(f"{label_name[0]}: Precision={metrics['precision']:.2f}, Recall={metrics['recall']:.2f}, F1-Score={metrics['f1-score']:.2f}")

# Create directories for output files
if not os.path.exists('models'):
    os.makedirs('models')
if not os.path.exists('data'):
    os.makedirs('data')

# Save model and preprocessing objects
print("\nSaving model and data files...")
with open('models/routing_model.pkl', 'wb') as file:
    pickle.dump(rf_model, file)

with open('models/feature_scaler.pkl', 'wb') as file:
    pickle.dump(scaler, file)

with open('models/feature_columns.pkl', 'wb') as file:
    pickle.dump(X.columns.tolist(), file)

df_clean.to_pickle('data/df_clean.pkl')
routing_features.to_pickle('data/routing_features.pkl')

print("\nTraining complete! Model and data files saved to models/ and data/ directories.")
print("You can now start the application.")
EOL

chmod +x train_model.py

# ----- CREATE DOCKER COMPOSE FILE -----
echo -e "\n${YELLOW}Creating Docker Compose file...${NC}"

cat > docker-compose.yml << 'EOL'
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: banking-contact-backend
    restart: always
    ports:
      - "5000:5000"
    volumes:
      - ./models:/app/models
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - FLASK_APP=app.py
      - FLASK_DEBUG=0

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: banking-contact-frontend
    restart: always
    ports:
      - "3000:80"
    depends_on:
      - backend
EOL

# Create Dockerfile for frontend
cat > frontend/Dockerfile << 'EOL'
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOL

# Create nginx.conf for frontend
cat > frontend/nginx.conf << 'EOL'
server {
    listen 80;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:5000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOL

# ----- CREATE README -----
echo -e "\n${YELLOW}Creating README file...${NC}"

cat > README.md << 'EOL'
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
EOL

# ----- CREATE START SCRIPT -----
echo -e "\n${YELLOW}Creating start script...${NC}"

cat > start.sh << 'EOL'
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
EOL

chmod +x start.sh

# ----- FINAL STEPS -----
echo -e "\n${GREEN}Setup completed successfully!${NC}"
echo -e "\nTo start the application:"
echo -e "1. Place the ${YELLOW}WesternGridEscalationMatrix.xlsx${NC} file in the project root"
echo -e "2. Run ${YELLOW}./start.sh${NC} to start the application"
echo -e "\nThe script will automatically:"
echo -e "- Train the machine learning model if needed"
echo -e "- Start both backend and frontend servers"
echo -e "- Provide you with URLs to access the application"
echo -e "\n${BLUE}Enjoy your Intelligent Contact Routing System!${NC}"