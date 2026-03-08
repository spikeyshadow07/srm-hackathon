// ============================================================
// App.js — SPA Router & UI Logic
// ============================================================

let allStudents = [];
let currentView = "dashboard";
let selectedStudentId = null;
let interventions = JSON.parse(localStorage.getItem("interventions") || "[]");
let interventionCounter = interventions.length ? Math.max(...interventions.map(i => i.id)) + 1 : 1;
let studentPage = 1;
const PAGE_SIZE = 20;
let studentFilters = { search: "", school: "all", grade: "all", risk: "all", gender: "all" };
let sortState = { col: "riskScore", dir: "desc" };

let currentUser = null;
let appInitialized = false;

const DEMO_TEACHER = {
  email: "teacher@school.gov",
  password: "teacher123",
  name: "Demo Teacher",
  role: "Teacher"
};


// simple CSV generator
function toCSV(arr, columns) {
  const header = columns.join(",");
  const rows = arr.map(o => columns.map(c => `"${(o[c]||"").toString().replace(/"/g,'""')}"`).join(","));
  return [header, ...rows].join("\n");
}

function exportStudents() {
  const cols = ["id","name","grade","schoolName","riskCategory","riskScore","attendance","academicScore"];
  const data = allStudents.map(s => ({
    id: s.id, name: s.name, grade: s.grade,
    schoolName: s.schoolName, riskCategory: s.riskCategory,
    riskScore: s.riskScore, attendance: s.attendance,
    academicScore: s.academicScore
  }));
  const csv = toCSV(data, cols);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "students.csv"; a.click();
  URL.revokeObjectURL(url);
}

function exportInterventions() {
  if (!interventions.length) return;
  const cols = ["id","studentName","schoolName","type","status","date","notes","addedBy"];
  const csv = toCSV(interventions, cols);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "interventions.csv"; a.click();
  URL.revokeObjectURL(url);
}

function exportInterventionsPDF() {
  if (!interventions.length) return;
  const cols = ["ID","Student","School","Type","Status","Date","Notes","By"];
  const rows = interventions.map(i => [i.id,i.studentName,i.schoolName,i.type,i.status,i.date,i.notes,i.addedBy]);
  // create simple PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(10);
  let y = 10;
  doc.text(cols.join(' | '), 10, y);
  rows.forEach(r => {
    y += 6;
    doc.text(r.join(' | '), 10, y);
  });
  doc.save('interventions.pdf');
}

function exportInterventionsWord() {
  if (!interventions.length) return;
  let html = '<html><head><meta charset="utf-8"></head><body><table border="1" cellspacing="0" cellpadding="4"><tr>';
  const cols = ["ID","Student","School","Type","Status","Date","Notes","By"];
  cols.forEach(c=> html += `<th>${c}</th>`);
  html += '</tr>';
  interventions.forEach(i=>{
    html += '<tr>' + [i.id,i.studentName,i.schoolName,i.type,i.status,i.date,i.notes,i.addedBy]
      .map(v=>`<td>${v||''}</td>`).join('') + '</tr>';
  });
  html += '</table></body></html>';
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'interventions.doc'; a.click();
  URL.revokeObjectURL(url);
}

function exportStudentsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const columns = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Name', dataKey: 'name' },
    { header: 'Grade', dataKey: 'grade' },
    { header: 'School', dataKey: 'schoolName' },
    { header: 'Risk', dataKey: 'riskCategory' },
    { header: 'Score', dataKey: 'riskScore' },
    { header: 'Attendance', dataKey: 'attendance' },
    { header: 'Academic', dataKey: 'academicScore' }
  ];

  const data = allStudents.map(s => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
    schoolName: s.schoolName,
    riskCategory: s.riskCategory,
    riskScore: s.riskScore,
    attendance: s.attendance,
    academicScore: s.academicScore
  }));

  doc.autoTable({
    columns: columns,
    body: data,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: function(data) {
      if (data.section === 'body' && (data.row.raw.riskCategory === 'Critical' || data.row.raw.riskCategory === 'High')) {
        data.cell.styles.textColor = [255, 0, 0]; // red text
      }
    }
  });

  doc.save('students.pdf');
}

function sendParentAlerts() {
  const highRisk = allStudents.filter(s => s.riskCategory === 'Critical' || s.riskCategory === 'High');
  if (highRisk.length === 0) {
    alert('No high-risk students to alert.');
    return;
  }
  const confirmSend = confirm(`Send alerts to ${highRisk.length} parents of high-risk students? This will open email clients.`);
  if (!confirmSend) return;

  highRisk.forEach(s => {
    // choose template based on language
    let subject, body;
    switch (s.parentLang) {
      case 'Hindi':
        subject = `अलर्ट: आपके बच्चे ${s.name} का स्कूल छोड़ने का जोखिम`;
        body = `प्रिय अभिभावक,\n\nहम आपके बच्चे ${s.name} के शैक्षणिक प्रदर्शन को लेकर चिंतित हैं।\nस्कूल: ${s.schoolName}\n\nवर्तमान स्थिति:\n- जोखिम स्तर: ${s.riskCategory}\n- हाज़िरी: ${s.attendance}%\n- शैक्षिक अंक: ${s.academicScore}%\n- जोखिम स्कोर: ${s.riskScore}\n\nकृपया समर्थन के लिए विद्यालय प्रशासन से संपर्क करें।\n\nधन्यवाद,\nविद्यालय प्रशासन\n${s.schoolName}\nसम्पर्क: school@example.com`;
        break;
      case 'Tamil':
        subject = `அறிவிப்பு: உங்கள் மாணவர் ${s.name} பள்ளி விட்டு விலகும் ஆபத்து`;
        body = `அன்புடையீர் பெற்றோரே,\n\nஉங்கள் மாணவர் ${s.name} இன் கல்வித் தரத்திற்கு நாங்கள் கவலைப்படுகிறோம்.\nபள்ளி: ${s.schoolName}\n\nதற்போதைய விவரங்கள்:\n- ஆபத்து நிலை: ${s.riskCategory}\n- வருகை: ${s.attendance}%\n- கல்வித் மதிப்பெண்: ${s.academicScore}%\n- ஆபத்து மதிப்பெண்: ${s.riskScore}\n\nதயவு செய்து ஆதரிக்க பள்ளி நிர்வாகத்துடன் தொடர்பு கொள்ளவும்.\n\nநன்றி,\nபள்ளி நிர்வாகம்\n${s.schoolName}\nதொடர்பு: school@example.com`;
        break;
      default:
        subject = `Alert: Your Child ${s.name} is at Risk of Dropping Out`;
        body = `Dear Parent,\n\nWe are concerned about your child's academic performance at ${s.schoolName}.\n\nCurrent Details:\n- Risk Level: ${s.riskCategory}\n- Attendance: ${s.attendance}%\n- Academic Score: ${s.academicScore}%\n- Risk Score: ${s.riskScore}\n\nPlease contact the school administration for support and interventions.\n\nRegards,\nSchool Administration\n${s.schoolName}\nContact: school@example.com`;
    }

    const mailto = `mailto:${s.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
  });
  showToast(`${highRisk.length} alert emails prepared.`, 'info');
}

function exportStudentsWord() {
  let html = '<html><head><meta charset="utf-8"></head><body><table border="1" cellspacing="0" cellpadding="4"><tr>';
  const cols = ["ID","Name","Grade","School","Risk","Score","Attendance","Academic"];
  cols.forEach(c=> html += `<th>${c}</th>`);
  html += '</tr>';
  allStudents.forEach(s=>{
    html += '<tr>' + [s.id,s.name,s.grade,s.schoolName,s.riskCategory,s.riskScore,s.attendance,s.academicScore]
      .map(v=>`<td>${v||''}</td>`).join('') + '</tr>';
  });
  html += '</table></body></html>';
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'students.doc'; a.click();
  URL.revokeObjectURL(url);
}

function deleteStudent(id) {
  const confirmDelete = confirm("Are you sure you want to delete this student? This action cannot be undone.");
  if (!confirmDelete) return;
  const idx = allStudents.findIndex(s => s.id === id);
  if (idx === -1) return;
  allStudents.splice(idx, 1);
  // If the deleted student was selected, clear selection
  if (selectedStudentId === id) {
    selectedStudentId = null;
    navigateTo("students");
  }
  // Refresh views
  renderStudentsView();
  renderDashboard();
  updateAlertBadge();
  updateHeaderCounts();
  showToast("Student deleted.", "info");
}

// ────────────────────────────────────────────────────────────
// TUTORIAL
// ────────────────────────────────────────────────────────────
let currentTutorialStep = 0;
const tutorialSteps = [
  {
    title: "Welcome to EduGuard!",
    content: "This is the EduGuard AI Early Warning System for student dropout prevention. Let's take a quick tour to get you started.",
    highlight: null
  },
  {
    title: "Navigation Sidebar",
    content: "Use the sidebar on the left to navigate between different sections: Dashboard, Students, Analytics, Interventions, Reports, and Schools.",
    highlight: "#sidebar"
  },
  {
    title: "Dashboard Overview",
    content: "The Dashboard shows key performance indicators like total students, critical risk counts, and interactive charts for risk distribution.",
    highlight: ".kpi-grid"
  },
  {
    title: "Students Directory",
    content: "View and manage student records here. You can filter by school, grade, or risk level, and export data in various formats.",
    highlight: "#view-students"
  },
  {
    title: "Adding Schools",
    content: "Go to the Schools tab to add new schools. Each school can have multiple students.",
    highlight: "#add-school-btn"
  },
  {
    title: "Export Features",
    content: "Export student data or interventions as CSV, PDF, or Word documents. PDFs highlight high-risk students in red.",
    highlight: ".filters-bar"
  }
];

function showTutorial() {
  currentTutorialStep = 0;
  updateTutorial();
  document.getElementById("tutorial-modal").style.display = "flex";
}

function hideTutorial() {
  document.getElementById("tutorial-modal").style.display = "none";
  clearHighlights();
  localStorage.setItem("tutorialShown", "true");
}

function updateTutorial() {
  const step = tutorialSteps[currentTutorialStep];
  document.getElementById("tutorial-title").textContent = step.title;
  document.getElementById("tutorial-content").innerHTML = step.content;
  document.getElementById("tutorial-step").textContent = currentTutorialStep + 1;
  document.getElementById("tutorial-total").textContent = tutorialSteps.length;

  const prevBtn = document.getElementById("tutorial-prev");
  const nextBtn = document.getElementById("tutorial-next");

  prevBtn.disabled = currentTutorialStep === 0;
  nextBtn.textContent = currentTutorialStep === tutorialSteps.length - 1 ? "Finish" : "Next";

  clearHighlights();
  if (step.highlight) {
    const el = document.querySelector(step.highlight);
    if (el) el.classList.add("tutorial-highlight");
  }
}

function nextTutorial() {
  if (currentTutorialStep < tutorialSteps.length - 1) {
    currentTutorialStep++;
    updateTutorial();
  } else {
    hideTutorial();
  }
}

function prevTutorial() {
  if (currentTutorialStep > 0) {
    currentTutorialStep--;
    updateTutorial();
  }
}

function clearHighlights() {
  document.querySelectorAll(".tutorial-highlight").forEach(el => el.classList.remove("tutorial-highlight"));
}

// ────────────────────────────────────────────────────────────
// AUTH & INIT
// ────────────────────────────────────────────────────────────

function showLoginScreen() {
  const login = document.getElementById("login-screen");
  const shell = document.getElementById("app-shell");
  if (login) login.style.display = "flex";
  if (shell) shell.style.display = "none";
}

function showAppShell() {
  const login = document.getElementById("login-screen");
  const shell = document.getElementById("app-shell");
  if (login) login.style.display = "none";
  if (shell) shell.style.display = "block";
}

function updateUserUi() {
  if (!currentUser) return;
  const nameEl = document.getElementById("user-name");
  const roleEl = document.getElementById("user-role");
  const avatarEl = document.getElementById("user-avatar");
  if (nameEl) nameEl.textContent = currentUser.name;
  if (roleEl) roleEl.textContent = currentUser.role;
  if (avatarEl) avatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("login-email")?.value.trim();
  const password = document.getElementById("login-password")?.value.trim();
  if (!email || !password) {
    showToast("Please enter email and password.", "warning");
    return;
  }
  if (email === DEMO_TEACHER.email && password === DEMO_TEACHER.password) {
    currentUser = { name: DEMO_TEACHER.name, role: DEMO_TEACHER.role, email };
    localStorage.setItem("eduguardUser", JSON.stringify(currentUser));
    showAppShell();
    initAppAfterLogin();
    updateUserUi();
    showToast("Signed in as teacher.", "success");
  } else {
    showToast("Invalid email or password.", "error");
  }
}

function handleLogout() {
  localStorage.removeItem("eduguardUser");
  currentUser = null;
  showLoginScreen();
}

function initAppAfterLogin() {
  if (appInitialized) return;
  appInitialized = true;

  const raw = window.AppData.STUDENTS;
  allStudents = window.RiskEngine.enrichStudents(raw);
  window._allStudents = allStudents;
  setupNav();
  navigateTo("dashboard");
  updateAlertBadge();
  updateHeaderCounts();

  document.getElementById("export-students")?.addEventListener("click", exportStudents);
  document.getElementById("export-students-pdf")?.addEventListener("click", exportStudentsPDF);
  document.getElementById("export-students-word")?.addEventListener("click", exportStudentsWord);
  document.getElementById("send-parent-alerts")?.addEventListener("click", sendParentAlerts);
  document.getElementById("export-interventions")?.addEventListener("click", exportInterventions);
  document.getElementById("export-interventions-pdf")?.addEventListener("click", exportInterventionsPDF);
  document.getElementById("export-interventions-word")?.addEventListener("click", exportInterventionsWord);

  // Tutorial
  document.getElementById("tutorial-close")?.addEventListener("click", hideTutorial);
  document.getElementById("tutorial-prev")?.addEventListener("click", prevTutorial);
  document.getElementById("tutorial-next")?.addEventListener("click", nextTutorial);
  document.getElementById("help-btn")?.addEventListener("click", showTutorial);

  // Show tutorial for first-time users
  if (!localStorage.getItem("tutorialShown")) {
    setTimeout(showTutorial, 1000); // Delay to let page load
  }
  document.getElementById("edit-student-btn")?.addEventListener("click", () => {
    if (selectedStudentId) {
      const s = allStudents.find(x => x.id === selectedStudentId);
      if (s) {
        editStudentDetails(s);
        // re-enrich and refresh data
        const idx = allStudents.findIndex(x => x.id === s.id);
        allStudents[idx] = window.RiskEngine.enrichStudents([s])[0];
        renderProfileView(s.id);
        renderStudentsView();
        renderDashboard();
        updateAlertBadge();
        updateHeaderCounts();
        showToast("Student updated.", "success");
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm && !loginForm._bound) {
    loginForm._bound = true;
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn && !logoutBtn._bound) {
    logoutBtn._bound = true;
    logoutBtn.addEventListener("click", () => {
      handleLogout();
      showToast("You have been logged out.", "info");
    });
  }

  const stored = localStorage.getItem("eduguardUser");
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
    } catch {
      currentUser = null;
    }
  }

  // Always initialize app data so analytics widgets have access
  initAppAfterLogin();

  if (currentUser) {
    showAppShell();
    updateUserUi();
  } else {
    showLoginScreen();
  }
});


function setupNav() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const view = item.dataset.view;
      if (view === "profile") return;
      navigateTo(view);
    });
  });
  document.getElementById("hamburger").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });
  // schools: attach add button if present
  document.getElementById("add-school-btn")?.addEventListener("click", addSchool);
  document.getElementById("add-random-school-btn")?.addEventListener("click", addRandomSchool);
  // delete school handler is global function, no listener here
}

function navigateTo(view, studentId = null) {
  currentView = view;
  selectedStudentId = studentId || selectedStudentId;
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === view));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const viewEl = document.getElementById(`view-${view}`);
  if (viewEl) viewEl.classList.add("active");
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo(0, 0);

  switch (view) {
    case "dashboard": renderDashboard(); break;
    case "students": renderStudentsView(); break;
    case "profile": renderProfileView(selectedStudentId); break;
    case "analytics": renderAnalyticsView(); break;
    case "interventions": renderInterventionsView(); break;
    case "reports": renderReportsView(); break;
    case "schools": renderSchoolsView(); break;
  }
  updateBreadcrumb(view);
}

function updateBreadcrumb(view) {
  const names = {
    dashboard: "Dashboard",
    students: "Student List",
    profile: "Student Profile",
    analytics: "Analytics",
    interventions: "Interventions",
    reports: "Reports",
    schools: "Schools",
  };
  document.getElementById("breadcrumb").textContent = names[view] || "Dashboard";
}

function updateAlertBadge() {
  const critical = allStudents.filter(s => s.riskCategory === "Critical").length;
  const badge = document.getElementById("alert-badge");
  if (badge) badge.textContent = critical;
}

function updateHeaderCounts() {
  const chip = document.querySelector(".header-chip");
  if (!chip) return;
  const schoolCount = window.AppData.SCHOOLS.length;
  const studentCount = allStudents.length;
  chip.textContent = `🏫 ${schoolCount} School${schoolCount!==1?'s':''} · ${studentCount} Students`;
}

// ────────────────────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────────────────────
function renderDashboard() {
  const s = allStudents;
  const critical = s.filter(x => x.riskCategory === "Critical");
  const high = s.filter(x => x.riskCategory === "High");
  const med = s.filter(x => x.riskCategory === "Medium");
  const intActive = interventions.filter(i => i.status === "Active").length;
  const avgRisk = (s.reduce((a, b) => a + b.riskScore, 0) / s.length).toFixed(1);

  document.getElementById("kpi-total").textContent = s.length;
  document.getElementById("kpi-critical").textContent = critical.length;
  document.getElementById("kpi-high").textContent = high.length;
  document.getElementById("kpi-interventions").textContent = intActive;
  document.getElementById("kpi-avg-risk").textContent = `${avgRisk}%`;
  document.getElementById("kpi-low").textContent = s.filter(x => x.riskCategory === "Low").length;
  updateHeaderCounts();

  // Render alerts
  const alertsEl = document.getElementById("dashboard-alerts");
  const topCritical = critical.sort((a, b) => b.riskScore - a.riskScore).slice(0, 6);
  alertsEl.innerHTML = topCritical.map(st => `
    <div class="alert-card" onclick="openProfile(${st.id})">
      <div class="alert-left">
        <div class="avatar" style="background:${st.riskBg};color:${st.riskColor}">${st.name[0]}</div>
        <div>
          <div class="alert-name">${st.name}</div>
          <div class="alert-meta">${st.schoolName.split(",")[0]} · ${st.grade}</div>
        </div>
      </div>
      <div class="risk-badge critical">${st.riskScore}% Risk</div>
    </div>
  `).join("");

  // Charts
  setTimeout(() => {
    const { SCHOOLS } = window.AppData;
    window.Charts.renderRiskDonut("chart-donut", s);
    window.Charts.renderMonthlyTrend("chart-trend", s);
    window.Charts.renderSchoolRiskBar("chart-school-bar", s, SCHOOLS);
  }, 50);
}

function openProfile(id) {
  selectedStudentId = id;
  navigateTo("profile", id);
}

// ────────────────────────────────────────────────────────────
// SCHOOLS MANAGEMENT
// ────────────────────────────────────────────────────────────
// Helper functions for risk visualization
function getRiskColor(category) {
  const colors = {
    "Critical": "#ef4444",
    "High": "#f97316",
    "Medium": "#eab308",
    "Low": "#22c55e"
  };
  return colors[category] || "#6b7280";
}

function getRiskIcon(category) {
  const icons = {
    "Critical": "🔴",
    "High": "🟠",
    "Medium": "🟡",
    "Low": "🟢"
  };
  return icons[category] || "⚪";
}

function renderSchoolsView() {
  const listEl = document.getElementById("schools-list");
  if (!listEl) return;

  listEl.innerHTML = window.AppData.SCHOOLS.map(s => {
    // Get ML predictions for this school
    const schoolPred = window.SchoolPredictions ? window.SchoolPredictions.find(sp => sp.id === s.id) : null;

    const riskInfo = schoolPred ? `
      <div class="school-risk-info">
        <div class="school-risk-badge" style="background:${getRiskColor(schoolPred.risk_category)};color:white;padding:2px 6px;border-radius:4px;font-size:11px;display:inline-block;margin-right:8px;">
          ${getRiskIcon(schoolPred.risk_category)} ${schoolPred.risk_category}
        </div>
        <span style="font-size:12px;color:var(--text-muted)">
          Avg Risk: ${schoolPred.avg_risk_score} | ${schoolPred.critical_students} critical students (${schoolPred.critical_percentage}%)
        </span>
      </div>
    ` : '';

    return `
    <div class="school-item">
      <div>
        <div>${s.name} <span style="color:var(--text-muted);font-size:12px">(${s.district})</span></div>
        ${riskInfo}
      </div>
      <div>
        <button onclick="addStudent(${s.id})">➕ Add student</button>
        <button class="delete-school" onclick="deleteSchool(${s.id})">🗑️</button>
      </div>
    </div>`;
  }).join("");
}

function addSchool() {
  const name = prompt("School name:");
  if (!name) return;
  const district = prompt("District:");
  if (!district) return;
  const lat = parseFloat(prompt("Latitude (optional):") || "0") || 0;
  const lng = parseFloat(prompt("Longitude (optional):") || "0") || 0;

  const schools = window.AppData.SCHOOLS;
  const newId = schools.length ? Math.max(...schools.map(s => s.id)) + 1 : 1;
  const newSchool = { id: newId, name, district, lat, lng };
  schools.push(newSchool);
  // persist to "database"
  if (typeof window.saveSchools === "function") window.saveSchools(schools);

  // optionally generate a handful of students so the new school isn't empty
  for (let i = 0; i < 20; i++) {
    allStudents.push(generateStudent(newId));
  }

  // refresh current view(s)
  if (currentView === "schools") renderSchoolsView();
  if (currentView === "students") renderStudentsView();
  if (currentView === "dashboard") renderDashboard();
  updateAlertBadge();
  updateHeaderCounts();
  alert(`School '${name}' added (ID ${newId}).`);
}

function addRandomSchool() {
  // Arrays for generating random school data
  const schoolTypes = ["Govt. High School", "Govt. Sr. Sec. School", "Govt. Middle School", "Govt. Composite School", "Govt. Primary School"];
  const locations = ["Rampur", "Tilak Nagar", "Faizabad Road", "Sonbhadra", "Jhansi", "Kanpur", "Allahabad", "Varanasi", "Agra", "Meerut", "Moradabad", "Aligarh", "Saharanpur", "Gorakhpur", "Noida", "Ghaziabad"];
  const districts = ["Rampur", "Bareilly", "Lucknow", "Sonbhadra", "Jhansi", "Kanpur Nagar", "Allahabad", "Varanasi", "Agra", "Meerut", "Moradabad", "Aligarh", "Saharanpur", "Gorakhpur", "Gautam Buddha Nagar", "Ghaziabad"];

  // Generate random school data
  const schoolType = schoolTypes[Math.floor(Math.random() * schoolTypes.length)];
  const location = locations[Math.floor(Math.random() * locations.length)];
  const district = districts[Math.floor(Math.random() * districts.length)];

  // Generate random coordinates (approximate Uttar Pradesh coordinates)
  const lat = 24.0 + Math.random() * 8.0; // 24-32°N
  const lng = 77.0 + Math.random() * 8.0; // 77-85°E

  const name = `${schoolType}, ${location}`;

  const schools = window.AppData.SCHOOLS;
  const newId = schools.length ? Math.max(...schools.map(s => s.id)) + 1 : 1;
  const newSchool = { id: newId, name, district, lat: parseFloat(lat.toFixed(2)), lng: parseFloat(lng.toFixed(2)) };
  schools.push(newSchool);

  // persist to "database"
  if (typeof window.saveSchools === "function") window.saveSchools(schools);

  // generate random number of students (15-35) for the new school
  const numStudents = 15 + Math.floor(Math.random() * 21);
  for (let i = 0; i < numStudents; i++) {
    allStudents.push(generateStudent(newId));
  }

  // refresh current view(s)
  if (currentView === "schools") renderSchoolsView();
  if (currentView === "students") renderStudentsView();
  if (currentView === "dashboard") renderDashboard();
  updateAlertBadge();
  updateHeaderCounts();
  alert(`Random school '${name}' added (ID ${newId}) with ${numStudents} students.`);
}

function deleteSchool(id) {
  const idx = window.AppData.SCHOOLS.findIndex(s => s.id === id);
  if (idx === -1) return;
  if (!confirm("Are you sure you want to remove this school? Existing students will remain but without a valid school.")) return;
  window.AppData.SCHOOLS.splice(idx, 1);
  if (typeof window.saveSchools === "function") window.saveSchools(window.AppData.SCHOOLS);
  // update any students with this school
  allStudents = allStudents.map(st => st.schoolId === id ? { ...st, schoolId: null, schoolName: "[removed]" } : st);
  renderSchoolsView();
  renderStudentsView();
  renderDashboard();
  updateAlertBadge();
  updateHeaderCounts();
}

function addStudent(schoolId) {
  const type = prompt("Add random students or enter details? (r/d)", "r");
  if (!type) return;
  if (type.toLowerCase() === "d") {
    // custom entry of a single student
    const student = generateStudent(schoolId);
    editStudentDetails(student);
    allStudents.push(window.RiskEngine.enrichStudents([student])[0]);
    const name = student.name || "(unnamed)";
    alert(`Added student ${name} to school ID ${schoolId}.`);
  } else {
    const countStr = prompt("How many random students to create?", "1");
    const count = parseInt(countStr) || 0;
    if (count <= 0) return;
    for (let i = 0; i < count; i++) {
      const st = generateStudent(schoolId);
      allStudents.push(window.RiskEngine.enrichStudents([st])[0]);
    }
    alert(`${count} student(s) added to school ID ${schoolId}.`);
  }
  // refresh views regardless of which one is active
  renderStudentsView();
  if (currentView === "dashboard") renderDashboard();
  updateAlertBadge();
  updateHeaderCounts();
  // if user isn't already looking at students, switch there so new entries are visible
  if (currentView !== "students") navigateTo("students");
}

function editStudentDetails(student) {
  const name = prompt("Name:", student.name);
  if (name) student.name = name;
  const gender = prompt("Gender (Male/Female):", student.gender);
  if (gender) student.gender = gender;
  const grade = prompt("Grade (number 6-10):", student.gradeNum);
  if (grade) {
    student.gradeNum = parseInt(grade) || student.gradeNum;
    student.grade = `Grade ${student.gradeNum}`;
  }
  const att = prompt("Attendance % (0-100):", student.attendance);
  if (att) student.attendance = Math.max(0, Math.min(100, parseFloat(att)));
  const score = prompt("Academic score % (0-100):", student.academicScore);
  if (score) student.academicScore = Math.max(0, Math.min(100, parseFloat(score)));
  // recalc derived values when saving helper later by enriching
}


// ────────────────────────────────────────────────────────────
// STUDENTS LIST
// ────────────────────────────────────────────────────────────
function renderStudentsView() {
  document.getElementById("filter-school").innerHTML = `<option value="all">All Schools</option>` + window.AppData.SCHOOLS.map(s => `<option value="${s.id}">${s.name.replace("Govt. ","")}</option>`).join("");
  applyStudentFilters();
  setupStudentFilters();
}

function setupStudentFilters() {
  ["filter-search","filter-school","filter-grade","filter-risk","filter-gender"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.removeEventListener("input", onFilterChange);
    el.removeEventListener("change", onFilterChange);
    el.addEventListener(id === "filter-search" ? "input" : "change", onFilterChange);
  });
  document.getElementById("clear-filters")?.addEventListener("click", () => {
    studentFilters = { search: "", school: "all", grade: "all", risk: "all", gender: "all" };
    document.getElementById("filter-search").value = "";
    document.getElementById("filter-school").value = "all";
    document.getElementById("filter-grade").value = "all";
    document.getElementById("filter-risk").value = "all";
    document.getElementById("filter-gender").value = "all";
    applyStudentFilters();
  });
}

function onFilterChange(e) {
  const key = { "filter-search": "search", "filter-school": "school", "filter-grade": "grade", "filter-risk": "risk", "filter-gender": "gender" }[e.target.id];
  if (key) studentFilters[key] = e.target.value;
  studentPage = 1;
  applyStudentFilters();
}

function getFilteredStudents() {
  let data = [...allStudents];
  if (studentFilters.search) {
    const q = studentFilters.search.toLowerCase();
    data = data.filter(s => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.district.toLowerCase().includes(q));
  }
  if (studentFilters.school !== "all") data = data.filter(s => s.schoolId === parseInt(studentFilters.school));
  if (studentFilters.grade !== "all") data = data.filter(s => s.gradeNum === parseInt(studentFilters.grade));
  if (studentFilters.risk !== "all") data = data.filter(s => s.riskCategory === studentFilters.risk);
  if (studentFilters.gender !== "all") data = data.filter(s => s.gender === studentFilters.gender);

  data.sort((a, b) => {
    const aVal = a[sortState.col];
    const bVal = b[sortState.col];
    if (typeof aVal === "string") return sortState.dir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortState.dir === "asc" ? aVal - bVal : bVal - aVal;
  });
  return data;
}

function applyStudentFilters() {
  const filtered = getFilteredStudents();
  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  studentPage = Math.max(1, Math.min(studentPage, totalPages || 1));
  const page = filtered.slice((studentPage - 1) * PAGE_SIZE, studentPage * PAGE_SIZE);

  document.getElementById("student-count").textContent = `${total} students`;
  const tbody = document.getElementById("students-tbody");
  tbody.innerHTML = page.map(s => `
    <tr onclick="openProfile(${s.id})" class="table-row">
      <td><span class="roll-no">${s.rollNo}</span></td>
      <td>
        <div class="student-name-cell">
          <div class="s-avatar" style="background:${s.riskBg};color:${s.riskColor}">${s.name[0]}</div>
          <div>
            <div class="s-name">${s.name}</div>
            <div class="s-grade-meta">${s.gender} · Age ${s.age}</div>
          </div>
        </div>
      </td>
      <td>${s.grade}</td>
      <td>
        <div class="att-cell">
          <div class="att-bar-wrap"><div class="att-bar" style="width:${s.attendance}%;background:${s.attendance<60?'#ef4444':s.attendance<75?'#f97316':'#22c55e'}"></div></div>
          <span>${s.attendance}%</span>
        </div>
      </td>
      <td><span class="score-chip">${s.academicScore}%</span></td>
      <td>${s.district}</td>
      <td><span class="risk-pill" style="background:${s.riskBg};color:${s.riskColor}">${s.riskIcon} ${s.riskCategory}</span></td>
      <td>
        <div class="risk-score-wrap">
          <div class="risk-score-bar-bg"><div class="risk-score-bar" style="width:${s.riskScore}%;background:${s.riskColor}"></div></div>
          <span style="color:${s.riskColor}">${s.riskScore}</span>
        </div>
      </td>
      <td><button class="delete-student-btn clear-btn" onclick="event.stopPropagation(); deleteStudent(${s.id})">🗑️</button></td>
    </tr>
  `).join("") || `<tr><td colspan="9" class="no-data">No students found matching your filters.</td></tr>`;

  renderPagination(total, totalPages);
  setupSortHeaders();
}

function renderPagination(total, totalPages) {
  const el = document.getElementById("pagination");
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ""; return; }
  let html = `<button onclick="changePage(${studentPage - 1})" ${studentPage === 1 ? "disabled" : ""}>‹ Prev</button>`;
  for (let p = Math.max(1, studentPage - 2); p <= Math.min(totalPages, studentPage + 2); p++) {
    html += `<button onclick="changePage(${p})" class="${p === studentPage ? 'active-page' : ''}">${p}</button>`;
  }
  html += `<button onclick="changePage(${studentPage + 1})" ${studentPage === totalPages ? "disabled" : ""}>Next ›</button>`;
  html += `<span class="page-info">Page ${studentPage} of ${totalPages}</span>`;
  el.innerHTML = html;
}

function changePage(p) { studentPage = p; applyStudentFilters(); }

function setupSortHeaders() {
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.onclick = null;
    th.style.cursor = "pointer";
    const col = th.dataset.sort;
    th.classList.toggle("sort-active", col === sortState.col);
    th.querySelector(".sort-icon") && (th.querySelector(".sort-icon").textContent = col === sortState.col ? (sortState.dir === "asc" ? " ↑" : " ↓") : " ↕");
    th.addEventListener("click", () => {
      if (sortState.col === col) sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
      else { sortState.col = col; sortState.dir = "desc"; }
      applyStudentFilters();
    });
  });
}

// ────────────────────────────────────────────────────────────
// STUDENT PROFILE
// ────────────────────────────────────────────────────────────
function renderProfileView(id) {
  const s = allStudents.find(x => x.id === id);
  if (!s) { navigateTo("students"); return; }

  document.getElementById("profile-name").textContent = s.name;
  document.getElementById("profile-school").textContent = s.schoolName;
  document.getElementById("profile-meta").textContent = `${s.grade} · ${s.gender} · Age ${s.age} · Roll No: ${s.rollNo}`;

  const cat = window.RiskEngine.getRiskCategory(s.riskScore);
  const ringEl = document.getElementById("risk-ring-score");
  const ringLabel = document.getElementById("risk-ring-label");
  if (ringEl) {
    ringEl.textContent = `${s.riskScore}%`;
    ringEl.style.color = cat.color;
    const ring = document.getElementById("risk-ring-svg-circle");
    if (ring) {
      const circumference = 2 * Math.PI * 54;
      ring.style.strokeDasharray = circumference;
      ring.style.stroke = cat.color;
      setTimeout(() => { ring.style.strokeDashoffset = circumference - (s.riskScore / 100) * circumference; }, 100);
    }
  }
  if (ringLabel) { ringLabel.textContent = s.riskCategory + " Risk"; ringLabel.style.color = cat.color; }

  // Info cards
  const fillEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  fillEl("p-attendance", `${s.attendance}%`);
  fillEl("p-score", `${s.academicScore}%`);
  fillEl("p-income", s.incomeTier);
  fillEl("p-distance", `${s.distanceKm} km`);
  fillEl("p-parentEdu", s.parentalEducation);
  fillEl("p-engagement", s.parentEngagement);
  fillEl("p-gender", s.gender);
  fillEl("p-caste", s.casteCategory);
  fillEl("p-siblings", s.siblings);
  fillEl("p-working", s.workingChild ? "Yes ⚠️" : "No");
  fillEl("p-lunch", s.freeLunchScheme ? "Yes" : "No");
  fillEl("p-scholarship", s.scholarshipReceived ? "Yes ✓" : "No");
  fillEl("p-prevDropout", s.prevDropout ? "Yes ⚠️" : "No");
  fillEl("p-behavioral", s.behavioralFlags > 0 ? `${s.behavioralFlags} flag(s)` : "None");
  fillEl("p-phone", s.phone);
  fillEl("p-address", s.address);

  // Factor bars
  const factorEl = document.getElementById("factor-bars");
  if (factorEl) {
    factorEl.innerHTML = s.factorBreakdown.map(f => {
      const col = f.value >= 75 ? "#ef4444" : f.value >= 50 ? "#f97316" : f.value >= 25 ? "#eab308" : "#22c55e";
      return `<div class="factor-bar-item">
        <div class="factor-label"><span>${f.label}</span><span class="factor-weight">${f.weight}</span></div>
        <div class="factor-bar-bg"><div class="factor-bar-fill" style="width:${f.value}%;background:${col}"></div></div>
        <div class="factor-score" style="color:${col}">${f.value}</div>
      </div>`;
    }).join("");
  }

  // Recommendations
  const recEl = document.getElementById("recommendations");
  if (recEl) {
    recEl.innerHTML = s.recommendations.map(r => {
      const colors = { high: "#ef4444", medium: "#f97316", low: "#22c55e" };
      const col = colors[r.priority];
      return `<div class="rec-card" style="border-left:3px solid ${col}">
        <div class="rec-top">
          <span class="rec-icon">${r.icon}</span>
          <span class="rec-priority" style="color:${col}">${r.priority.toUpperCase()} PRIORITY</span>
        </div>
        <p class="rec-text">${r.text}</p>
        <button class="rec-action-btn" onclick="addInterventionFromRec(${s.id},'${r.action.replace(/'/g,"\\'")}')">+ ${r.action}</button>
      </div>`;
    }).join("");
  }

  setTimeout(() => {
    window.Charts.renderAttendanceTrend("chart-att-trend", s);
    window.Charts.renderFactorRadar("chart-radar", s);
    window.Charts.renderGradeTrend("chart-grade-trend", s);
  }, 80);
}

function addInterventionFromRec(studentId, action) {
  const s = allStudents.find(x => x.id === studentId);
  if (!s) return;
  const exists = interventions.find(i => i.studentId === studentId && i.type === action && i.status === "Active");
  if (exists) { showToast("Intervention already active!", "warning"); return; }
  const newInt = { id: interventionCounter++, studentId, studentName: s.name, schoolName: s.schoolName, type: action, status: "Active", date: new Date().toLocaleDateString("en-IN"), notes: `AI-recommended: ${action}`, addedBy: "System" };
  interventions.push(newInt);
  saveInterventions();
  showToast(`Intervention "${action}" added!`, "success");
}

// ────────────────────────────────────────────────────────────
// ANALYTICS
// ────────────────────────────────────────────────────────────
function renderAnalyticsView() {
  const s = allStudents;

  // Use ML school predictions if available, otherwise calculate manually
  const avgRiskSchool = window.SchoolPredictions ? window.SchoolPredictions.map(sp => {
    const school = window.AppData.SCHOOLS.find(sc => sc.id === sp.id);
    return {
      name: school ? school.name.replace("Govt. ","").split(",")[0] : `School ${sp.id}`,
      avg: sp.avg_risk_score,
      count: sp.total_students,
      district: sp.district,
      riskCategory: sp.risk_category,
      criticalPercentage: sp.critical_percentage
    };
  }) : window.AppData.SCHOOLS.map(sc => {
    const schoolStudents = s.filter(x => x.schoolId === sc.id);
    const avg = schoolStudents.length ? (schoolStudents.reduce((a, b) => a + b.riskScore, 0) / schoolStudents.length).toFixed(1) : 0;
    return { name: sc.name.replace("Govt. ","").split(",")[0], avg: parseFloat(avg), count: schoolStudents.length, district: sc.district };
  });

  const statsEl = document.getElementById("analytics-stats");
  if (statsEl) {
    statsEl.innerHTML = avgRiskSchool.map(sc => {
      const riskCat = window.RiskEngine.getRiskCategory(sc.avg);
      const col = riskCat.color;
      const riskBadge = sc.riskCategory ? `<div style="display:inline-block;margin-left:8px;padding:1px 4px;border-radius:3px;background:${getRiskColor(sc.riskCategory)};color:white;font-size:10px;">${getRiskIcon(sc.riskCategory)} ${sc.riskCategory}</div>` : '';

      return `<div class="analytics-stat-card">
        <div class="asc-school">${sc.name}${riskBadge}</div>
        <div class="asc-district">${sc.district} District</div>
        <div class="asc-risk" style="color:${col}">${sc.avg}%</div>
        <div class="asc-label">Avg. Risk Score</div>
        <div class="asc-count">${sc.count} students${sc.criticalPercentage ? ` • ${sc.criticalPercentage}% critical` : ''}</div>
      </div>`;
    }).join("");
  }

  setTimeout(() => {
    window.Charts.renderGradeRiskBar("chart-grade-risk", s);
    window.Charts.renderAttendanceDist("chart-att-dist", s);
    window.Charts.renderIncomeRiskChart("chart-income-risk", s);
  }, 80);
}

// ────────────────────────────────────────────────────────────
// INTERVENTIONS
// ────────────────────────────────────────────────────────────
function renderInterventionsView() {
  const typeFilter = document.getElementById("int-filter-type")?.value || "all";
  const statusFilter = document.getElementById("int-filter-status")?.value || "all";
  const searchQ = document.getElementById("int-search")?.value?.toLowerCase() || "";

  let data = [...interventions];
  if (typeFilter !== "all") data = data.filter(i => i.type === typeFilter);
  if (statusFilter !== "all") data = data.filter(i => i.status === statusFilter);
  if (searchQ) data = data.filter(i => i.studentName.toLowerCase().includes(searchQ));

  const el = document.getElementById("interventions-list");
  if (!el) return;

  document.getElementById("int-total").textContent = interventions.length;
  document.getElementById("int-active").textContent = interventions.filter(i => i.status === "Active").length;
  document.getElementById("int-completed").textContent = interventions.filter(i => i.status === "Completed").length;

  if (!data.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><h3>No Interventions Yet</h3><p>Add interventions from a student's profile, or use the form below.</p></div>`;
    return;
  }

  el.innerHTML = data.sort((a, b) => b.id - a.id).map(i => {
    const sc = i.status === "Active" ? "#22c55e" : i.status === "Completed" ? "#60a5fa" : "#6b7280";
    const student = allStudents.find(s => s.id === i.studentId);
    return `<div class="int-card">
      <div class="int-header">
        <div class="int-title">
          <span class="int-type-badge">${i.type}</span>
          <span class="int-status" style="background:${sc}22;color:${sc}">● ${i.status}</span>
        </div>
        <div class="int-actions">
          ${i.status === "Active" ? `<button class="int-btn complete" onclick="completeIntervention(${i.id})">✓ Complete</button>` : ""}
          <button class="int-btn delete" onclick="deleteIntervention(${i.id})">✕</button>
        </div>
      </div>
      <div class="int-student" onclick="openProfile(${i.studentId})">👤 ${i.studentName} ${student ? `<span class="int-risk" style="color:${student.riskColor}">(${student.riskCategory} Risk)</span>` : ""}</div>
      <div class="int-school">🏫 ${i.schoolName}</div>
      <div class="int-meta">📅 Added: ${i.date} · By: ${i.addedBy}</div>
      ${i.notes ? `<div class="int-notes">💬 ${i.notes}</div>` : ""}
    </div>`;
  }).join("");

  const form = document.getElementById("add-intervention-form");
  const studSelect = document.getElementById("int-student-select");
  if (studSelect && studSelect.options.length <= 1) {
    const critHighStudents = allStudents.filter(s => ["Critical","High"].includes(s.riskCategory));
    studSelect.innerHTML = `<option value="">Select Student (Critical/High Risk)</option>` + critHighStudents.map(s => `<option value="${s.id}">${s.name} — ${s.grade} — ${s.riskCategory}</option>`).join("");
  }
  if (form && !form._bound) {
    form._bound = true;
    form.addEventListener("submit", handleAddIntervention);
  }

  document.getElementById("int-filter-type")?.addEventListener("change", renderInterventionsView);
  document.getElementById("int-filter-status")?.addEventListener("change", renderInterventionsView);
  document.getElementById("int-search")?.addEventListener("input", renderInterventionsView);
}

function handleAddIntervention(e) {
  e.preventDefault();
  const studentId = parseInt(document.getElementById("int-student-select").value);
  const type = document.getElementById("int-type").value;
  const notes = document.getElementById("int-notes-input").value;
  if (!studentId) { showToast("Please select a student", "warning"); return; }
  const s = allStudents.find(x => x.id === studentId);
  const newInt = { id: interventionCounter++, studentId, studentName: s.name, schoolName: s.schoolName, type, status: "Active", date: new Date().toLocaleDateString("en-IN"), notes, addedBy: "Admin" };
  interventions.push(newInt);
  saveInterventions();
  e.target.reset();
  showToast("Intervention added successfully!", "success");
  renderInterventionsView();
}

function completeIntervention(id) {
  const i = interventions.find(x => x.id === id);
  if (i) { i.status = "Completed"; saveInterventions(); renderInterventionsView(); showToast("Intervention marked complete!", "success"); }
}

function deleteIntervention(id) {
  interventions = interventions.filter(x => x.id !== id);
  saveInterventions();
  renderInterventionsView();
  showToast("Intervention removed.", "info");
}

function saveInterventions() {
  localStorage.setItem("interventions", JSON.stringify(interventions));
  updateAlertBadge();
}

// ────────────────────────────────────────────────────────────
// REPORTS
// ────────────────────────────────────────────────────────────
function renderReportsView() {
  const s = allStudents;
  const totalRisk = s.filter(x => ["Critical","High"].includes(x.riskCategory)).length;
  const bplRisk = s.filter(x => x.incomeTier === "BPL" && ["Critical","High"].includes(x.riskCategory)).length;
  const femaleRisk = s.filter(x => x.gender === "Female" && ["Critical","High"].includes(x.riskCategory)).length;
  const workingKids = s.filter(x => x.workingChild).length;

  document.getElementById("rep-total-risk").textContent = totalRisk;
  document.getElementById("rep-bpl").textContent = bplRisk;
  document.getElementById("rep-female-risk").textContent = femaleRisk;
  document.getElementById("rep-working").textContent = workingKids;
  document.getElementById("rep-no-scholarship").textContent = s.filter(x => x.incomeTier === "BPL" && !x.scholarshipReceived).length;
  document.getElementById("rep-prev-dropout").textContent = s.filter(x => x.prevDropout).length;
  document.getElementById("rep-dist-risk").textContent = s.filter(x => x.distanceKm > 10 && x.riskCategory !== "Low").length;
  document.getElementById("rep-interventions").textContent = interventions.length;
}

function exportCSV() {
  const headers = ["ID","Name","Gender","Age","Grade","School","District","Attendance%","AcademicScore%","IncomeTier","ParentalEdu","CasteCategory","DistanceKm","Siblings","WorkingChild","PrevDropout","FreeLunch","Scholarship","ParentEngagement","BehavioralFlags","RiskScore","RiskCategory"];
  const rows = allStudents.map(s => [
    s.id, s.name, s.gender, s.age, s.grade, s.schoolName, s.district,
    s.attendance, s.academicScore, s.incomeTier, s.parentalEducation,
    s.casteCategory, s.distanceKm, s.siblings, s.workingChild, s.prevDropout,
    s.freeLunchScheme, s.scholarshipReceived, s.parentEngagement, s.behavioralFlags,
    s.riskScore, s.riskCategory
  ].map(v => `"${v}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `dropout_risk_report_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast("CSV exported successfully!", "success");
}

// ────────────────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────────────────
function showToast(msg, type = "info") {
  const colors = { success: "#22c55e", warning: "#eab308", error: "#ef4444", info: "#60a5fa" };
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.cssText = `border-left:4px solid ${colors[type]}`;
  toast.innerHTML = `<span>${msg}</span>`;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 3000);
}

window.openProfile = openProfile;
window.changePage = changePage;
window.exportCSV = exportCSV;
window.completeIntervention = completeIntervention;
window.deleteIntervention = deleteIntervention;
window.addInterventionFromRec = addInterventionFromRec;
