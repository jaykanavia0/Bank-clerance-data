#!/usr/bin/env python3
import pandas as pd
import numpy as np
import pickle
import os
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

print("Loading data...")
df = pd.read_excel('WesternGridEscalationMatrix.xlsx')

# Basic cleaning
df_clean = df.fillna('')

# Create simple features
features = pd.DataFrame()
features['Bank_ID'] = df_clean['Sl No']
features['Bank_Name'] = df_clean['Bank Name']

# Save cleaned data
if not os.path.exists('data'):
    os.makedirs('data')
if not os.path.exists('models'):
    os.makedirs('models')

# Create simple synthetic training data
print("Creating synthetic data...")
np.random.seed(42)
n_samples = 1000

issue_categories = ['Account_Access', 'Transaction_Failure', 'Technical_Error', 
                    'Fraud_Alert', 'Customer_Service', 'Data_Sync']
severity_levels = ['Low', 'Medium', 'High', 'Critical']

X = pd.DataFrame({
    'Issue_Category': np.random.choice(issue_categories, n_samples),
    'Severity': np.random.choice(severity_levels, n_samples),
    'Time_Sensitivity': np.random.randint(1, 11, n_samples)
})

# Target will be 1-6 representing escalation levels
y = np.zeros(n_samples)
for i in range(n_samples):
    category = X.loc[i, 'Issue_Category']
    severity = X.loc[i, 'Severity']
    
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

# Convert categories to one-hot encoding
X = pd.get_dummies(X)

# Train a model
print("Training model...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

scaler = StandardScaler()
numerical_cols = ['Time_Sensitivity']
X_train[numerical_cols] = scaler.fit_transform(X_train[numerical_cols])
X_test[numerical_cols] = scaler.transform(X_test[numerical_cols])

model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Save model and data
print("Saving model and data...")
df_clean.to_pickle('data/df_clean.pkl')
features.to_pickle('data/routing_features.pkl')

with open('models/routing_model.pkl', 'wb') as f:
    pickle.dump(model, f)
    
with open('models/feature_scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
    
with open('models/feature_columns.pkl', 'wb') as f:
    pickle.dump(X.columns.tolist(), f)

print("Done! Model and data files created successfully.")