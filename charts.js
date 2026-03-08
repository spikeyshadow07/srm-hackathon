// ============================================================
// Charts — Chart.js wrappers for AI Early Warning System
// ============================================================

let chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

const CHART_DEFAULTS = {
  color: "#94a3b8",
  gridColor: "rgba(148,163,184,0.1)",
  tickColor: "rgba(148,163,184,0.6)",
};

// ─── Dashboard: Risk Distribution Donut ─────────────────────
function renderRiskDonut(canvasId, students) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  students.forEach(s => counts[s.riskCategory]++);
  chartInstances[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Critical", "High", "Medium", "Low"],
      datasets: [{
        data: [counts.Critical, counts.High, counts.Medium, counts.Low],
        backgroundColor: ["#ef4444","#f97316","#eab308","#22c55e"],
        borderColor: "#0f172a",
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "70%",
      plugins: {
        legend: { position: "bottom", labels: { color: CHART_DEFAULTS.color, padding: 16, font: { size: 12 } } },
        tooltip: { callbacks: { label: (context) => ` ${context.label}: ${context.parsed} students (${((context.parsed/students.length)*100).toFixed(1)}%)` } },
      },
      animation: { animateRotate: true, duration: 800 },
    },
  });
}

// ─── Dashboard: Monthly Trend Area Chart ────────────────────
function renderMonthlyTrend(canvasId, students) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const months = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
  const criticalByMonth = months.map((m, i) => {
    const total = students.reduce((sum, s) => {
      const att = s.attendanceTrend[i]?.value || 75;
      return sum + (att < 60 ? 1 : 0);
    }, 0);
    return total;
  });
  const highByMonth = months.map((m, i) => {
    const total = students.reduce((sum, s) => {
      const att = s.attendanceTrend[i]?.value || 75;
      return sum + (att >= 60 && att < 75 ? 1 : 0);
    }, 0);
    return total;
  });
  chartInstances[canvasId] = new Chart(ctx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Critical Risk",
          data: criticalByMonth,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.12)",
          fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7,
        },
        {
          label: "High Risk",
          data: highByMonth,
          borderColor: "#f97316",
          backgroundColor: "rgba(249,115,22,0.08)",
          fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: CHART_DEFAULTS.color, font: { size: 12 } } } },
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor } },
        y: { ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor }, beginAtZero: true },
      },
      animation: { duration: 800 },
    },
  });
}

// ─── Dashboard: School-wise Risk Bar Chart ───────────────────
function renderSchoolRiskBar(canvasId, students, schools) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const schoolLabels = schools.map(s => s.name.replace("Govt. ", "").replace(" School,", ","));

  // Use ML school predictions if available, otherwise calculate from students
  let criticalCounts, highCounts, medCounts;

  if (window.SchoolPredictions) {
    criticalCounts = schools.map(s => {
      const pred = window.SchoolPredictions.find(sp => sp.id === s.id);
      return pred ? pred.critical_students : 0;
    });
    highCounts = schools.map(s => {
      const pred = window.SchoolPredictions.find(sp => sp.id === s.id);
      return pred ? pred.high_students : 0;
    });
    medCounts = schools.map(s => {
      const pred = window.SchoolPredictions.find(sp => sp.id === s.id);
      return pred ? pred.medium_students : 0;
    });
  } else {
    criticalCounts = schools.map(s => students.filter(st => st.schoolId === s.id && st.riskCategory === "Critical").length);
    highCounts = schools.map(s => students.filter(st => st.schoolId === s.id && st.riskCategory === "High").length);
    medCounts = schools.map(s => students.filter(st => st.schoolId === s.id && st.riskCategory === "Medium").length);
  }

  chartInstances[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: schoolLabels,
      datasets: [
        { label: "Critical", data: criticalCounts, backgroundColor: "rgba(239,68,68,0.8)", borderRadius: 4 },
        { label: "High", data: highCounts, backgroundColor: "rgba(249,115,22,0.8)", borderRadius: 4 },
        { label: "Medium", data: medCounts, backgroundColor: "rgba(234,179,8,0.8)", borderRadius: 4 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: CHART_DEFAULTS.color } } },
      scales: {
        x: { stacked: true, ticks: { color: CHART_DEFAULTS.tickColor, maxRotation: 15 }, grid: { color: CHART_DEFAULTS.gridColor } },
        y: { stacked: true, ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor }, beginAtZero: true },
      },
      animation: { duration: 800 },
    },
  });
}

// ─── Student Profile: Attendance Trend ──────────────────────
function renderAttendanceTrend(canvasId, student) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const labels = student.attendanceTrend.map(d => d.month);
  const data = student.attendanceTrend.map(d => d.value);
  const color = student.attendance < 60 ? "#ef4444" : student.attendance < 75 ? "#f97316" : "#22c55e";
  chartInstances[canvasId] = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Attendance %",
        data,
        borderColor: color,
        backgroundColor: color.replace(")", ",0.12)").replace("rgb", "rgba"),
        fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: color,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor } },
        y: { ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor }, min: 0, max: 100, title: { display: true, text: "Attendance %", color: CHART_DEFAULTS.tickColor } },
      },
      animation: { duration: 600 },
    },
  });
}

// ─── Student Profile: Risk Factor Radar ─────────────────────
function renderFactorRadar(canvasId, student) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const labels = student.factorBreakdown.map(f => f.label.replace(" Risk","").replace(" Background",""));
  const data = student.factorBreakdown.map(f => f.value);
  chartInstances[canvasId] = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [{
        label: "Risk Score",
        data,
        backgroundColor: "rgba(239,68,68,0.15)",
        borderColor: "#ef4444",
        pointBackgroundColor: "#ef4444",
        pointRadius: 5,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { display: false },
          grid: { color: CHART_DEFAULTS.gridColor },
          pointLabels: { color: CHART_DEFAULTS.color, font: { size: 11 } },
          angleLines: { color: CHART_DEFAULTS.gridColor },
        },
      },
      animation: { duration: 700 },
    },
  });
}

// ─── Student Profile: Grade Trend ───────────────────────────
function renderGradeTrend(canvasId, student) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const labels = student.gradeTrend.map(d => d.term);
  const data = student.gradeTrend.map(d => d.value);
  const color = student.academicScore < 40 ? "#ef4444" : student.academicScore < 55 ? "#f97316" : "#60a5fa";
  chartInstances[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Score %",
        data,
        backgroundColor: labels.map(() => color + "bb"),
        borderColor: color,
        borderWidth: 2,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.tickColor, font: { size: 11 } }, grid: { color: CHART_DEFAULTS.gridColor } },
        y: { ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor }, min: 0, max: 100 },
      },
      animation: { duration: 600 },
    },
  });
}

// ─── Analytics: Grade-wise Risk Bar ─────────────────────────
function renderGradeRiskBar(canvasId, students) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const grades = [6,7,8,9,10];
  const gradeLabels = grades.map(g => `Grade ${g}`);
  const getCounts = (cat) => grades.map(g => students.filter(s => s.gradeNum === g && s.riskCategory === cat).length);
  chartInstances[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: gradeLabels,
      datasets: [
        { label: "Critical", data: getCounts("Critical"), backgroundColor: "rgba(239,68,68,0.85)", borderRadius: 4 },
        { label: "High", data: getCounts("High"), backgroundColor: "rgba(249,115,22,0.85)", borderRadius: 4 },
        { label: "Medium", data: getCounts("Medium"), backgroundColor: "rgba(234,179,8,0.85)", borderRadius: 4 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: CHART_DEFAULTS.color } } },
      scales: {
        x: { stacked: true, ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor } },
        y: { stacked: true, ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor } },
      },
    },
  });
}

// ─── Analytics: Attendance Distribution ─────────────────────
function renderAttendanceDist(canvasId, students) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const buckets = ["<40%","40-50%","50-60%","60-70%","70-80%","80-90%",">90%"];
  const ranges = [[0,40],[40,50],[50,60],[60,70],[70,80],[80,90],[90,101]];
  const data = ranges.map(([lo,hi]) => students.filter(s => s.attendance >= lo && s.attendance < hi).length);
  const colors = ["#ef4444","#f97316","#fb923c","#eab308","#84cc16","#22c55e","#10b981"];
  chartInstances[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: buckets,
      datasets: [{
        label: "Students",
        data,
        backgroundColor: colors,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor } },
        y: { ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor } },
      },
    },
  });
}

// ─── Analytics: Income Tier vs Risk ─────────────────────────
function renderIncomeRiskChart(canvasId, students) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const tiers = ["BPL","Lower Middle","Middle"];
  const getCounts = (cat) => tiers.map(t => students.filter(s => s.incomeTier === t && s.riskCategory === cat).length);
  chartInstances[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: tiers,
      datasets: [
        { label: "Critical", data: getCounts("Critical"), backgroundColor: "rgba(239,68,68,0.85)", borderRadius: 4 },
        { label: "High", data: getCounts("High"), backgroundColor: "rgba(249,115,22,0.85)", borderRadius: 4 },
        { label: "Medium", data: getCounts("Medium"), backgroundColor: "rgba(234,179,8,0.85)", borderRadius: 4 },
        { label: "Low", data: getCounts("Low"), backgroundColor: "rgba(34,197,94,0.85)", borderRadius: 4 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: CHART_DEFAULTS.color } } },
      scales: {
        x: { stacked: true, ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor } },
        y: { stacked: true, ticks: { color: CHART_DEFAULTS.tickColor }, grid: { color: CHART_DEFAULTS.gridColor } },
      },
    },
  });
}

window.Charts = {
  renderRiskDonut, renderMonthlyTrend, renderSchoolRiskBar,
  renderAttendanceTrend, renderFactorRadar, renderGradeTrend,
  renderGradeRiskBar, renderAttendanceDist, renderIncomeRiskChart,
  destroyChart,
};
