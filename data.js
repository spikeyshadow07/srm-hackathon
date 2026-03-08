// ============================================================
// Mock Data — AI Early Warning System for Student Dropout Risk
// ============================================================

// Load/SAVE helpers so added schools persist in localStorage (acts as a simple “database”)
function loadSchools() {
  try {
    const stored = localStorage.getItem("schools");
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn("Failed to parse stored schools", e);
  }
  return null;
}

function saveSchools(schools) {
  try {
    localStorage.setItem("schools", JSON.stringify(schools));
  } catch (e) {
    console.warn("Failed to save schools", e);
  }
}

// default list (used only if there is nothing in storage)
const SCHOOLS = loadSchools() || [
  { id: 1, name: "Govt. High School, Rampur", district: "Rampur", lat: 28.81, lng: 79.01 },
  { id: 2, name: "Govt. Sr. Sec. School, Tilak Nagar", district: "Bareilly", lat: 28.37, lng: 79.42 },
  { id: 3, name: "Govt. Middle School, Faizabad Road", district: "Lucknow", lat: 26.85, lng: 81.00 },
  { id: 4, name: "Govt. High School, Sonbhadra", district: "Sonbhadra", lat: 24.68, lng: 83.07 },
  { id: 5, name: "Govt. Composite School, Jhansi", district: "Jhansi", lat: 25.44, lng: 78.57 },
];

const GRADES = ["6", "7", "8", "9", "10"];
const GENDERS = ["Male", "Female"];
const INCOME_TIERS = ["BPL", "Lower Middle", "Middle"];
const PARENTAL_EDU = ["Illiterate", "Primary", "Secondary", "Higher Secondary"];
const CASTE_CATEGORIES = ["General", "OBC", "SC", "ST"];

const FIRST_NAMES_M = ["Aarav","Aditya","Ajay","Akash","Arjun","Deepak","Dinesh","Gaurav","Harish","Jay","Kiran","Lokesh","Manish","Mohit","Naveen","Om","Pawan","Rahul","Rajesh","Ravi","Rohit","Sachin","Sanjay","Suresh","Vijay","Vikram","Vishal","Yogesh","Ankit","Bharat","Chetan","Dev","Girish","Hemant","Ishaan","Jaydev","Karan","Lalit","Manoj","Nikhil","Pradeep","Qasim","Ritesh","Shyam","Tarun","Umesh","Varun","Wasim","Yash","Zaid"];
const FIRST_NAMES_F = ["Aarti","Anita","Anjali","Anupama","Archana","Bina","Deepa","Divya","Geeta","Hemlata","Indu","Jaya","Kavita","Laxmi","Mamta","Nirmala","Poonam","Priya","Rekha","Riya","Savita","Seema","Shilpa","Shruti","Sita","Sonal","Sunita","Usha","Vandana","Varsha","Amrita","Bhumika","Chhaya","Durga","Ekta","Fatima","Gulshan","Hina","Isha","Jyoti","Kamla","Lata","Meena","Nalini","Omkar","Parveen","Radha","Sarla","Tara","Uma"];
const LAST_NAMES = ["Sharma","Verma","Yadav","Singh","Gupta","Patel","Tiwari","Mishra","Dubey","Chauhan","Sahu","Prajapati","Maurya","Rajput","Nishad","Bind","Sonkar","Kol","Gond","Lodhi","Ahirwar","Rawat","Meena","Jatav","Bairwa","Dhobi","Kurmi","Thakur","Pandey","Shukla"];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function randFloat(min, max, decimals = 1) { return parseFloat((Math.random() * (max - min) + min).toFixed(decimals)); }

function generateAttendanceTrend(baseAttendance) {
  const months = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
  return months.map((m, i) => {
    const variation = randFloat(-12, 12);
    const seasonal = i >= 9 ? randFloat(-8, 5) : 0; // Jan-Mar dip
    const trend = baseAttendance < 60 ? -i * 0.8 : 0; // worsening if already low
    const val = Math.max(0, Math.min(100, baseAttendance + variation + seasonal + trend));
    return { month: m, value: parseFloat(val.toFixed(1)) };
  });
}

function generateGradeTrend(baseScore) {
  const terms = ["Term 1 (Mid)", "Term 1 (Final)", "Term 2 (Mid)", "Term 2 (Final)"];
  return terms.map((t, i) => {
    const variation = randFloat(-15, 10);
    const trend = baseScore < 40 ? -i * 3 : 0;
    const val = Math.max(0, Math.min(100, baseScore + variation + trend));
    return { term: t, value: parseFloat(val.toFixed(1)) };
  });
}

let studentIdCounter = 1;

function generateStudent(schoolId) {
  const gender = pick(GENDERS);
  const firstName = gender === "Male" ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
  const lastName = pick(LAST_NAMES);
  const grade = pick(GRADES);
  const incomeTier = pick(INCOME_TIERS);
  const parentalEdu = pick(PARENTAL_EDU);
  const casteCategory = pick(CASTE_CATEGORIES);
  const distanceKm = randFloat(0.5, 18, 1);

  // Risk factors — correlated
  const isHighRisk = Math.random() < 0.30;
  const isMedRisk = !isHighRisk && Math.random() < 0.35;

  let baseAttendance = isHighRisk ? rand(28, 62) : (isMedRisk ? rand(55, 78) : rand(72, 98));
  let baseScore = isHighRisk ? rand(20, 48) : (isMedRisk ? rand(40, 62) : rand(55, 92));

  // Income & distance adjustments
  if (incomeTier === "BPL") { baseAttendance -= rand(3, 10); baseScore -= rand(3, 8); }
  if (distanceKm > 12) { baseAttendance -= rand(3, 8); }
  if (parentalEdu === "Illiterate") { baseScore -= rand(2, 6); }
  if (gender === "Female" && incomeTier !== "Middle") { baseAttendance -= rand(0, 5); }

  baseAttendance = Math.max(10, Math.min(100, baseAttendance));
  baseScore = Math.max(10, Math.min(100, baseScore));

  const prevDropout = isHighRisk ? (Math.random() < 0.45) : (Math.random() < 0.08);
  const freeLunchScheme = incomeTier === "BPL" || incomeTier === "Lower Middle";
  const scholarshipReceived = Math.random() < 0.25;
  const behavioralFlags = isHighRisk ? rand(1, 4) : (isMedRisk ? rand(0, 2) : 0);
  const parentEngagement = isHighRisk ? pick(["None","Rare"]) : (isMedRisk ? pick(["Rare","Occasional"]) : pick(["Occasional","Active"]));

  const siblings = rand(0, 5);
  const workingChild = (incomeTier === "BPL" && rand(1, 10) > 6) || (incomeTier === "Lower Middle" && rand(1, 10) > 8);

  const phone = `+91${rand(7000000000, 9999999999)}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;

  // parent language preference for alerts
  const languages = ["English", "Hindi", "Tamil"];
  const parentLang = languages[rand(0, languages.length - 1)];

  return {
    id: studentIdCounter++,
    name: `${firstName} ${lastName}`,
    gender,
    age: parseInt(grade) + 10 + rand(0, 2),
    grade: `Grade ${grade}`,
    gradeNum: parseInt(grade),
    schoolId,
    schoolName: SCHOOLS.find(s => s.id === schoolId).name,
    district: SCHOOLS.find(s => s.id === schoolId).district,
    rollNo: `${schoolId}${grade}${String(studentIdCounter).padStart(3, "0")}`,
    attendance: baseAttendance,
    academicScore: baseScore,
    incomeTier,
    parentalEducation: parentalEdu,
    casteCategory,
    distanceKm,
    siblings,
    workingChild,
    prevDropout,
    freeLunchScheme,
    scholarshipReceived,
    behavioralFlags,
    parentEngagement,
    attendanceTrend: generateAttendanceTrend(baseAttendance),
    gradeTrend: generateGradeTrend(baseScore),
    phone: phone,
    email: email,
    parentLang: parentLang,
    address: `Village ${pick(["Rampur","Gadarpur","Mirzapur","Shahpur","Kothipur","Sitapur","Deoria","Babhnan"])}, Block ${pick(["North","South","East","West"])}`,
    enrollmentDate: `${rand(1, 28)}-06-${rand(2022, 2024)}`,
    lastUpdated: "07-03-2026",
  };
}

// Generate a set of students distributed across the current SCHOOLS list.
// New schools added later will not automatically gain students unless the caller
// explicitly generates them (see app.js helper below).
function generateAllStudents() {
  const students = [];
  // default ~30 students per school with a bit of random variation
  SCHOOLS.forEach((s, idx) => {
    const count = rand(25, 35);
    for (let i = 0; i < count; i++) {
      students.push(generateStudent(s.id));
    }
  });
  return students;
}

// Seed random for reproducibility (simple LCG)
let seed = 42;
const origRand = Math.random;
Math.random = function() {
  seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF;
  return (seed >>> 0) / 0xFFFFFFFF;
};
const STUDENTS = generateAllStudents();
Math.random = origRand; // Restore

// make helpers available to the rest of the app
window.saveSchools = saveSchools;

window.AppData = { SCHOOLS, STUDENTS, GRADES };
