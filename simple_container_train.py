#!/usr/bin/env python3
"""
Simplified Model Training Script for Contact Routing System
"""
import pandas as pd
import numpy as np
import pickle
import os
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

print("Contact Routing System - Model Training (Simplified)")
print("=======================================")

# Check if data file exists
if not os.path.exists('WesternGridEscalationMatrix.xlsx'):
    print("Error: WesternGridEscalationMatrix.xlsx file not found.")
    exit(1)

# Load data
print("\nLoading data...")
df = pd.read_excel('WesternGridEscalationMatrix.xlsx')
print(f"Loaded data with {df.shape[0]} records and {df.shape[1]} columns")

# Basic cleaning - handle missing values
df_clean = df.copy()
df_clean = df_clean.fillna('')

# Create directories for output files
if not os.path.exists('models'):
    os.makedirs('models')
if not os.path.exists('data'):
    os.makedirs('data')

# Create simple routing features
print("\nCreating basic routing features...")
routing_features = pd.DataFrame()
routing_features['Bank_ID'] = df_clean['Sl No']
routing_features['Bank_Name'] = df_clean['Bank Name']

# Extract basic region info
print("\nExtracting region codes...")
def extract_region_code(routing_number):
    if not routing_number:
        return 'unknown'
    routing_str = str(routing_number)
    if len(routing_str) >= 3:
        return routing_str[:3]
    return 'unknown'

routing_features['Region_Code'] = df_clean['Bank Routing Number'].apply(extract_region_code)

# Create mock training data
print("\nGenerating training data...")
np.random.seed(42)
n_samples = 1000

# Issue categories and levels
issue_categories = ['Account_Access', 'Transaction_Failure', 'Technical_Error', 
                   'Fraud_Alert', 'Customer_Service', 'Data_Sync']
severity_levels = ['Low', 'Medium', 'High', 'Critical']

# Create training data with one-hot encoding
X_data = pd.DataFrame({
    'Bank_ID': np.random.choice(routing_features['Bank_ID'], n_samples),
    'Issue_Category': np.random.choice(issue_categories, n_samples),
    'Severity': np.random.choice(severity_levels, n_samples),
    'Time_Sensitivity': np.random.randint(1, 11, n_samples)
})

# One-hot encode categorical features
X = pd.get_dummies(X_data, columns=['Issue_Category', 'Severity'])

# Add region codes with one-hot encoding
region_encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
region_codes = region_encoder.fit_transform(routing_features[['Region_Code']])
region_feature_names = [f"Region_{code}" for code in region_encoder.categories_[0]]

# Train a target for 6 escalation levels
y = np.zeros(n_samples)
for i in range(n_samples):
    category = X_data.loc[i, 'Issue_Category']
    severity = X_data.loc[i, 'Severity']
    
    if category in ['Technical_Error', 'Data_Sync']:
        y[i] = 4 if severity in ['Low', 'Medium'] else 5
    elif category == 'Fraud_Alert':
        y[i] = 6 if severity == 'Critical' else 3
    elif severity == 'Critical':
        y[i] = 3
    elif severity == 'High':
        y[i] = 2
    else:
        y[i] = 1

print("\nTraining model...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Scale time sensitivity
scaler = StandardScaler()
X_train['Time_Sensitivity'] = scaler.fit_transform(X_train[['Time_Sensitivity']])
X_test['Time_Sensitivity'] = scaler.transform(X_test[['Time_Sensitivity']])

# Train a simpler Random Forest model
rf_model = RandomForestClassifier(n_estimators=50, random_state=42)
rf_model.fit(X_train, y_train)

# Save model and required data
print("\nSaving model and data files...")
with open('models/routing_model.pkl', 'wb') as file:
    pickle.dump(rf_model, file)

with open('models/feature_scaler.pkl', 'wb') as file:
    pickle.dump(scaler, file)

with open('models/feature_columns.pkl', 'wb') as file:
    pickle.dump(X.columns.tolist(), file)

# Save minimal cleaned data for the backend
df_clean.to_pickle('data/df_clean.pkl')
routing_features.to_pickle('data/routing_features.pkl')

# Save region encoder for backend use
with open('models/region_encoder.pkl', 'wb') as file:
    pickle.dump(region_encoder, file)

print("\nTraining complete! Model and data files saved to models/ and data/ directories.")
