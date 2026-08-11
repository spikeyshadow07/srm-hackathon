// ============================================================
// Risk Engine — AI Dropout Risk Scoring
// ============================================================

const WEIGHTS = {
  attendance: 0.30,
  academicScore: 0.25,
  socioeconomic: 0.20,
  distance: 0.10,
  familyBackground: 0.10,
  behavioral: 0.05,
};

function normAttendance(val) { return Math.max(0, Math.min(100, (1 - val / 100) * 100)); }
function normAcademic(val) { return Math.max(0, Math.min(100, (1 - val / 100) * 100)); }

function seoScore(student) {
  let score = 0;
  if (student.incomeTier === "BPL") score += 80;
  else if (student.incomeTier === "Lower Middle") score += 45;
  else score += 10;
  if (student.workingChild) score += 20;
  if (!student.scholarshipReceived && student.incomeTier === "BPL") score += 10;
  return Math.min(100, score);
}

function distanceScore(km) {
  if (km <= 2) return 5;
  if (km <= 5) return 20;
  if (km <= 10) return 50;
  if (km <= 15) return 75;
  return 95;
}

function familyScore(student) {
  let score = 0;
  if (student.parentalEducation === "Illiterate") score += 45;
  else if (student.parentalEducation === "Primary") score += 30;
  else if (student.parentalEducation === "Secondary") score += 15;
  else score += 5;
  if (student.prevDropout) score += 30;
  if (student.parentEngagement === "None") score += 20;
  else if (student.parentEngagement === "Rare") score += 10;
  if (student.siblings >= 4) score += 10;
  if (student.gender === "Female" && student.gradeNum >= 8) score += 8;
  return Math.min(100, score);
}

function behavioralScore(flags) {
  return Math.min(100, flags * 22);
}

function computeRiskScore(student) {
  const attScore = normAttendance(student.attendance);
  const acaScore = normAcademic(student.academicScore);
  const socScore = seoScore(student);
  const disScore = distanceScore(student.distanceKm);
  const famScore = familyScore(student);
  const behScore = behavioralScore(student.behavioralFlags);

  const raw =
    attScore * WEIGHTS.attendance +
    acaScore * WEIGHTS.academicScore +
    socScore * WEIGHTS.socioeconomic +
    disScore * WEIGHTS.distance +
    famScore * WEIGHTS.familyBackground +
    behScore * WEIGHTS.behavioral;

  return Math.min(100, Math.max(0, parseFloat(raw.toFixed(1))));
}

function getRiskCategory(score) {
  if (score >= 75) return { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: "🔴" };
  if (score >= 50) return { label: "High", color: "#f97316", bg: "rgba(249,115,22,0.15)", icon: "🟠" };
  if (score >= 25) return { label: "Medium", color: "#eab308", bg: "rgba(234,179,8,0.15)", icon: "🟡" };
  return { label: "Low", color: "#22c55e", bg: "rgba(34,197,94,0.15)", icon: "🟢" };
}

function generateRecommendations(student, riskScore) {
  const recs = [];

  // attendance-based interventions
  if (student.attendance < 60) {
    recs.push({ priority: "high", icon: "📅", text: "Immediate home visit required — attendance critically low. Engage parents/guardians immediately.", action: "Schedule Home Visit" });
  } else if (student.attendance < 75) {
    recs.push({ priority: "medium", icon: "📅", text: "Monitor attendance weekly. Send SMS alerts to parents for every absence.", action: "Enable SMS Alerts" });
  }

  // academic performance interventions
  if (student.academicScore < 40) {
    recs.push({ priority: "high", icon: "📚", text: "Academic score is very low. Offer extra tutoring and remedial coaching.", action: "Enroll in Remedial" });
  } else if (student.academicScore < 55) {
    recs.push({ priority: "medium", icon: "📚", text: "Academic performance below average. Schedule additional tutoring sessions.", action: "Assign Tutor" });
  }

  // behavioral / emotional support
  if (student.behavioralFlags > 0) {
    let text = "";
    if (student.behavioralFlags >= 3) {
      text = "Multiple behavioral flags detected. Arrange counseling sessions with school counselor.";
    } else {
      text = "Behavioral concerns noted. Suggest counseling and mentorship.";
    }
    recs.push({ priority: "high", icon: "🧠", text: text, action: "Schedule Counseling" });
  }

  // socio-economic support
  if (student.incomeTier === "BPL" && !student.scholarshipReceived) {
    recs.push({ priority: "high", icon: "💰", text: "Student qualifies for financial aid/scholarship programs. Initiate application.", action: "Apply for NSP" });
  }
  if (student.incomeTier !== "Middle" && student.prevDropout) {
    // combine income and previous dropout for added urgency
    recs.push({ priority: "high", icon: "⚠️", text: "Previous dropout history plus low income increases risk. Prioritise financial and academic support.", action: "Provide Comprehensive Support" });
  }

  // other existing recommendations
  if (student.workingChild) {
    recs.push({ priority: "high", icon: "🏭", text: "Student engaged in child labour. Alert District Child Protection Officer. Enforce Right to Education.", action: "Alert DCPO" });
  }
  if (student.distanceKm > 10) {
    recs.push({ priority: "medium", icon: "🚌", text: "Distance barrier identified. Register student for school transport scheme or residential hostel.", action: "Assign Transport" });
  }
  if (student.parentEngagement === "None" || student.parentEngagement === "Rare") {
    recs.push({ priority: "medium", icon: "👨‍👩‍👧", text: "Parental disengagement detected. Schedule SMC meeting and conduct parent awareness session.", action: "Schedule SMC Meet" });
  }
  if (student.prevDropout) {
    recs.push({ priority: "high", icon: "⚠️", text: "Previous dropout history — high recurrence risk. Assign dedicated counselor for weekly check-ins.", action: "Assign Counselor" });
  }
  if (student.gender === "Female" && student.gradeNum >= 9 && student.incomeTier !== "Middle") {
    recs.push({ priority: "medium", icon: "👧", text: "Female student at secondary level — welfare check recommended. Connect with Kasturba Gandhi Balika Vidyalaya scheme.", action: "KGBV Referral" });
  }
  if (student.behavioralFlags >= 3) {
    recs.push({ priority: "high", icon: "🧠", text: "Multiple behavioral flags. Refer to school counselor for mental health assessment.", action: "Counselor Referral" });
  }
  if (recs.length === 0) {
    recs.push({ priority: "low", icon: "✅", text: "Student shows no immediate dropout risk factors. Continue monitoring quarterly.", action: "Routine Monitoring" });
  }
  return recs;
}

function getFactorBreakdown(student) {
  return [
    { label: "Attendance Risk", value: parseFloat(normAttendance(student.attendance).toFixed(1)), weight: "30%" },
    { label: "Academic Risk", value: parseFloat(normAcademic(student.academicScore).toFixed(1)), weight: "25%" },
    { label: "Socioeconomic Risk", value: parseFloat(seoScore(student).toFixed(1)), weight: "20%" },
    { label: "Distance Risk", value: parseFloat(distanceScore(student.distanceKm).toFixed(1)), weight: "10%" },
    { label: "Family Background", value: parseFloat(familyScore(student).toFixed(1)), weight: "10%" },
    { label: "Behavioral Risk", value: parseFloat(behavioralScore(student.behavioralFlags).toFixed(1)), weight: "5%" },
  ];
}

// Enrich all students with risk data
// Load ML predictions from embedded JavaScript variable
let mlPredictions = null;

function loadMLPredictionsSync() {
  if (mlPredictions !== null) return mlPredictions;

  try {
    if (typeof window.MLPredictions !== 'undefined') {
      mlPredictions = window.MLPredictions;
      console.log(`✅ Loaded ${mlPredictions.length} ML predictions from embedded data`);
    } else {
      throw new Error('ML predictions not available in window.MLPredictions');
    }
  } catch (e) {
    console.warn('⚠️ ML predictions not available, using manual calculations:', e);
    mlPredictions = [];
  }

  return mlPredictions;
}

function enrichStudents(students) {
  const predictions = loadMLPredictionsSync();

  return students.map(s => {
    // Try to get ML prediction first
    const mlPrediction = predictions.find(p => p.id === s.id);

    let riskScore, riskCat, source;

    if (mlPrediction) {
      // Use ML prediction
      riskScore = mlPrediction.risk_score;
      riskCat = getRiskCategory(riskScore);
      source = 'ML';
      // Override category if ML provides it
      if (mlPrediction.risk_category) {
        const mlCategories = {
          "Critical": { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: "🔴" },
          "High": { label: "High", color: "#f97316", bg: "rgba(249,115,22,0.15)", icon: "🟠" },
          "Medium": { label: "Medium", color: "#eab308", bg: "rgba(234,179,8,0.15)", icon: "🟡" },
          "Low": { label: "Low", color: "#22c55e", bg: "rgba(34,197,94,0.15)", icon: "🟢" }
        };
        riskCat = mlCategories[mlPrediction.risk_category] || riskCat;
      }
    } else {
      // Fall back to manual calculation
      riskScore = computeRiskScore(s);
      riskCat = getRiskCategory(riskScore);
      source = 'Manual';
    }

    console.log(`Student ${s.id}: ${source} risk score ${riskScore.toFixed(1)} (${riskCat.label})`);

    const recommendations = generateRecommendations(s, riskScore);
    const factorBreakdown = getFactorBreakdown(s);
    return { ...s, riskScore, riskCategory: riskCat.label, riskColor: riskCat.color, riskBg: riskCat.bg, riskIcon: riskCat.icon, recommendations, factorBreakdown };
  });
}

window.RiskEngine = { computeRiskScore, getRiskCategory, generateRecommendations, getFactorBreakdown, enrichStudents };
