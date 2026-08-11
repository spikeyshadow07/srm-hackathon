<div align="center">

# 🛡️ EduGuard AI — Early Warning Dropout Prevention System

*An AI-powered, multi-factor risk monitoring platform for government schools with automated **n8n workflow integration** for real-time alert forwarding.*

[![Made with HTML5](https://img.shields.io/badge/Frontend-HTML5%20%2F%20JS%20%2F%20CSS-blue?style=flat-square)](#)
[![ML Model](https://img.shields.io/badge/ML-scikit--learn-orange?style=flat-square)](#)
[![Automation](https://img.shields.io/badge/Automation-n8n%20Webhooks-ff6d5a?style=flat-square)](#-n8n-automation-workflow)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen?style=flat-square)](#-github-deployment-guide)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#license)

</div>

---

## 📖 Table of Contents
- [✨ Features](#-features)
- [🏗️ Project Structure](#️-project-structure)
- [🔄 System & Data Workflow](#-system--data-workflow)
- [⚡ n8n Automation Workflow](#-n8n-automation-workflow)
- [🚀 Quick Start (Local Setup)](#-quick-start-local-setup)
- [🌐 GitHub Deployment Guide](#-github-deployment-guide)
- [🧠 Risk Model Architecture](#-risk-model-architecture)
- [📜 License](#-license)

---

## ✨ Features

- 📊 **Dynamic Dashboard**: Real-time KPI summary, monthly trend charts, risk distribution donut, and school-level risk breakdown.
- 🔴 **Weighted Multi-Factor & ML Risk Engine**: Combines attendance (30%), academics (25%), socioeconomic status (20%), distance (10%), family background (10%), and behavior (5%) with a trained `scikit-learn` ML model.
- ⚡ **n8n Automated Alert Forwarding**: Automatically sends critical and high-risk student alerts to WhatsApp, Telegram, Email, SMS, or Google Sheets via n8n Webhooks.
- 🎨 **Multi-Theme UI**: Supports ☀️ Light, 🌙 Dark, and 💻 System Default themes with zero Flash-of-Unstyled-Content (FOUC).
- 🤖 **AI Assistant Chatbot**: Integrated floating chatbot widget with a 16-topic domain knowledge base for instant queries.
- 📄 **Multi-Format Export**: One-click data export in CSV, PDF (auto-highlighting high-risk students in red), and Word (`.doc`) format.
- 🏫 **School & Cohort Management**: Add/manage schools and dynamically auto-generate student cohorts.

---

## 🏗️ Project Structure

```
srm-hackathon-main/
│
├── 📄 index.html                # Main SPA markup shell, views & modals
├── 🎨 styles.css                # Complete CSS design system (Light/Dark themes, CSS variables)
├── 🌓 theme.js                  # Light / Dark / System mode theme manager
├── 🧠 app.js                    # Core SPA router, state management & UI handlers
├── 📊 charts.js                 # Chart.js wrappers (8 chart types with dark/light themes)
├── 🤖 chatbot.js                # AI assistant widget with 16-topic live knowledge base
├── ⚡ n8n.js                    # n8n webhook automation, auto-scheduler & log manager
├── 📋 n8n_workflow.json         # Pre-configured n8n workflow export file (ready to import)
│
├── 📂 Data & ML Engine
│   ├── data.js                  # Student & school synthetic data generator
│   ├── risk-engine.js           # Multi-factor risk engine & recommendation rules
│   ├── ml_model.py              # Python script — trains scikit-learn Logistic Regression
│   ├── ml_model.pkl             # Serialised trained ML model
│   ├── scaler.pkl               # Feature scaler (StandardScaler)
│   ├── predictions.js           # Student ML prediction mappings
│   ├── school_predictions.js    # School ML prediction mappings
│   ├── student_predictions.json # Raw student ML predictions
│   └── school_predictions.json  # Raw school ML predictions
│
└── 📖 Documentation
    ├── README.md                # Project documentation & GitHub guide (this file)
    ├── ARCHITECTURE.md          # Comprehensive system architecture & data flow diagrams
    └── PROJECT_PLAN.md          # Hackathon roadmap & project milestones
```

---

## 🔄 System & Data Workflow

```
 ┌────────────────┐      ┌─────────────────┐      ┌──────────────────┐
 │ Student Record │ ───► │   Risk Engine   │ ───► │ ML Model (Python)│
 │ Data (data.js) │      │ (risk-engine.js)│      │  (ml_model.py)   │
 └────────────────┘      └─────────────────┘      └──────────────────┘
                                   │                        │
                                   ▼                        ▼
 ┌───────────────────────────────────────────────────────────────────┐
 │               EduGuard Dashboard & Analytics UI                   │
 │   • Interactive Charts   • Critical Risk Alerts   • Student Profiles │
 └───────────────────────────────────────────────────────────────────┘
               │                                       │
               ▼                                       ▼
 ┌───────────────────────────┐           ┌───────────────────────────┐
 │   n8n Automation Engine   │           │    AI Assistant Chatbot   │
 │        (n8n.js)           │           │       (chatbot.js)        │
 └───────────────────────────┘           └───────────────────────────┘
               │
               ▼
 ┌───────────────────────────────────────────────────────────────────┐
 │                       External Notifications                      │
 │    💬 WhatsApp   |   ✈️ Telegram   |   📧 Email   |   📊 Sheets     │
 └───────────────────────────────────────────────────────────────────┘
```

---

## ⚡ n8n Automation Workflow

EduGuard AI connects directly to **n8n Workflows** to deliver instant alerts to educators, administrators, and parents.

### How to Configure n8n:

1. **Install & Run n8n**:
   ```bash
   npx n8n
   # Or run via Docker / n8n Cloud
   ```
2. **Import the Workflow**:
   - Open your n8n dashboard (`http://localhost:5678`).
   - Click **Workflows** → **Import from File**.
   - Select the [`n8n_workflow.json`](./n8n_workflow.json) file included in this repository.
3. **Copy the Webhook URL**:
   - Open the **Webhook — EduGuard Risk Alert** node.
   - Copy the **Test** or **Production** URL (e.g. `http://localhost:5678/webhook/eduguard-risk-alert`).
4. **Connect to EduGuard AI**:
   - In EduGuard AI, navigate to **⚡ Automation** in the sidebar.
   - Paste your **n8n Webhook URL**.
   - Toggle **Enable n8n Integration** and click **💾 Save Settings**.
   - Click **🧪 Test Webhook** to send a test payload!

---

## 🚀 Quick Start (Local Setup)

No complex server setup is required to test the web frontend!

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/eduguard-ai.git
   cd eduguard-ai
   ```
2. **Launch the App**:
   - Simply double click `index.html` or open it in any browser (Chrome, Edge, Firefox, Safari).

3. **Demo Credentials**:
   - **Email**: `teacher@school.gov`
   - **Password**: `teacher123`

---

## 🌐 GitHub Deployment Guide

### Step 1: Push Code to GitHub

```bash
# Initialize git (if starting fresh)
git init
git add .
git commit -m "Initial commit: EduGuard AI with n8n integration"

# Create a repo on GitHub, then link it:
git remote add origin https://github.com/YOUR_USERNAME/eduguard-ai.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to GitHub Pages (Free Hosting)

1. Go to your repository on **GitHub.com**.
2. Click **Settings** (top navigation tab).
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`
   - **Branch**: Select `main` / `root` (`/`)
5. Click **Save**.
6. GitHub will generate your live URL in ~1 minute (e.g. `https://YOUR_USERNAME.github.io/eduguard-ai/`).

---

## 🧠 Risk Model Architecture

The platform uses a weighted scoring formula combined with ML model predictions:

| Dimension | Weight | Critical Threshold / Condition |
|---|---|---|
| 📅 **Attendance** | 30% | Attendance < 60% |
| 📚 **Academic Score** | 25% | Score < 40% |
| 💸 **Socioeconomic Status** | 20% | BPL Tier, Working Child |
| 🚌 **Distance to School** | 10% | Distance > 10 km |
| 👨‍👩‍👧 **Family Background** | 10% | Illiterate Parents, Prior Dropout |
| 🚩 **Behavioral Flags** | 5% | Frequent Disciplinary Records |

---

## 📜 License

This project is licensed under the **MIT License** — free to use, modify, and distribute for educational and public-sector purposes.

---

<div align="center">
  <sub>Built for the <strong>SRM Hackathon 2026</strong>. Keeping every child in school — one data point at a time. 🎓</sub>
</div>
