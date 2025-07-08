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
# First, define region_cols outside of pd.concat
region_cols = [col for col in issue_with_features.columns if col.startswith('Region_')]

# Then, use it inside pd.concat
X = pd.concat([
    issue_with_features[['Time_Sensitivity', 'Has_Shared_Emails', 'Has_Shared_Phones',
                         'Complete_Levels_Count', 'Generic_Email_Count',
                         'Corporate_Email_Count', 'Personal_Email_Count',
                         'Email_Completeness', 'Phone_Completeness']],
    category_dummies,
    severity_dummies,
    issue_with_features[region_cols]
], axis=1)


y = issue_with_features['Escalation_Level']
# Ensure all features are numeric

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
X_train = X_train.apply(pd.to_numeric, errors='coerce')
X_test = X_test.apply(pd.to_numeric, errors='coerce')

# Optional: Check for any remaining NaNs
if X_train.isnull().any().any() or X_test.isnull().any().any():
    print("Warning: NaNs found after type conversion. Filling with 0.")
    X_train = X_train.fillna(0)
    X_test = X_test.fillna(0)

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
