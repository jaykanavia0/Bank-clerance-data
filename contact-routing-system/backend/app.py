from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import pickle
import os
import logging
from logging.handlers import RotatingFileHandler

# Configure app - Modified for single service deployment
app = Flask(__name__, static_folder='../frontend/build', static_url_path='')

# CORS configuration - Updated for single service
CORS(app, 
     origins=[
         'https://your-app-name.onrender.com',  # Update with your actual Render URL
         'http://localhost:3000', 
         'http://localhost:5173'
     ],
     supports_credentials=False)

# Configure logging
if not os.path.exists('logs'):
    os.mkdir('logs')

file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s'
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
sebi_data = None

# Issue categories and severity levels for banks
issue_categories = ['Account_Access', 'Transaction_Failure', 'Technical_Error', 
                   'Fraud_Alert', 'Customer_Service', 'Data_Sync']

severity_levels = ['Low', 'Medium', 'High', 'Critical']

# SEBI issue categories
sebi_categories = ['Investment_Advisory', 'Portfolio_Management', 'Research_Analysis', 
                  'Compliance_Issues', 'Client_Grievances', 'Regulatory_Matters']

# Escalation level mapping for banks
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

def load_bank_data():
    """Load bank model and data"""
    global routing_model, scaler, feature_columns, df_clean, routing_features
    
    try:
        app.logger.info("Loading bank model and data...")
        
        # Check if files exist before loading
        model_files = [
            'models/routing_model.pkl',
            'models/feature_scaler.pkl', 
            'models/feature_columns.pkl',
            'data/df_clean.pkl',
            'data/routing_features.pkl'
        ]
        
        missing_files = [f for f in model_files if not os.path.exists(f)]
        if missing_files:
            app.logger.warning(f"Missing bank data files: {missing_files}")
            return False
        
        # Load the model
        with open('models/routing_model.pkl', 'rb') as file:
            routing_model = pickle.load(file)
        
        # Load the scaler
        with open('models/feature_scaler.pkl', 'rb') as file:
            scaler = pickle.load(file)
        
        # Load feature columns
        with open('models/feature_columns.pkl', 'rb') as file:
            feature_columns = pickle.load(file)
        
        # Load the cleaned data
        df_clean = pd.read_pickle('data/df_clean.pkl')
        routing_features = pd.read_pickle('data/routing_features.pkl')
        
        app.logger.info("Bank model and data loaded successfully")
        return True
        
    except Exception as e:
        app.logger.error(f"Error loading bank model and data: {str(e)}")
        return False

def load_sebi_data():
    """Load and process SEBI data"""
    global sebi_data
    
    try:
        app.logger.info("Loading SEBI data...")
        
        # Check if SEBI data file exists
        sebi_file = 'data/SEBI_DATA.xlsx'
        if not os.path.exists(sebi_file):
            # Try alternative paths
            alt_paths = ['SEBI_DATA.xlsx', 'SEBI DATA.xlsx', 'data/SEBI DATA.xlsx']
            sebi_file = None
            for path in alt_paths:
                if os.path.exists(path):
                    sebi_file = path
                    break
            
            if not sebi_file:
                app.logger.warning("SEBI data file not found")
                return False
        
        # Read the Excel file
        df = pd.read_excel(sebi_file, sheet_name=0, header=1)
        
        # Clean column names - handle the actual column structure
        expected_cols = 20  # Based on your data analysis
        if len(df.columns) >= expected_cols:
            df.columns = ['Name', 'Registration_No', 'Contact_Person', 
                         'Address_1', 'Email_1', 'Telephone_1', 'Fax_1', 
                         'City_1', 'State_1', 'Pincode_1',
                         'Address_2', 'Email_2', 'Telephone_2', 'Fax_2',
                         'City_2', 'State_2', 'Pincode_2',
                         'From_Date', 'To_Date', 'Country']
        else:
            # Fallback: use first few columns with generic names
            app.logger.warning(f"Unexpected number of columns: {len(df.columns)}")
            df.columns = [f'Col_{i}' for i in range(len(df.columns))]
            # Map to expected names for first few columns
            col_mapping = {
                'Col_0': 'Name',
                'Col_1': 'Registration_No', 
                'Col_2': 'Contact_Person',
                'Col_3': 'Address_1',
                'Col_4': 'Email_1',
                'Col_5': 'Telephone_1'
            }
            df = df.rename(columns=col_mapping)
        
        # Add ID column
        df['SEBI_ID'] = range(1, len(df) + 1)
        
        # Clean data
        df = df.fillna('')
        
        # Remove rows where Name is empty
        df = df[df['Name'].astype(str).str.strip() != '']
        
        # Remove header rows that might have been included
        df = df[~df['Name'].astype(str).str.contains('Registered Portfolio Managers', na=False)]
        
        sebi_data = df
        app.logger.info(f"Loaded {len(df)} SEBI Portfolio Managers")
        return True
        
    except Exception as e:
        app.logger.error(f"Error loading SEBI data: {str(e)}")
        return False

# Load data before first request
@app.before_request
def load_all_data():
    global routing_model, scaler, feature_columns, df_clean, routing_features, sebi_data
    
    # Load bank data if not already loaded
    if routing_model is None:
        load_bank_data()
    
    # Load SEBI data if not already loaded
    if sebi_data is None:
        load_sebi_data()

# ============================================================================
# GENERAL API ENDPOINTS
# ============================================================================

@app.route('/api/test', methods=['GET'])
def test():
    """Simple endpoint to test connectivity"""
    return jsonify({
        'success': True,
        'message': 'Backend API is working!',
        'services': {
            'bank_data': df_clean is not None,
            'sebi_data': sebi_data is not None,
            'routing_model': routing_model is not None
        }
    })

# ============================================================================
# BANK API ENDPOINTS (Original functionality)
# ============================================================================

@app.route('/api/banks', methods=['GET'])
def get_banks():
    """Get list of banks"""
    try:
        if routing_features is None:
            return jsonify({
                'success': False,
                'error': 'Bank data not loaded. Please check data files.'
            }), 500
            
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
    try:
        categories = [{'id': cat, 'name': cat.replace('_', ' ')} for cat in issue_categories]
        return jsonify({
            'success': True,
            'categories': categories
        })
    except Exception as e:
        app.logger.error(f"Error retrieving categories: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/severities', methods=['GET'])
def get_severities():
    """Get list of severity levels"""
    try:
        severities = [{'id': sev, 'name': sev} for sev in severity_levels]
        return jsonify({
            'success': True,
            'severities': severities
        })
    except Exception as e:
        app.logger.error(f"Error retrieving severities: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/route_issue', methods=['POST'])
def route_issue():
    """Route an issue to the appropriate contact based on rule-based logic"""
    try:
        # Log the received request
        data = request.json
        app.logger.info(f"Received routing request: {data}")
        
        # Get form data
        bank_id = int(data.get('bank_id'))
        issue_category = data.get('issue_category')
        severity = data.get('severity')
        
        # Load data if not already loaded
        global df_clean
        if df_clean is None:
            if not load_bank_data():
                return jsonify({
                    'success': False,
                    'error': "Could not load bank data"
                }), 500
        
        # Get the bank data
        bank_data_rows = df_clean[df_clean['Sl No'] == bank_id]
        if len(bank_data_rows) == 0:
            return jsonify({
                'success': False,
                'error': f"No contact data found for bank ID {bank_id}"
            }), 404
        
        bank_data = bank_data_rows.iloc[0]
        
        # Rule-based routing logic (same as in the training model)
        if issue_category in ['Technical_Error', 'Data_Sync']:
            if severity in ['High', 'Critical']:
                level_name = 'Tech_Level_2'
            else:
                level_name = 'Tech_Level_1'
        elif issue_category == 'Fraud_Alert':
            if severity == 'Critical':
                level_name = 'Head_GM'
            else:
                level_name = 'Level_3'
        elif severity == 'Critical':
            level_name = 'Level_3'
        elif severity == 'High':
            level_name = 'Level_2'
        else:  # Low or Medium
            level_name = 'Level_1'
            
        # Determine contact info based on level
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
                
            # Handle missing values
            contact_name = str(contact_name) if not pd.isna(contact_name) else "Not Available"
            contact_phone = str(contact_phone) if not pd.isna(contact_phone) else "Not Available"
            contact_email = str(contact_email) if not pd.isna(contact_email) else "Not Available"
            
            # Simulate a confidence level (can be fixed or based on severity)
            if severity == 'Critical':
                confidence = 95.0
            elif severity == 'High':
                confidence = 85.0
            elif severity == 'Medium':
                confidence = 75.0
            else:
                confidence = 65.0
                
            return jsonify({
                'success': True,
                'result': {
                    'bank': str(bank_data['Bank Name']),
                    'level_name': level_name,
                    'contact_name': contact_name,
                    'contact_phone': contact_phone,
                    'contact_email': contact_email,
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

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    """Get contacts filtered by position"""
    try:
        position = request.args.get('position', 'all')
        
        # Load data if not already loaded
        global df_clean
        if df_clean is None:
            if not load_bank_data():
                return jsonify({
                    'success': False,
                    'error': "Could not load bank data"
                }), 500
        
        # Create mapping of positions to column names
        position_mapping = {
            'gm_head': 'Official Name (Head or GM)',
            'level1': 'Official Name (1st Level)',
            'level2': 'Official Name (2nd Level)',
            'level3': 'Official Name (3rd Level)',
            'tech_level1': 'Official Name from Technology (1st Level )',
            'tech_level2': 'Official Name from Technology (2nd Level )'
        }
        
        # Default to all positions if invalid position provided
        if position not in position_mapping and position != 'all':
            position = 'all'
            
        # Prepare response data
        contacts = []
        
        # Filter by position or get all positions
        if position == 'all':
            # Get contacts from all positions
            for pos, column in position_mapping.items():
                contacts.extend(get_contacts_by_column(df_clean, column, pos))
        else:
            # Get contacts for specified position
            column = position_mapping[position]
            contacts.extend(get_contacts_by_column(df_clean, column, position))
            
        return jsonify({
            'success': True,
            'contacts': contacts
        })
        
    except Exception as e:
        app.logger.error(f"Error retrieving contacts: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def get_contacts_by_column(df, name_column, position_type):
    """Helper function to extract contacts by column name"""
    contacts = []
    
    # Map columns to get corresponding email and phone
    email_column_map = {
        'Official Name (1st Level)': 'Mail Id',
        'Official Name (2nd Level)': 'Mail Id2',
        'Official Name (3rd Level)': 'Mail Id3',
        'Official Name from Technology (1st Level )': 'Mail Id4',
        'Official Name from Technology (2nd Level )': 'Mail Id5',
        'Official Name (Head or GM)': 'Mail Id6'
    }
    
    phone_column_map = {
        'Official Name (1st Level)': 'Mobile Number',
        'Official Name (2nd Level)': 'Mobile Number2',
        'Official Name (3rd Level)': 'Mobile Number3',
        'Official Name from Technology (1st Level )': 'Mobile Number4',
        'Official Name from Technology (2nd Level )': 'Mobile Number5',
        'Official Name (Head or GM)': 'Mobile Number6'
    }
    
    email_column = email_column_map.get(name_column)
    phone_column = phone_column_map.get(name_column)
    
    # Get display name for the position type
    position_display = {
        'gm_head': 'GM/Head',
        'level1': 'Level 1 Official',
        'level2': 'Level 2 Official',
        'level3': 'Level 3 Official',
        'tech_level1': 'Technical Level 1',
        'tech_level2': 'Technical Level 2'
    }.get(position_type, position_type)
    
    # Extract contacts
    for _, row in df.iterrows():
        if pd.notna(row[name_column]) and row[name_column] != '':
            contact = {
                'bank_id': int(row['Sl No']),
                'bank_name': row['Bank Name'],
                'name': str(row[name_column]),
                'position': position_display,
                'position_type': position_type,
                'email': str(row[email_column]) if pd.notna(row[email_column]) else '',
                'phone': str(row[phone_column]) if pd.notna(row[phone_column]) else ''
            }
            contacts.append(contact)
            
    return contacts

# ============================================================================
# SEBI API ENDPOINTS (New functionality)
# ============================================================================

@app.route('/api/sebi/entities', methods=['GET'])
def get_sebi_entities():
    """Get list of SEBI registered entities"""
    try:
        if sebi_data is None:
            if not load_sebi_data():
                return jsonify({
                    'success': False,
                    'error': 'SEBI data not loaded. Please check if SEBI_DATA.xlsx exists.'
                }), 500
        
        # Get query parameters
        search = request.args.get('search', '').lower()
        state = request.args.get('state', '')
        city = request.args.get('city', '')
        
        # Filter data
        filtered_data = sebi_data.copy()
        
        if search:
            # Handle case where columns might not exist
            name_col = 'Name' if 'Name' in filtered_data.columns else filtered_data.columns[0]
            reg_col = 'Registration_No' if 'Registration_No' in filtered_data.columns else filtered_data.columns[1]
            
            filtered_data = filtered_data[
                filtered_data[name_col].astype(str).str.lower().str.contains(search, na=False) |
                filtered_data[reg_col].astype(str).str.lower().str.contains(search, na=False)
            ]
        
        if state and 'State_1' in filtered_data.columns:
            filtered_data = filtered_data[
                (filtered_data['State_1'].astype(str).str.upper() == state.upper()) |
                (filtered_data.get('State_2', pd.Series()).astype(str).str.upper() == state.upper())
            ]
            
        if city and 'City_1' in filtered_data.columns:
            filtered_data = filtered_data[
                (filtered_data['City_1'].astype(str).str.upper() == city.upper()) |
                (filtered_data.get('City_2', pd.Series()).astype(str).str.upper() == city.upper())
            ]
        
        # Prepare response
        entities = []
        for _, row in filtered_data.iterrows():
            # Handle different column structures gracefully
            entity = {
                'sebi_id': int(row.get('SEBI_ID', row.name + 1)),
                'name': str(row.get('Name', row.iloc[0] if len(row) > 0 else '')),
                'registration_no': str(row.get('Registration_No', row.iloc[1] if len(row) > 1 else '')),
                'contact_person': str(row.get('Contact_Person', row.iloc[2] if len(row) > 2 else '')),
                'primary_contact': {
                    'address': str(row.get('Address_1', row.iloc[3] if len(row) > 3 else '')),
                    'email': str(row.get('Email_1', row.iloc[4] if len(row) > 4 else '')),
                    'telephone': str(row.get('Telephone_1', row.iloc[5] if len(row) > 5 else '')),
                    'city': str(row.get('City_1', row.iloc[7] if len(row) > 7 else '')),
                    'state': str(row.get('State_1', row.iloc[8] if len(row) > 8 else '')),
                    'pincode': str(row.get('Pincode_1', row.iloc[9] if len(row) > 9 else ''))
                },
                'secondary_contact': {
                    'address': str(row.get('Address_2', row.iloc[10] if len(row) > 10 else '')),
                    'email': str(row.get('Email_2', row.iloc[11] if len(row) > 11 else '')),
                    'telephone': str(row.get('Telephone_2', row.iloc[12] if len(row) > 12 else '')),
                    'city': str(row.get('City_2', row.iloc[14] if len(row) > 14 else '')),
                    'state': str(row.get('State_2', row.iloc[15] if len(row) > 15 else '')),
                    'pincode': str(row.get('Pincode_2', row.iloc[16] if len(row) > 16 else ''))
                } if row.get('Address_2', '') else None,
                'from_date': str(row.get('From_Date', row.iloc[17] if len(row) > 17 else '')),
                'to_date': str(row.get('To_Date', row.iloc[18] if len(row) > 18 else ''))
            }
            entities.append(entity)
        
        return jsonify({
            'success': True,
            'entities': entities,
            'total': len(entities)
        })
        
    except Exception as e:
        app.logger.error(f"Error retrieving SEBI entities: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/sebi/categories', methods=['GET'])
def get_sebi_categories():
    """Get SEBI issue categories"""
    try:
        categories = [{'id': cat.replace(' ', '_'), 'name': cat.replace('_', ' ')} for cat in sebi_categories]
        return jsonify({
            'success': True,
            'categories': categories
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/sebi/route', methods=['POST'])
def route_sebi_issue():
    """Route SEBI-related issues"""
    try:
        data = request.json
        sebi_id = int(data.get('sebi_id'))
        issue_category = data.get('issue_category')
        severity = data.get('severity')
        
        if sebi_data is None:
            if not load_sebi_data():
                return jsonify({
                    'success': False,
                    'error': 'SEBI data not loaded'
                }), 500
            
        # Get entity data
        entity_data = sebi_data[sebi_data['SEBI_ID'] == sebi_id]
        if len(entity_data) == 0:
            return jsonify({
                'success': False,
                'error': f"No SEBI entity found with ID {sebi_id}"
            }), 404
            
        entity = entity_data.iloc[0]
        
        # SEBI routing logic based on issue type and severity
        if issue_category in ['Compliance_Issues', 'Regulatory_Matters']:
            # Use contact person for regulatory issues
            contact_person = entity.get('Contact_Person', '')
            if contact_person and str(contact_person).strip():
                contact_name = str(contact_person)
                contact_email = entity.get('Email_1', '') or entity.get('Email_2', '')
                contact_phone = entity.get('Telephone_1', '') or entity.get('Telephone_2', '')
                route_type = 'Compliance Contact'
            else:
                contact_name = "General Contact"
                contact_email = entity.get('Email_1', '') or entity.get('Email_2', '')
                contact_phone = entity.get('Telephone_1', '') or entity.get('Telephone_2', '')
                route_type = 'General Contact'
        else:
            # For other issues, use available contact info
            contact_person = entity.get('Contact_Person', '')
            contact_name = str(contact_person) if contact_person and str(contact_person).strip() else "General Contact"
            contact_email = entity.get('Email_1', '') or entity.get('Email_2', '')
            contact_phone = entity.get('Telephone_1', '') or entity.get('Telephone_2', '')
            route_type = 'Customer Service'
        
        # Determine confidence based on data availability
        confidence = 70.0
        if contact_person and str(contact_person).strip() and contact_email:
            confidence = 90.0
        elif contact_email:
            confidence = 80.0
            
        return jsonify({
            'success': True,
            'result': {
                'entity_name': str(entity.get('Name', '')),
                'registration_no': str(entity.get('Registration_No', '')),
                'route_type': route_type,
                'contact_name': str(contact_name),
                'contact_email': str(contact_email) if contact_email else "Not Available",
                'contact_phone': str(contact_phone) if contact_phone else "Not Available",
                'confidence': confidence
            }
        })
        
    except Exception as e:
        app.logger.error(f"Error in SEBI routing: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/sebi/states', methods=['GET'])
def get_sebi_states():
    """Get unique states from SEBI data"""
    try:
        if sebi_data is None:
            if not load_sebi_data():
                return jsonify({
                    'success': False,
                    'error': 'SEBI data not loaded'
                }), 500
            
        states = set()
        if 'State_1' in sebi_data.columns:
            states.update(sebi_data['State_1'].dropna().astype(str).unique())
        if 'State_2' in sebi_data.columns:
            states.update(sebi_data['State_2'].dropna().astype(str).unique())
        
        states = sorted([s for s in states if s and s.strip() and s != 'nan'])
        
        return jsonify({
            'success': True,
            'states': states
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# STATIC FILE SERVING (for React app)
# ============================================================================

@app.route('/')
def serve_react():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # First check if it's an API route
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Check if the file exists in the static folder
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        # For client-side routing, serve index.html
        return send_from_directory(app.static_folder, 'index.html')
# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'error': 'Bad request'
    }), 400

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'services': {
            'bank_data': df_clean is not None,
            'sebi_data': sebi_data is not None,
            'routing_model': routing_model is not None
        },
        'version': '1.0.0'
    })

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    # Load initial data
    app.logger.info("Starting application...")
    load_bank_data()
    load_sebi_data()
    
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(
        debug=debug_mode, 
        host='0.0.0.0', 
        port=port
    )