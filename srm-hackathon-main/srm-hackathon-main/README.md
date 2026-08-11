# EduGuard AI — Early Warning System for Student Dropout Risk

EduGuard AI is a modern, AI-powered web application designed to help schools, teachers, and government officials monitor, predict, and prevent student dropout. It combines machine learning, actionable recommendations, and data-driven dashboards to enable timely interventions and support for at-risk students.

## Features

- **ML-Powered Dropout Risk Prediction**: Uses real or mock ML models to assess each student's risk of dropping out, with explainable factors.
- **Personalized Intervention Engine**: Suggests actionable steps (tutoring, counseling, financial aid, transport, etc.) for each at-risk student.
- **Parent Engagement Module**: Sends alerts to parents in their local language (English, Hindi, Tamil) with simple, actionable advice.
- **School & District Dashboards**: Visualizes risk distribution, trends, and intervention status across schools and grades.
- **Gamified Student Dashboard**: Tracks attendance streaks, improvement badges, and motivational messages for students.
- **Mentor Matching**: Pairs at-risk students with peer mentors or alumni who overcame similar challenges.
- **Community Resource Integration**: Links students to local government schemes (scholarships, meals, transport).
- **Explainable AI Insights**: Shows teachers why a student is at risk (e.g., "Low attendance + declining math scores").
- **Predictive Simulation**: Lets teachers simulate "what if" scenarios to see how interventions could reduce risk.
- **Multi-language & Accessibility**: Supports local languages and is designed for inclusivity.

## Quick Start

1. **Clone or Download** this repository to your local machine.
2. **Open `index.html`** in your browser. No server required for demo/testing.
3. **Explore the App**:
   - Dashboard: See risk KPIs and trends.
   - Students: View, filter, and manage student records.
   - Schools: Add schools (random or manual), see school-level risk.
   - Interventions: Track and manage support actions.
   - Analytics: Visualize risk by grade, school, and more.
   - Reports: Export data for offline use.
4. **ML Integration**: The app uses a pre-generated `student_predictions.json` and `school_predictions.json` for risk scores. You can retrain the ML model using `ml_model.py` (Python, scikit-learn).

## Demo Credentials
- No login required by default. (Optional teacher login can be enabled.)

## File Structure
- `index.html` — Main app UI
- `app.js` — SPA logic, event handlers, and UI rendering
- `data.js` — Student and school data generation
- `risk-engine.js` — Risk scoring, ML integration, recommendations
- `charts.js` — Chart.js visualizations
- `ml_model.py` — Python script for ML model training and prediction
- `student_predictions.json` — ML risk predictions for students
- `school_predictions.json` — ML risk predictions for schools
- `styles.css` — App styling

## Customization
- **Add Schools/Students**: Use the Schools tab to add new schools (random or manual). Students are generated automatically.
- **Edit Recommendations**: Update `generateRecommendations()` in `risk-engine.js` to customize intervention logic.
- **ML Model**: Edit and run `ml_model.py` to retrain or adjust the risk prediction model.

## Requirements
- Modern web browser (Chrome, Edge, Firefox, etc.)
- Python 3.8+ (only for ML model retraining)

## Credits
- Built with Chart.js, jsPDF, and scikit-learn.
- Designed for educational and demonstration purposes.

## License
MIT License. Free to use, modify, and distribute.
