#!/usr/bin/env python3
"""
EduGuard AI - Machine Learning Model for Student Dropout Risk Prediction
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score
import joblib
import json
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_predictions_for_students(num_students=200):
    """Generate predictions for actual student IDs 1-num_students"""
    print(f"🎯 Generating predictions for {num_students} students...")

    # Generate dataset with the same IDs as our students
    students = []
    for i in range(1, num_students + 1):
        # Use the same random seed pattern as the JavaScript code
        # This ensures similar risk patterns
        random.seed(42 + i)  # Offset seed to match JS generation

        attendance = random.uniform(30, 100)
        academic_score = random.uniform(20, 100)
        grade_num = random.randint(6, 10)
        income_tier = random.choice(['BPL', 'Lower Middle', 'Middle'])
        parental_edu = random.choice(['Illiterate', 'Primary', 'Secondary', 'Higher Secondary'])
        distance_km = random.uniform(0.5, 18)
        behavioral_flags = random.randint(0, 4)

        # Calculate risk score (matching the JS logic approximately)
        risk_score = (
            (100 - attendance) * 0.3 +
            (100 - academic_score) * 0.4 +
            (0 if income_tier == 'Middle' else 15) +
            (0 if parental_edu in ['Secondary', 'Higher Secondary'] else 10) +
            min(distance_km * 2, 20) +
            behavioral_flags * 5
        )

        risk_score = min(100, max(0, risk_score))

        # Determine category
        if risk_score >= 70:
            risk_category = "Critical"
        elif risk_score >= 50:
            risk_category = "High"
        elif risk_score >= 30:
            risk_category = "Medium"
        else:
            risk_category = "Low"

        students.append({
            'id': i,
            'attendance': attendance,
            'academic_score': academic_score,
            'grade_num': grade_num,
            'income_tier': income_tier,
            'parental_education': parental_edu,
            'distance_km': distance_km,
            'behavioral_flags': behavioral_flags,
            'risk_score': risk_score,
            'risk_category': risk_category
        })

    return pd.DataFrame(students)

def preprocess_features(df):
    """Convert categorical features to numerical"""
    data = df.copy()

    # Encode categorical variables
    data['income_encoded'] = data['income_tier'].map({
        'BPL': 0, 'Lower Middle': 1, 'Middle': 2
    })
    data['parental_edu_encoded'] = data['parental_education'].map({
        'Illiterate': 0, 'Primary': 1, 'Secondary': 2, 'Higher Secondary': 3
    })

    # Select features
    feature_cols = [
        'attendance', 'academic_score', 'grade_num',
        'income_encoded', 'parental_edu_encoded',
        'distance_km', 'behavioral_flags'
    ]

    # Target: binary classification
    data['at_risk'] = data['risk_category'].isin(['Critical', 'High']).astype(int)

    return data[feature_cols], data['at_risk'], data

def train_model(X, y):
    """Train Logistic Regression model"""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LogisticRegression(random_state=42, max_iter=1000)
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]

    print("Model Performance:")
    print(classification_report(y_test, y_pred))
    print(f"AUC-ROC: {roc_auc_score(y_test, y_pred_proba):.3f}")

    return model, scaler

def generate_predictions(model, scaler, df):
    """Generate predictions for all students"""
    feature_cols = [
        'attendance', 'academic_score', 'grade_num',
        'income_encoded', 'parental_edu_encoded',
        'distance_km', 'behavioral_flags'
    ]

    X = df[feature_cols]
    X_scaled = scaler.transform(X)

    predictions = model.predict_proba(X_scaled)[:, 1]
    risk_scores = (predictions * 100).round(1)

    results = []
    for idx, row in df.iterrows():
        risk_score = float(risk_scores[idx])

        if risk_score >= 70:
            category = "Critical"
        elif risk_score >= 50:
            category = "High"
        elif risk_score >= 30:
            category = "Medium"
        else:
            category = "Low"

        results.append({
            'id': int(row['id']),
            'risk_score': risk_score,
            'risk_category': category,
            'confidence': float(predictions[idx])
        })

    return results

def generate_school_predictions(student_predictions, schools_data):
    """Generate school-level predictions by aggregating student data"""
    print("🏫 Generating school-level predictions...")

    school_predictions = []

    for school in schools_data:
        school_id = school['id']
        school_name = school['name']
        district = school['district']

        # Get all students for this school (assuming ~30-35 students per school)
        # In a real system, this would come from the database
        # For now, we'll simulate based on student IDs
        students_per_school = 32  # Average from data.js
        start_id = (school_id - 1) * students_per_school + 1
        end_id = school_id * students_per_school

        school_students = [
            pred for pred in student_predictions
            if start_id <= pred['id'] <= end_id
        ]

        if not school_students:
            continue

        # Aggregate school-level metrics
        risk_scores = [s['risk_score'] for s in school_students]
        avg_risk_score = sum(risk_scores) / len(risk_scores)

        # Count risk categories
        critical_count = sum(1 for s in school_students if s['risk_category'] == 'Critical')
        high_count = sum(1 for s in school_students if s['risk_category'] == 'High')
        medium_count = sum(1 for s in school_students if s['risk_category'] == 'Medium')
        low_count = sum(1 for s in school_students if s['risk_category'] == 'Low')

        # School risk category based on critical student percentage
        critical_percentage = critical_count / len(school_students)
        if critical_percentage >= 0.5:
            school_risk_category = "Critical"
        elif critical_percentage >= 0.3:
            school_risk_category = "High"
        elif critical_percentage >= 0.15:
            school_risk_category = "Medium"
        else:
            school_risk_category = "Low"

        # School-level confidence (average of student confidences)
        avg_confidence = sum(s['confidence'] for s in school_students) / len(school_students)

        school_predictions.append({
            'id': school_id,
            'name': school_name,
            'district': district,
            'total_students': len(school_students),
            'avg_risk_score': round(avg_risk_score, 1),
            'risk_category': school_risk_category,
            'critical_students': critical_count,
            'high_students': high_count,
            'medium_students': medium_count,
            'low_students': low_count,
            'critical_percentage': round(critical_percentage * 100, 1),
            'confidence': round(avg_confidence, 3),
            'latitude': school.get('lat', 0),
            'longitude': school.get('lng', 0)
        })

    return school_predictions

def main():
    print("🚀 EduGuard AI - ML Model Training")

    # Generate dataset for actual students
    print("📊 Generating student dataset...")
    df = generate_predictions_for_students(200)  # Generate for IDs 1-200
    print(f"Generated {len(df)} student records")

    # Preprocess
    print("🔧 Preprocessing features...")
    X, y, df_processed = preprocess_features(df)

    # Train model
    print("🤖 Training Logistic Regression model...")
    model, scaler = train_model(X, y)

    # Generate predictions
    print("🔮 Generating predictions...")
    student_predictions = generate_predictions(model, scaler, df_processed)

    # Define schools data (matching data.js)
    schools_data = [
        { 'id': 1, 'name': "Govt. High School, Rampur", 'district': "Rampur", 'lat': 28.81, 'lng': 79.01 },
        { 'id': 2, 'name': "Govt. Sr. Sec. School, Tilak Nagar", 'district': "Bareilly", 'lat': 28.37, 'lng': 79.42 },
        { 'id': 3, 'name': "Govt. Middle School, Faizabad Road", 'district': "Lucknow", 'lat': 26.85, 'lng': 81.00 },
        { 'id': 4, 'name': "Govt. High School, Sonbhadra", 'district': "Sonbhadra", 'lat': 24.68, 'lng': 83.07 },
        { 'id': 5, 'name': "Govt. Composite School, Jhansi", 'district': "Jhansi", 'lat': 25.44, 'lng': 78.57 },
    ]

    # Generate school predictions
    school_predictions = generate_school_predictions(student_predictions, schools_data)

    # Save model and predictions
    print("💾 Saving model and predictions...")
    joblib.dump(model, 'ml_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')

    with open('student_predictions.json', 'w') as f:
        json.dump(student_predictions, f, indent=2)

    with open('school_predictions.json', 'w') as f:
        json.dump(school_predictions, f, indent=2)

    print("✅ Model training complete!")
    print(f"📁 Files saved: ml_model.pkl, scaler.pkl, student_predictions.json, school_predictions.json")

    # Summary
    categories = {}
    for pred in student_predictions:
        cat = pred['risk_category']
        categories[cat] = categories.get(cat, 0) + 1

    print("\n📈 Student Risk Distribution:")
    for cat, count in sorted(categories.items()):
        pct = (count / len(student_predictions)) * 100
        print(f"{cat}: {count} students ({pct:.1f}%)")

    print("\n🏫 School Risk Summary:")
    for school in school_predictions:
        print(f"{school['name']} ({school['district']}): {school['risk_category']} - {school['critical_percentage']}% critical students")

if __name__ == "__main__":
    main()