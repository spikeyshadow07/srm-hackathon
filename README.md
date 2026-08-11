<div align="center">

# 🛡️ EduGuard AI

### Early Warning System for Student Dropout Prevention

*An AI-powered platform for government schools to identify, monitor, and support students at risk of dropping out.*

[![Made with HTML](https://img.shields.io/badge/Made%20with-HTML%2FJS%2FCSS-blue?style=flat-square)](#)
[![ML Model](https://img.shields.io/badge/ML-scikit--learn-orange?style=flat-square)](#)
[![Chart.js](https://img.shields.io/badge/Charts-Chart.js-ff6384?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#license)

</div>

---

## 📖 Overview

**EduGuard AI** is a district-level early warning system built for the Ministry of Education. It uses a weighted multi-factor risk model — backed by a trained scikit-learn ML model — to flag students at risk of dropping out before it happens. Teachers, administrators, and district officials get a unified dashboard with real-time risk analytics, actionable intervention recommendations, and detailed reports.

> Built for the **SRM Hackathon** as a demonstration of AI in public-sector education.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Live Risk Dashboard** | KPI cards, risk distribution donut, trend charts, and per-school bar charts update dynamically |
| 🔴 **Multi-Level Risk Alerts** | Students classified as Critical / High / Medium / Low based on 6 risk dimensions |
| 🤖 **AI Chatbot Assistant** | Floating chatbot widget with a 16-topic knowledge base for instant insights without navigating menus |
| 🧠 **ML Risk Engine** | Trained scikit-learn model (Logistic Regression) with a weighted multi-factor scoring fallback |
| 👥 **Student Directory** | Searchable, sortable, filterable table with pagination and per-student profile pages |
| 📈 **Analytics View** | Grade-wise, school-wise, income-tier, and attendance distribution charts |
| 🎯 **Intervention Manager** | Log, filter, track, and export interventions (home visits, NSP, KGBV referral, counselling, etc.) |
| 📄 **Report & Export** | One-click CSV, PDF, and Word export of student data and interventions |
| 🏫 **School Manager** | Add, remove, and manage schools; auto-generate randomised student cohorts |
| 📧 **Parent Alerts** | Batch send parent notification simulations for critical/high risk students |
| 🎓 **Tutorial Walkthrough** | 6-step in-app onboarding modal for new users |

---

## 🤖 AI Chatbot

The floating **EduGuard AI Assistant** (bottom-right corner) answers questions about the live dataset in plain English. No page navigation needed.

**Example questions you can ask:**
- *"How many students are at critical risk?"*
- *"Which schools have the most at-risk students?"*
- *"What interventions should I apply for BPL students?"*
- *"How does the risk scoring model work?"*
- *"How many children are identified as child labour cases?"*

**Topics covered:**
Student counts · Risk breakdown · Attendance stats · Academic performance · Socioeconomic / BPL analysis · Child labour · Female student / KGBV · School comparison · Intervention strategies · Previous dropout history · Distance barriers · Risk model explanation · Reports & exports · Navigation guide

---

## 🧠 Risk Model

The platform uses a **Weighted Multi-Factor Scoring Model**. Each student is scored across six dimensions:

| Factor | Weight | Trigger |
|---|---|---|
| 📅 Attendance | **30%** | Below 60% → Critical flag |
| 📚 Academic Performance | **25%** | Below 40% score → High flag |
| 💸 Socioeconomic Status | **20%** | BPL tier increases baseline risk |
| 🚌 Distance to School | **10%** | >10 km significantly increases risk |
| 👨‍👩‍👧 Family Background | **10%** | Parental education, prior dropout history |
| 🚩 Behavioral Indicators | **5%** | Absenteeism patterns, disciplinary flags |

**Risk Categories:**

| Level | Score Range | Action Required |
|---|---|---|
| 🔴 Critical | ≥ 75 | Immediate intervention |
| 🟠 High | 55 – 74 | Priority follow-up |
| 🟡 Medium | 35 – 54 | Routine monitoring |
| 🟢 Low | < 35 | Standard support |

If `student_predictions.json` is present, the app uses **ML model predictions** (Logistic Regression trained on synthetic data). Otherwise it falls back to the weighted formula.

---

## 🚀 Quick Start

### 1. Open directly in browser

No server, no install needed for the demo:

```
srm-hackathon-main/
└── index.html   ← Open this file in Chrome/Edge/Firefox
```

**Demo login:**
- Email: `teacher@school.gov`
- Password: `teacher123`

### 2. Retrain the ML model (optional)

Requires Python 3.8+:

```bash
pip install scikit-learn pandas numpy joblib

python ml_model.py
```

This regenerates `student_predictions.json` and `school_predictions.json` using the trained model.

---

## 📁 File Structure

```
srm-hackathon-main/
│
├── index.html                  # Main SPA shell — all views & modals
├── styles.css                  # Design system (professional white/light theme)
│
├── app.js                      # Core SPA logic — routing, rendering, events
├── data.js                     # Student & school data generation
├── risk-engine.js              # Risk scoring, ML integration, recommendations
├── charts.js                   # Chart.js chart wrappers (8 chart types)
├── chatbot.js                  # AI chatbot widget with 16-topic knowledge base
├── predictions.js              # Loads & maps student ML predictions
├── school_predictions.js       # Loads & maps school ML predictions
│
├── ml_model.py                 # Python — trains scikit-learn risk model
├── ml_model.pkl                # Serialised trained model (joblib)
├── scaler.pkl                  # Feature scaler (StandardScaler)
│
├── student_predictions.json    # Pre-generated ML risk scores per student
├── school_predictions.json     # Pre-generated ML risk scores per school
│
├── ARCHITECTURE.md             # Full system architecture document
├── PROJECT_PLAN.md             # Hackathon project plan
└── README.md                   # This file
```

---

## 🗺️ App Navigation

| Section | What you can do |
|---|---|
| **Dashboard** | View district KPIs, risk trend charts, critical alerts at a glance |
| **Students** | Search/filter the full student directory; click any row for the full profile |
| **Analytics** | Explore grade-wise, school-wise, income-tier, and attendance distribution charts |
| **Interventions** | Add and track interventions; filter by type/status; export to CSV/PDF/Word |
| **Reports** | High-level district summary; one-click data exports |
| **Schools** | Add/remove schools; generate randomised student cohorts |

---

## 🎯 Intervention Types

EduGuard supports logging the following government-aligned interventions:

- 🏠 Schedule Home Visit
- 📱 Enable SMS Alerts to Parents
- 📖 Enroll in Remedial Classes
- 🧑‍🏫 Assign Tutor
- 💰 Apply for NSP (National Scholarship Programme)
- 👮 Alert DCPO (District Child Protection Officer)
- 🚌 Assign Transport
- 📋 Schedule SMC Meeting (School Management Committee)
- 🧠 Assign Counselor
- 🏠 KGBV Referral (Kasturba Gandhi Balika Vidyalaya — for girls)
- 🛋️ Counselor Referral
- 👁️ Routine Monitoring

---

## 📊 Export Options

| Format | Available In |
|---|---|
| **CSV** | Students view, Interventions view, Reports |
| **PDF** | Students view, Interventions view |
| **Word (.docx)** | Students view, Interventions view |
| **Print** | Reports view (browser print dialog) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Charts | Chart.js 4.4 |
| PDF Export | jsPDF + jsPDF-AutoTable |
| ML Model | scikit-learn (Logistic Regression + StandardScaler) |
| Typography | Inter — Google Fonts |
| Data | Synthetic student dataset (procedurally generated via data.js) |

---

## 🔧 Customisation

**Add your own schools**
Go to the Schools tab → Add School (manual) or Add Random School (auto-generates students).

**Change intervention recommendations**
Edit `generateRecommendations()` in `risk-engine.js` to add or modify recommendation logic.

**Swap in real student data**
Replace the `generateStudents()` function in `data.js` with an API call or a JSON import from your student information system.

**Retrain the ML model**
Edit `ml_model.py` to adjust features, model type, or training data, then run it to regenerate the prediction JSON files.

**Change the chatbot knowledge base**
Edit the `KB` array in `chatbot.js` — each entry has `patterns` (keyword triggers), a `response` function, and optional `quickReplies`.

---

## 🌍 Designed For

- 🏫 **Government school teachers** — daily monitoring of at-risk students
- 📋 **School administrators** — district-level oversight and reporting
- 🏛️ **Education ministry officials** — district-wide risk analytics
- 👮 **Child protection officers** — identify child labour and dropout cases

---

## 📞 Child Protection Resources

| Resource | Contact |
|---|---|
| Childline India (Child Labour Helpline) | **1098** (24×7, toll-free) |
| National Scholarship Portal | scholarships.gov.in |
| KGBV Programme | Contact your District Education Officer |

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

## 🏆 Credits

Built for the **SRM Hackathon 2026**.

- **Chart.js** — beautiful, responsive charts
- **jsPDF** — client-side PDF generation
- **scikit-learn** — ML model training and prediction
- **Inter font** — Google Fonts

---

*Keeping every child in school — one data point at a time.* 🎓
