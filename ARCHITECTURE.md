# EduGuard AI — System Architecture & Workflow Specifications

## 1. High-Level Architectural Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. PRESENTATION LAYER (UI)                         │
│  ┌────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐ │
│  │ Single Page App (SPA)  │  │ Theme Engine          │  │ AI Chatbot     │ │
│  │ (index.html, app.js)   │  │ Light / Dark / System │  │ (chatbot.js)   │ │
│  └────────────────────────┘  └───────────────────────┘  └────────────────┘ │
│  ┌────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐ │
│  │ Chart.js Visualizer    │  │ Export Engine         │  │ Tutorial Modal │ │
│  │ (charts.js)            │  │ (jsPDF, CSV, Word)    │  │ (Walkthrough)  │ │
│  └────────────────────────┘  └───────────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       2. LOGIC & SERVICE LAYER                              │
│  ┌────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐ │
│  │ Multi-Factor Risk      │  │ Intervention          │  │ School Cohort  │ │
│  │ Scoring (risk-engine)  │  │ Tracker (app.js)      │  │ Manager        │ │
│  └────────────────────────┘  └───────────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    3. MACHINE LEARNING & DATA LAYER                         │
│  ┌────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐ │
│  │ Scikit-Learn ML Model  │  │ Pre-calculated JSON   │  │ Synthetic Data │ │
│  │ (Logistic Regression)  │  │ Predictions (ML)      │  │ Engine (data)  │ │
│  └────────────────────────┘  └───────────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    4. INTEGRATION & AUTOMATION LAYER                        │
│  ┌────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐ │
│  │ n8n Webhook Client     │  │ Auto-Scheduler        │  │ Activity Log   │ │
│  │ (n8n.js)               │  │ Timer (setInterval)   │  │ Manager        │ │
│  └────────────────────────┘  └───────────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │ (HTTP POST Webhook)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     5. EXTERNAL AUTOMATION (n8n)                            │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ ┌──────────────┐ │
│  │  WhatsApp API   │ │  Telegram Bot   │ │  Gmail / SMTP │ │ Google Sheets│ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Data Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Teacher / Admin
    participant UI as Web Frontend (index.html / app.js)
    participant RE as Risk Engine (risk-engine.js)
    participant ML as ML Model Service (ml_model.py)
    participant N8N as n8n Integration (n8n.js)
    actor n8n as n8n Workflow Server
    actor Ext as External Channels (WhatsApp/Telegram/Email)

    %% 1. Initialization
    Teacher->>UI: Opens Application (index.html)
    UI->>RE: Load Raw Student Data (data.js)
    RE->>ML: Fetch ML Predictions (student_predictions.json)
    ML-->>RE: Return Predicted Probabilities
    RE->>RE: Calculate Weighted Multi-Factor Scores (Attendance, Academics, Distance, etc.)
    RE-->>UI: Return Enriched Student Cohort (_allStudents)
    UI->>UI: Render KPI Cards, Donut Charts & Alert Table

    %% 2. User Interactions
    Teacher->>UI: Filter by "Critical Risk" or Search Student
    UI->>UI: Update Table & Re-render Visualizations

    %% 3. n8n Automation Alert Forwarding
    Teacher->>UI: Click "📡 Send All At-Risk" or Auto-Schedule Timer fires
    UI->>N8N: Trigger sendToN8n(filteredStudents)
    N8N->>N8N: Build Structured JSON Payload (Summary + Student Details + Recommendations)
    N8N->>n8n: HTTP POST Webhook Request (Payload)
    n8n->>n8n: Evaluate Conditions (Filter Critical/High Risk)
    n8n->>Ext: Dispatch WhatsApp / Telegram / Email Notifications
    n8n-->>N8N: Return HTTP Response
    N8N->>UI: Display Toast Notification & Log Activity Entry
```

---

## 3. n8n Webhook Data Flow Architecture

```mermaid
flowchart LR
    subgraph EduGuard [EduGuard AI Application]
        A[Student Risk Dataset] --> B[n8n.js Client]
        B --> C{Trigger Event}
        C -->|Manual Click| D[Build Payload]
        C -->|Cron Timer| D
        C -->|Test Button| D
    end

    subgraph WebhookEndpoint [n8n Workflow Engine]
        D -->|HTTP POST JSON| E[n8n Webhook Node]
        E --> F{IF Critical Students > 0}
        F -->|Yes| G[Telegram Bot Node]
        F -->|Yes| H[Gmail / SMTP Node]
        F -->|Yes| I[WhatsApp Business Node]
        F -->|Yes| J[Google Sheets Log Node]
        F -->|No| K[End Workflow]
    end

    G --> L((District Officers))
    H --> M((School Headmasters))
    I --> N((Parents / Guardians))
```

---

## 4. Component Breakdown & Functional Responsibilities

| Layer / Component | File | Responsibilities |
|---|---|---|
| **Presentation (UI)** | `index.html`, `styles.css` | SPA layout, CSS design system, responsive grids, Light/Dark theme variable bindings. |
| **Theme Engine** | `theme.js` | Theme toggle logic (`light`, `dark`, `system`), local storage persistence, FOUC prevention. |
| **SPA Controller** | `app.js` | View router (`navigateTo`), table pagination, export actions (PDF/CSV/Word), user login state. |
| **Chart Visualizer** | `charts.js` | Chart.js wrappers for 8 chart types; dynamic color adjustments when switching theme modes. |
| **AI Chatbot** | `chatbot.js` | Floating chatbot UI, 16-topic pattern matcher utilizing live `window._allStudents` dataset. |
| **Risk Engine** | `risk-engine.js` | 6-dimension weighted scoring formula, threshold classification (`Critical`, `High`, `Medium`, `Low`), intervention recommendation rules. |
| **ML Engine** | `ml_model.py` | Python scikit-learn script for model training (Logistic Regression + StandardScaler). |
| **n8n Client** | `n8n.js` | Webhook URL configuration, JSON payload builder, auto-scheduler, test runner, local activity logging. |
| **n8n Workflow** | `n8n_workflow.json` | Declarative n8n workflow file ready for import into n8n instances. |