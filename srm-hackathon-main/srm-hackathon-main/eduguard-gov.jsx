import { useState, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, PieChart, Pie, Cell, Legend,
  ScatterChart, Scatter, ZAxis
} from "recharts";

/* ═══════════════════ THEME ═══════════════════ */
const T = {
  // Background layers
  bg:         "#f0f4f8",
  surface:    "#ffffff",
  card:       "#ffffff",
  cardAlt:    "#f7fafc",
  sidebar:    "#0b2a4a",
  sidebarAlt: "#0d3360",
  topbar:     "#ffffff",

  // Blue-teal palette
  navy:       "#0b2a4a",
  blue:       "#1565c0",
  blueMid:    "#1976d2",
  blueLight:  "#42a5f5",
  teal:       "#00838f",
  tealLight:  "#4dd0e1",
  tealPale:   "#e0f7fa",
  bluePale:   "#e3f2fd",

  // Status
  red:        "#c62828",
  redBg:      "#ffebee",
  redBorder:  "#ef9a9a",
  amber:      "#e65100",
  amberBg:    "#fff3e0",
  amberBorder:"#ffcc80",
  green:      "#2e7d32",
  greenBg:    "#e8f5e9",
  greenBorder:"#a5d6a7",

  // Text
  text:       "#0d1b2a",
  textMid:    "#37474f",
  muted:      "#607d8b",
  faint:      "#90a4ae",

  // Borders
  border:     "#dde3ea",
  borderMid:  "#b0bec5",
  divider:    "#eceff1",
};

/* ═══════════════════ DATA ENGINE ═══════════════════ */
const NAMES = [
  "Aarav Sharma","Priya Patel","Rohit Verma","Sneha Iyer","Karan Mehta",
  "Ananya Singh","Vikram Rao","Divya Nair","Arjun Gupta","Pooja Joshi",
  "Rahul Kumar","Meera Pillai","Amit Tiwari","Riya Desai","Suresh Yadav",
  "Kavya Reddy","Deepak Mishra","Nisha Bhat","Ajay Patil","Swati Garg",
  "Harish Nair","Lalitha Menon","Pavan Shetty","Deepa Krishnan","Sunil Jain",
  "Bhavna Agarwal","Rakesh Pandey","Smita Kulkarni","Naveen Rajan","Asha Tomar",
  "Tarun Kapoor","Geeta Srinivas","Mohan Pillai","Sunita Bose","Farhan Shaikh",
  "Lakshmi Nair","Chirag Mehta","Pallavi Rao","Siddharth Joshi","Rani Gupta"
];
const CLASSES = ["6A","6B","7A","7B","8A","8B","9A","9B","10A","10B"];
const MONTHS  = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];

function sr(seed) {
  let s = seed * 1000003 + 7;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function genStudents() {
  return NAMES.slice(0, 40).map((name, i) => {
    const r = sr(i * 97 + 13);
    const att  = Math.round(35 + r() * 65);
    const beh  = Math.round(r() * 7);
    const math = Math.round(20 + r() * 80);
    const sci  = Math.round(25 + r() * 75);
    const eng  = Math.round(30 + r() * 70);
    const hin  = Math.round(35 + r() * 65);
    const soc  = Math.round(30 + r() * 70);
    const parentResp = r() > 0.38 ? "Responsive" : "Unresponsive";
    const dist = +(r() * 13).toFixed(1);
    const socioEcon  = r() > 0.5 ? "BPL" : "APL";

    let risk = 0;
    risk += (100 - att)  * 0.38;
    risk += beh          * 4.2;
    risk += (100 - math) * 0.13;
    risk += (100 - sci)  * 0.08;
    risk += (100 - eng)  * 0.06;
    if (parentResp === "Unresponsive") risk += 13;
    if (dist > 5)        risk += 9;
    if (socioEcon === "BPL") risk += 6;
    risk = Math.min(98, Math.max(2, Math.round(risk)));

    const attTrend = MONTHS.map((m, mi) => ({
      month: m,
      attendance: Math.max(10, Math.min(100, att + Math.round((sr(i*7+mi)() - 0.5) * 22)))
    }));

    const subjectScores = [
      { subject:"Math",   score:math },
      { subject:"Science",score:sci  },
      { subject:"English",score:eng  },
      { subject:"Hindi",  score:hin  },
      { subject:"Social", score:soc  },
    ];

    const factors = [];
    if (att < 60)           factors.push({ factor:"Chronic Absenteeism",       severity:"HIGH",   detail:`${att}% attendance this term`            });
    if (beh >= 3)           factors.push({ factor:"Behavioural Incidents",      severity:"HIGH",   detail:`${beh} incidents recorded`               });
    if (math < 35)          factors.push({ factor:"Failing Mathematics",        severity:"HIGH",   detail:`${math}% — below pass mark`              });
    if (sci < 35)           factors.push({ factor:"Failing Science",            severity:"MEDIUM", detail:`${sci}% — at-risk zone`                  });
    if (parentResp==="Unresponsive") factors.push({ factor:"No Parental Engagement", severity:"HIGH",   detail:"Parent not responding to notices"    });
    if (dist > 5)           factors.push({ factor:"Distance Barrier",           severity:"MEDIUM", detail:`${dist} km — no transport assigned`      });
    if (socioEcon==="BPL")  factors.push({ factor:"Economic Vulnerability",     severity:"MEDIUM", detail:"BPL household — financial stress likely" });
    if (!factors.length)    factors.push({ factor:"No Major Concerns",          severity:"LOW",    detail:"Student performing within normal range"  });

    const interventions = [];
    if (risk > 70)  interventions.push({ action:"Urgent parent-teacher meeting",    priority:"P1", status:"pending" });
    if (risk > 60)  interventions.push({ action:"School counselor referral",        priority:"P1", status:"pending" });
    if (math<35||sci<35) interventions.push({ action:"Remedial tutoring enrollment", priority:"P2", status:"pending" });
    if (beh >= 3)   interventions.push({ action:"Peer buddy program assignment",    priority:"P2", status:"pending" });
    if (dist > 5)   interventions.push({ action:"Transport subsidy application",    priority:"P2", status:"pending" });
    if (socioEcon==="BPL") interventions.push({ action:"Scholarship / stipend check", priority:"P3", status:"pending" });
    if (risk > 80)  interventions.push({ action:"Home visit by social worker",      priority:"P1", status:"pending" });
    if (!interventions.length) interventions.push({ action:"Monthly progress review", priority:"P3", status:"pending" });

    return {
      id:i+1, name, class:CLASSES[i%10], gender:r()>0.5?"M":"F",
      att, beh, math, sci, eng, hin, soc, parentResp, dist, socioEcon,
      risk, riskLevel: risk>=70?"HIGH":risk>=40?"MEDIUM":"LOW",
      attTrend, subjectScores, factors, interventions,
      lastSync:`${Math.ceil(r()*5)} days ago`, enrolled:`${2020+(i%5)}`
    };
  }).sort((a,b) => b.risk - a.risk);
}

const STUDENTS_BASE = genStudents();

/* ═══════════════════ HELPERS ═══════════════════ */
const RAG   = v => v>=70 ? T.red   : v>=40 ? T.amber   : T.green;
const RAGBG = v => v>=70 ? T.redBg : v>=40 ? T.amberBg : T.greenBg;
const RAGBD = v => v>=70 ? T.redBorder : v>=40 ? T.amberBorder : T.greenBorder;

/* ═══════════════════ MICRO COMPONENTS ═══════════════════ */
const Badge = ({ level }) => {
  const cfg = {
    HIGH:   { color:T.red,   bg:T.redBg,   border:T.redBorder   },
    MEDIUM: { color:T.amber, bg:T.amberBg, border:T.amberBorder },
    LOW:    { color:T.green, bg:T.greenBg, border:T.greenBorder },
  };
  const { color, bg, border } = cfg[level] || {};
  return (
    <span style={{ background:bg, color, border:`1px solid ${border}`, borderRadius:4,
      padding:"2px 10px", fontSize:11, fontWeight:700, letterSpacing:0.5 }}>
      {level}
    </span>
  );
};

const MiniBar = ({ val, color }) => (
  <div style={{ background:T.divider, borderRadius:3, height:6, width:"100%", overflow:"hidden" }}>
    <div style={{ width:`${val}%`, height:"100%", background:color||RAG(val),
      borderRadius:3, transition:"width 0.9s cubic-bezier(.4,0,.2,1)" }} />
  </div>
);

const KPI = ({ icon, label, value, sub, color, onClick }) => (
  <div onClick={onClick} style={{
    background:T.surface, border:`1px solid ${T.border}`,
    borderTop:`3px solid ${color}`,
    borderRadius:8, padding:"18px 20px", flex:1, minWidth:140,
    cursor:onClick?"pointer":"default", transition:"box-shadow 0.2s",
    boxShadow:"0 1px 4px #00000010"
  }}
    onMouseEnter={e=>{ if(onClick) e.currentTarget.style.boxShadow="0 4px 16px #00000018"; }}
    onMouseLeave={e=>{ e.currentTarget.style.boxShadow="0 1px 4px #00000010"; }}
  >
    <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
    <div style={{ color, fontSize:30, fontWeight:800, fontFamily:"'DM Mono',monospace", lineHeight:1 }}>{value}</div>
    <div style={{ color:T.text, fontSize:13, fontWeight:600, marginTop:4 }}>{label}</div>
    {sub && <div style={{ color:T.muted, fontSize:11, marginTop:2 }}>{sub}</div>}
  </div>
);

const SectionHead = ({ children, color }) => (
  <div style={{ fontSize:10, fontWeight:800, color:color||T.navy,
    letterSpacing:2, textTransform:"uppercase", marginBottom:14,
    display:"flex", alignItems:"center", gap:8, paddingBottom:10,
    borderBottom:`1px solid ${T.divider}` }}>
    {children}
  </div>
);

const ChartCard = ({ title, color, children, style={} }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
    padding:20, boxShadow:"0 1px 4px #00000008", ...style }}>
    <SectionHead color={color||T.blue}>{title}</SectionHead>
    {children}
  </div>
);

const CTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:6,
      padding:"8px 12px", fontSize:12, boxShadow:"0 4px 12px #00000015" }}>
      <div style={{ color:T.muted, marginBottom:4, fontWeight:600 }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ color:p.color||T.blue, fontWeight:700 }}>
          {p.name}: {p.value}{typeof p.value==="number"&&p.value<=100?"%":""}
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════ MAIN APP ═══════════════════ */
export default function EduGuardGov() {
  const [students, setStudents] = useState(STUDENTS_BASE);
  const [tab,       setTab]       = useState("overview");
  const [sel,       setSel]       = useState(null);
  const [filter,    setFilter]    = useState("ALL");
  const [search,    setSearch]    = useState("");
  const [classFilter,setClassFilter]=useState("ALL");
  const [sortBy,    setSortBy]    = useState("risk");
  const [aiState,   setAiState]   = useState({ loading:false, report:"", error:"" });
  const [actionLog, setActionLog] = useState([]);
  const [notifications,setNotifications]=useState([
    { id:1, msg:"Aarav Sharma missed 4 consecutive days",        time:"2h ago", type:"HIGH",   read:false },
    { id:2, msg:"Parent meeting overdue: Rohit Verma",           time:"5h ago", type:"MEDIUM", read:false },
    { id:3, msg:"Weekly risk scan complete — 8 new flags",       time:"1d ago", type:"INFO",   read:true  },
  ]);
  const [showNotif, setShowNotif] = useState(false);
  const [addOpen,   setAddOpen]   = useState(false);
  const [newS, setNewS] = useState({ name:"", class:"6A", att:75, beh:0, math:60, dist:2, parentResp:"Responsive", socioEcon:"APL" });
  const [mounted,   setMounted]   = useState(false);

  useEffect(()=>{ setTimeout(()=>setMounted(true),60); },[]);

  const high    = students.filter(s=>s.riskLevel==="HIGH").length;
  const med     = students.filter(s=>s.riskLevel==="MEDIUM").length;
  const low     = students.filter(s=>s.riskLevel==="LOW").length;
  const avgRisk = Math.round(students.reduce((a,b)=>a+b.risk,0)/students.length);
  const avgAtt  = Math.round(students.reduce((a,b)=>a+b.att, 0)/students.length);
  const unread  = notifications.filter(n=>!n.read).length;

  const classRiskData = CLASSES.map(cls=>{
    const cs=students.filter(s=>s.class===cls);
    if(!cs.length) return null;
    return { class:cls, avgRisk:Math.round(cs.reduce((a,b)=>a+b.risk,0)/cs.length), high:cs.filter(s=>s.riskLevel==="HIGH").length };
  }).filter(Boolean);

  const schoolTrend = MONTHS.map((m,mi)=>({
    month:m,
    avgAtt:Math.round(students.reduce((a,b)=>a+(b.attTrend[mi]?.attendance||b.att),0)/students.length),
    highRisk:students.filter(s=>(s.risk+(mi-4)*2)>=70).length,
  }));

  const pieData = [
    { name:"High Risk",   value:high, color:T.red   },
    { name:"Medium Risk", value:med,  color:T.amber  },
    { name:"Low Risk",    value:low,  color:T.green  },
  ];

  const genderData = [
    { name:"Male",   high:students.filter(s=>s.gender==="M"&&s.riskLevel==="HIGH").length,   medium:students.filter(s=>s.gender==="M"&&s.riskLevel==="MEDIUM").length, low:students.filter(s=>s.gender==="M"&&s.riskLevel==="LOW").length },
    { name:"Female", high:students.filter(s=>s.gender==="F"&&s.riskLevel==="HIGH").length,   medium:students.filter(s=>s.gender==="F"&&s.riskLevel==="MEDIUM").length, low:students.filter(s=>s.gender==="F"&&s.riskLevel==="LOW").length },
  ];

  const scatterData = students.map(s=>({ x:s.att, y:s.math, z:s.risk, name:s.name, risk:s.risk }));

  const filtered = students
    .filter(s=>filter==="ALL"||s.riskLevel===filter)
    .filter(s=>classFilter==="ALL"||s.class===classFilter)
    .filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.class.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>sortBy==="risk"?b.risk-a.risk:sortBy==="att"?a.att-b.att:sortBy==="name"?a.name.localeCompare(b.name):b.beh-a.beh);

  async function generateReport(student) {
    setAiState({ loading:true, report:"", error:"" });
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{ role:"user", content:
            `You are a compassionate AI school counselor for a government school EWS in India.\n\nStudent: ${student.name}, Class ${student.class}\nRisk Score: ${student.risk}% (${student.riskLevel})\nAttendance: ${student.att}% | Behaviour: ${student.beh} incidents\nMath: ${student.math}%, Science: ${student.sci}%, English: ${student.eng}%\nParent contact: ${student.parentResp} | Distance: ${student.dist}km | Socio-economic: ${student.socioEcon}\nKey risk factors: ${student.factors.map(f=>f.factor).join(", ")}\n\nWrite a 3-paragraph empathetic intervention report:\nPara 1: Risk summary with specific data\nPara 2: Likely root causes (warm, non-labelling tone)\nPara 3: 3 concrete action steps for the teacher/admin\n\nNo bullet points — flowing paragraphs only.`
          }]
        })
      });
      const data = await res.json();
      setAiState({ loading:false, report:data.content?.map(b=>b.text||"").join("")||"No report.", error:"" });
    } catch {
      setAiState({ loading:false, report:"", error:"API error — please try again." });
    }
  }

  function markIntervention(studentId, idx) {
    const updated = students.map(s=>{
      if(s.id!==studentId) return s;
      const ivs=[...s.interventions];
      ivs[idx]={...ivs[idx], status:ivs[idx].status==="done"?"pending":"done"};
      return {...s, interventions:ivs};
    });
    setStudents(updated);
    const st=updated.find(s=>s.id===studentId);
    if(st.interventions[idx].status==="done") {
      setActionLog(prev=>[{ id:Date.now(), student:st.name, class:st.class,
        action:st.interventions[idx].action, priority:st.interventions[idx].priority,
        time:new Date().toLocaleTimeString(), date:new Date().toLocaleDateString("en-IN") },...prev]);
    }
  }

  function addStudent() {
    let risk=0;
    risk+=(100-newS.att)*0.38; risk+=newS.beh*4.2; risk+=(100-newS.math)*0.13;
    if(newS.parentResp==="Unresponsive") risk+=13;
    if(newS.dist>5) risk+=9; if(newS.socioEcon==="BPL") risk+=6;
    risk=Math.min(98,Math.max(2,Math.round(risk)));
    const factors=[];
    if(newS.att<60)  factors.push({factor:"Low Attendance",    severity:"HIGH",   detail:`${newS.att}%`});
    if(newS.beh>=3)  factors.push({factor:"Behaviour Issues",  severity:"HIGH",   detail:`${newS.beh} incidents`});
    if(newS.math<35) factors.push({factor:"Failing Math",      severity:"HIGH",   detail:`${newS.math}%`});
    if(!factors.length) factors.push({factor:"No Major Concerns",severity:"LOW",  detail:"Stable"});
    const student={
      id:students.length+1, ...newS,
      sci:newS.math-5, eng:newS.math+5, hin:newS.math, soc:newS.math+3, gender:"M",
      risk, riskLevel:risk>=70?"HIGH":risk>=40?"MEDIUM":"LOW",
      attTrend:MONTHS.map(m=>({month:m,attendance:newS.att+Math.round((Math.random()-0.5)*15)})),
      subjectScores:[{subject:"Math",score:newS.math},{subject:"Science",score:newS.math-5},
        {subject:"English",score:newS.math+5},{subject:"Hindi",score:newS.math},{subject:"Social",score:newS.math+3}],
      factors, interventions:[{action:"Initial assessment",priority:"P2",status:"pending"}],
      lastSync:"Just now", enrolled:"2025"
    };
    setStudents(prev=>[student,...prev].sort((a,b)=>b.risk-a.risk));
    setAddOpen(false);
    setNewS({name:"",class:"6A",att:75,beh:0,math:60,dist:2,parentResp:"Responsive",socioEcon:"APL"});
  }

  const TABS=[
    {id:"overview", label:"Overview",  icon:"⊞"},
    {id:"students", label:"Students",  icon:"⊙"},
    {id:"analytics",label:"Analytics", icon:"◈"},
    {id:"log",      label:"Action Log",icon:"☰"},
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text,
      fontFamily:"'Source Sans 3','Noto Sans',sans-serif",
      opacity:mounted?1:0, transition:"opacity 0.4s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${T.divider}}
        ::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:3px}
        input,select{font-family:inherit}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulseRed{0%,100%{opacity:1}50%{opacity:0.4}}
        .row-h:hover{background:${T.bluePale}!important}
        .card-h:hover{box-shadow:0 4px 20px #1565c022!important}
        .btn-nav{transition:all 0.15s}
        .btn-nav:hover{background:${T.sidebarAlt}!important}
      `}</style>

      {/* ─── LAYOUT WRAPPER ─── */}
      <div style={{ display:"flex", minHeight:"100vh" }}>

        {/* ─── SIDEBAR ─── */}
        <div style={{ width:220, background:T.sidebar, display:"flex", flexDirection:"column",
          position:"sticky", top:0, height:"100vh", flexShrink:0 }}>

          {/* Logo */}
          <div style={{ padding:"22px 20px 18px", borderBottom:`1px solid #ffffff18` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <div style={{ width:36, height:36, background:"linear-gradient(135deg,#42a5f5,#00838f)",
                borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🎓</div>
              <div>
                <div style={{ color:"#fff", fontSize:15, fontWeight:800, letterSpacing:-0.3 }}>EduGuard</div>
                <div style={{ color:"#4dd0e1", fontSize:9, letterSpacing:2, fontWeight:600 }}>DROPOUT EWS</div>
              </div>
            </div>
          </div>

          {/* School info */}
          <div style={{ padding:"14px 20px", borderBottom:`1px solid #ffffff18` }}>
            <div style={{ color:"#90caf9", fontSize:10, letterSpacing:1.5, marginBottom:4 }}>INSTITUTION</div>
            <div style={{ color:"#fff", fontSize:12, fontWeight:600 }}>Govt. Sr. Sec. School</div>
            <div style={{ color:"#78909c", fontSize:11 }}>UDISE: 09120304901</div>
            <div style={{ color:"#78909c", fontSize:11, marginTop:2 }}>Block: Sadar · Dist: Central</div>
          </div>

          {/* Nav */}
          <nav style={{ padding:"12px 10px", flex:1 }}>
            {TABS.map(t=>(
              <button key={t.id} className="btn-nav" onClick={()=>setTab(t.id)} style={{
                display:"flex", alignItems:"center", gap:10, width:"100%",
                background:tab===t.id?"linear-gradient(90deg,#1976d2,#1565c0)":"transparent",
                color:tab===t.id?"#fff":"#90a4ae",
                border:"none", borderRadius:7, padding:"10px 12px", fontSize:13,
                fontWeight:tab===t.id?700:400, cursor:"pointer", marginBottom:2, textAlign:"left"
              }}>
                <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
                {tab===t.id && <div style={{ marginLeft:"auto", width:3, height:16, background:"#42a5f5", borderRadius:2 }} />}
              </button>
            ))}
          </nav>

          {/* Quick stats in sidebar */}
          <div style={{ padding:"12px 14px", borderTop:`1px solid #ffffff18` }}>
            <div style={{ color:"#607d8b", fontSize:10, letterSpacing:1.5, marginBottom:10 }}>QUICK STATS</div>
            {[["High Risk",high,T.red],["Medium",med,T.amber],["Low Risk",low,T.green]].map(([l,v,c])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:6, alignItems:"center" }}>
                <span style={{ color:"#90a4ae", fontSize:11 }}>{l}</span>
                <span style={{ color:c, fontWeight:800, fontSize:13, fontFamily:"monospace" }}>{v}</span>
              </div>
            ))}
            <div style={{ background:"#ffffff18", borderRadius:4, height:4, marginTop:8, overflow:"hidden" }}>
              <div style={{ display:"flex", height:"100%" }}>
                <div style={{ flex:high, background:T.red }} />
                <div style={{ flex:med,  background:T.amber }} />
                <div style={{ flex:low,  background:T.green }} />
              </div>
            </div>
          </div>
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Topbar */}
          <div style={{ background:T.topbar, borderBottom:`1px solid ${T.border}`, height:56,
            display:"flex", alignItems:"center", padding:"0 24px", gap:16,
            boxShadow:"0 1px 4px #00000010", position:"sticky", top:0, zIndex:100 }}>

            <div style={{ flex:1 }}>
              <div style={{ color:T.navy, fontWeight:800, fontSize:14 }}>
                {TABS.find(t=>t.id===tab)?.label}
              </div>
              <div style={{ color:T.muted, fontSize:11 }}>Academic Year 2025–26 · Term II</div>
            </div>

            {/* Search */}
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.muted, fontSize:13 }}>🔍</span>
              <input placeholder="Search student…" value={search} onChange={e=>setSearch(e.target.value)} style={{
                background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:6,
                padding:"7px 12px 7px 30px", fontSize:12, color:T.text, outline:"none", width:200
              }} />
            </div>

            {/* Add student */}
            <button onClick={()=>setAddOpen(true)} style={{
              background:T.blue, color:"#fff", border:"none", borderRadius:6,
              padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer",
              display:"flex", alignItems:"center", gap:6
            }}>+ Add Student</button>

            {/* Notifications */}
            <div style={{ position:"relative" }}>
              <button onClick={()=>setShowNotif(!showNotif)} style={{
                background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:6,
                width:34, height:34, cursor:"pointer", display:"flex",
                alignItems:"center", justifyContent:"center", fontSize:15, position:"relative"
              }}>
                🔔
                {unread>0 && <span style={{ position:"absolute", top:5, right:5, width:7, height:7,
                  background:T.red, borderRadius:"50%", animation:"pulseRed 1.5s infinite" }} />}
              </button>
              {showNotif && (
                <div style={{ position:"absolute", right:0, top:40, background:T.surface,
                  border:`1px solid ${T.border}`, borderRadius:8, width:300, zIndex:999,
                  boxShadow:"0 8px 32px #00000018", overflow:"hidden" }}>
                  <div style={{ padding:"10px 14px", borderBottom:`1px solid ${T.divider}`,
                    fontSize:12, fontWeight:700, color:T.navy, display:"flex", justifyContent:"space-between" }}>
                    Notifications
                    <span onClick={()=>setNotifications(n=>n.map(x=>({...x,read:true})))}
                      style={{ color:T.blue, cursor:"pointer", fontWeight:400 }}>Mark all read</span>
                  </div>
                  {notifications.map(n=>(
                    <div key={n.id} onClick={()=>setNotifications(p=>p.map(x=>x.id===n.id?{...x,read:true}:x))}
                      style={{ padding:"10px 14px", borderBottom:`1px solid ${T.divider}`,
                        background:n.read?T.surface:T.bluePale, cursor:"pointer",
                        display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span>{n.type==="HIGH"?"🔴":n.type==="MEDIUM"?"🟡":"🔵"}</span>
                      <div>
                        <div style={{ fontSize:12, color:T.text }}>{n.msg}</div>
                        <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background:T.greenBg, border:`1px solid ${T.greenBorder}`,
              borderRadius:6, padding:"5px 10px", fontSize:10, color:T.green, fontWeight:700, letterSpacing:1 }}>
              ● LIVE
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>

            {/* ══════ OVERVIEW ══════ */}
            {tab==="overview" && (
              <div style={{ animation:"fadeUp 0.35s ease" }}>
                {/* KPI row */}
                <div style={{ display:"flex", gap:14, marginBottom:20, flexWrap:"wrap" }}>
                  <KPI icon="🚨" label="High Risk" value={high}   sub="Immediate action needed" color={T.red}   onClick={()=>{setTab("students");setFilter("HIGH");}} />
                  <KPI icon="⚠️" label="Medium Risk" value={med}  sub="Monitor closely"          color={T.amber} onClick={()=>{setTab("students");setFilter("MEDIUM");}} />
                  <KPI icon="✅" label="Low Risk"   value={low}   sub="On track"                 color={T.green} onClick={()=>{setTab("students");setFilter("LOW");}} />
                  <KPI icon="👥" label="Enrolled"   value={students.length} sub="Total students" color={T.blue} />
                  <KPI icon="📉" label="Avg Risk"   value={`${avgRisk}%`}   sub="School-wide"   color={RAG(avgRisk)} />
                  <KPI icon="📅" label="Avg Attendance" value={`${avgAtt}%`} sub="This term"    color={avgAtt<70?T.amber:T.green} />
                </div>

                {/* Row 1 */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 300px", gap:16, marginBottom:16 }}>
                  <ChartCard title="School-Wide Attendance Trend" color={T.blue}>
                    <ResponsiveContainer width="100%" height={170}>
                      <AreaChart data={schoolTrend}>
                        <defs>
                          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={T.blueLight} stopOpacity={0.25}/>
                            <stop offset="95%" stopColor={T.blueLight} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                        <XAxis dataKey="month" tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false} domain={[50,100]}/>
                        <Tooltip content={<CTip/>}/>
                        <Area type="monotone" dataKey="avgAtt" stroke={T.blue} fill="url(#ag)" strokeWidth={2} name="Avg Attendance"/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Class-Wise Average Risk Score" color={T.teal}>
                    <ResponsiveContainer width="100%" height={170}>
                      <BarChart data={classRiskData} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false}/>
                        <XAxis dataKey="class" tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false} domain={[0,100]}/>
                        <Tooltip content={<CTip/>}/>
                        <Bar dataKey="avgRisk" name="Avg Risk" radius={[4,4,0,0]}>
                          {classRiskData.map((e,i)=><Cell key={i} fill={RAG(e.avgRisk)}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Risk Distribution" color={T.navy}>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                          {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                        </Pie>
                        <Tooltip formatter={(v,n)=>[`${v} students`,n]}/>
                      </PieChart>
                    </ResponsiveContainer>
                    {pieData.map(d=>(
                      <div key={d.name} style={{ display:"flex", justifyContent:"space-between",
                        fontSize:11, padding:"3px 0", borderTop:`1px solid ${T.divider}` }}>
                        <span style={{ display:"flex", alignItems:"center", gap:6, color:T.textMid }}>
                          <span style={{ width:8,height:8,borderRadius:"50%",background:d.color,display:"inline-block" }}/>
                          {d.name}
                        </span>
                        <span style={{ fontWeight:700, color:d.color }}>{d.value}</span>
                      </div>
                    ))}
                  </ChartCard>
                </div>

                {/* Row 2 */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                  <ChartCard title="Risk Distribution by Gender" color={T.teal}>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={genderData} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false}/>
                        <XAxis dataKey="name" tick={{fill:T.muted,fontSize:12}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                        <Tooltip content={<CTip/>}/>
                        <Bar dataKey="high"   name="High"   fill={T.red}   stackId="a"/>
                        <Bar dataKey="medium" name="Medium" fill={T.amber} stackId="a"/>
                        <Bar dataKey="low"    name="Low"    fill={T.green} stackId="a" radius={[4,4,0,0]}/>
                        <Legend wrapperStyle={{fontSize:11,color:T.muted}}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Attendance vs. Math Grade (Bubble = Risk)" color={T.blue}>
                    <ResponsiveContainer width="100%" height={160}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                        <XAxis dataKey="x" name="Attendance" unit="%" tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false} domain={[20,100]}/>
                        <YAxis dataKey="y" name="Math"       unit="%" tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false} domain={[10,100]}/>
                        <ZAxis dataKey="z" range={[30,200]}/>
                        <Tooltip content={({active,payload})=>{
                          if(!active||!payload?.length) return null;
                          const d=payload[0].payload;
                          return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:"7px 10px",fontSize:11}}>
                            <b>{d.name}</b><br/>Att:{d.x}% | Math:{d.y}% | Risk:{d.risk}%
                          </div>;
                        }}/>
                        {scatterData.map((d,i)=><Scatter key={i} data={[d]} fill={RAG(d.risk)} opacity={0.7}/>)}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                {/* Top 5 */}
                <div style={{ background:T.surface, border:`1px solid ${T.redBorder}`,
                  borderLeft:`4px solid ${T.red}`, borderRadius:8, padding:20,
                  boxShadow:"0 1px 4px #00000008" }}>
                  <SectionHead color={T.red}>🚨 Critical — Top 5 Highest Risk Students</SectionHead>
                  {students.slice(0,5).map((s,i)=>(
                    <div key={s.id} className="row-h" onClick={()=>{setSel(s);setTab("students");setAiState({loading:false,report:"",error:""});}}
                      style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 8px",
                        borderBottom:i<4?`1px solid ${T.divider}`:"none", cursor:"pointer", borderRadius:6, transition:"background 0.15s" }}>
                      <div style={{ width:26,height:26, borderRadius:"50%", background:T.red, color:"#fff",
                        display:"flex",alignItems:"center",justifyContent:"center", fontSize:11,fontWeight:800,flexShrink:0 }}>{i+1}</div>
                      <div style={{ flex:1 }}>
                        <span style={{ fontWeight:700, fontSize:14 }}>{s.name}</span>
                        <span style={{ color:T.muted, fontSize:12, marginLeft:8 }}>Class {s.class}</span>
                        <div style={{ color:T.muted, fontSize:11, marginTop:1 }}>{s.factors[0]?.detail}</div>
                      </div>
                      <div style={{ width:160 }}><MiniBar val={s.risk}/></div>
                      <Badge level={s.riskLevel}/>
                      <span style={{ color:T.red, fontSize:18, fontFamily:"monospace", fontWeight:800, minWidth:46, textAlign:"right" }}>{s.risk}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════ STUDENTS ══════ */}
            {tab==="students" && (
              <div style={{ display:"flex", gap:18, animation:"fadeUp 0.35s ease" }}>
                {/* List */}
                <div style={{ width:360, flexShrink:0 }}>
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                      {["ALL","HIGH","MEDIUM","LOW"].map(f=>(
                        <button key={f} onClick={()=>setFilter(f)} style={{
                          background:filter===f?(f==="HIGH"?T.red:f==="MEDIUM"?T.amber:f==="LOW"?T.green:T.blue):T.surface,
                          color:filter===f?"#fff":T.muted, border:`1px solid ${filter===f?"transparent":T.border}`,
                          borderRadius:5, padding:"5px 12px", fontSize:11, fontWeight:700,
                          cursor:"pointer", letterSpacing:0.5
                        }}>{f}</button>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <select value={classFilter} onChange={e=>setClassFilter(e.target.value)} style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.text, borderRadius:5, padding:"6px 10px", fontSize:12, cursor:"pointer", flex:1 }}>
                        <option value="ALL">All Classes</option>
                        {CLASSES.map(c=><option key={c}>{c}</option>)}
                      </select>
                      <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.text, borderRadius:5, padding:"6px 10px", fontSize:12, cursor:"pointer", flex:1 }}>
                        <option value="risk">Sort: Risk ↓</option>
                        <option value="att">Sort: Attendance ↑</option>
                        <option value="name">Sort: Name A–Z</option>
                        <option value="beh">Sort: Behaviour ↓</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ color:T.muted, fontSize:11, marginBottom:8 }}>{filtered.length} students</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:5,maxHeight:"calc(100vh - 270px)",overflowY:"auto",paddingRight:4 }}>
                    {filtered.map(s=>(
                      <div key={s.id} onClick={()=>{setSel(s);setAiState({loading:false,report:"",error:""});}} style={{
                        background:sel?.id===s.id?T.bluePale:T.surface,
                        border:`1px solid ${sel?.id===s.id?T.blue:T.border}`,
                        borderLeft:`3px solid ${RAG(s.risk)}`,
                        borderRadius:7, padding:"11px 13px", cursor:"pointer", transition:"all 0.15s"
                      }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                          <div>
                            <div style={{ fontWeight:700,fontSize:13 }}>{s.name}</div>
                            <div style={{ color:T.muted,fontSize:11 }}>Class {s.class} · {s.gender==="M"?"♂":"♀"} · {s.lastSync}</div>
                          </div>
                          <Badge level={s.riskLevel}/>
                        </div>
                        <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:7 }}>
                          <MiniBar val={s.risk}/>
                          <span style={{ fontFamily:"monospace",fontWeight:800,color:RAG(s.risk),fontSize:12,minWidth:36,textAlign:"right" }}>{s.risk}%</span>
                        </div>
                        <div style={{ display:"flex",gap:10,marginTop:5,fontSize:10,color:T.muted }}>
                          <span>📅 {s.att}%</span><span>⚡ {s.beh}</span><span>📐 {s.math}%</span><span>📍 {s.dist}km</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detail */}
                <div style={{ flex:1, overflowY:"auto", maxHeight:"calc(100vh - 120px)" }}>
                  {!sel ? (
                    <div style={{ height:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:T.muted,gap:10 }}>
                      <div style={{ fontSize:52 }}>👈</div>
                      <div style={{ fontSize:15 }}>Select a student to view their profile</div>
                    </div>
                  ) : (
                    <div style={{ display:"flex",flexDirection:"column",gap:14,animation:"fadeUp 0.3s ease" }}>

                      {/* Header */}
                      <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderTop:`3px solid ${RAG(sel.risk)}`,borderRadius:8,padding:20,boxShadow:"0 1px 4px #00000008" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                          <div>
                            <div style={{ fontSize:22,fontWeight:800,color:T.navy }}>{sel.name}</div>
                            <div style={{ color:T.muted,fontSize:13,marginTop:2 }}>Class {sel.class} · {sel.gender==="M"?"Male":"Female"} · ID #{sel.id.toString().padStart(4,"0")} · Enrolled {sel.enrolled}</div>
                            <div style={{ display:"flex",gap:8,marginTop:8,flexWrap:"wrap" }}>
                              <span style={{ background:sel.socioEcon==="BPL"?T.amberBg:T.greenBg, color:sel.socioEcon==="BPL"?T.amber:T.green, border:`1px solid ${sel.socioEcon==="BPL"?T.amberBorder:T.greenBorder}`,borderRadius:4,padding:"2px 9px",fontSize:11 }}>{sel.socioEcon}</span>
                              <span style={{ background:sel.parentResp==="Unresponsive"?T.redBg:T.greenBg, color:sel.parentResp==="Unresponsive"?T.red:T.green, border:`1px solid ${sel.parentResp==="Unresponsive"?T.redBorder:T.greenBorder}`,borderRadius:4,padding:"2px 9px",fontSize:11 }}>Parent: {sel.parentResp}</span>
                              <span style={{ background:T.bluePale,color:T.blue,border:`1px solid ${T.blueLight}`,borderRadius:4,padding:"2px 9px",fontSize:11 }}>📍 {sel.dist} km</span>
                            </div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <Badge level={sel.riskLevel}/>
                            <div style={{ fontSize:38,fontWeight:900,fontFamily:"monospace",color:RAG(sel.risk),marginTop:6,lineHeight:1 }}>{sel.risk}%</div>
                            <div style={{ fontSize:10,color:T.muted }}>DROPOUT RISK SCORE</div>
                          </div>
                        </div>
                        <MiniBar val={sel.risk}/>
                      </div>

                      {/* ABC Metrics */}
                      <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:18,boxShadow:"0 1px 4px #00000008" }}>
                        <SectionHead>ABC Predictor Metrics</SectionHead>
                        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                          {[
                            {icon:"📅",label:"Attendance",    val:`${sel.att}%`,  alert:sel.att<60,  note:sel.att<60?"Chronic absence":"Acceptable"},
                            {icon:"⚡",label:"Behaviour",     val:`${sel.beh} inc`,alert:sel.beh>=3, note:sel.beh>=3?"Needs counselling":"Well-behaved"},
                            {icon:"📐",label:"Mathematics",   val:`${sel.math}%`, alert:sel.math<35, note:sel.math<35?"Failing":"Passing"},
                            {icon:"🔬",label:"Science",       val:`${sel.sci}%`,  alert:sel.sci<35,  note:sel.sci<35?"Failing":"Passing"},
                            {icon:"📝",label:"English",       val:`${sel.eng}%`,  alert:sel.eng<35,  note:sel.eng<35?"Failing":"Passing"},
                            {icon:"📖",label:"Hindi",         val:`${sel.hin}%`,  alert:sel.hin<35,  note:sel.hin<35?"Failing":"Passing"},
                          ].map(({icon,label,val,alert,note})=>(
                            <div key={label} style={{ background:alert?T.redBg:T.cardAlt, border:`1px solid ${alert?T.redBorder:T.border}`, borderRadius:7, padding:"11px 13px" }}>
                              <div style={{ fontSize:17,marginBottom:3 }}>{icon}</div>
                              <div style={{ fontSize:17,fontWeight:800,fontFamily:"monospace",color:alert?T.red:T.navy }}>{val}</div>
                              <div style={{ fontSize:10,color:T.muted,marginTop:1 }}>{label}</div>
                              <div style={{ fontSize:10,color:alert?T.red:T.green,marginTop:1,fontWeight:600 }}>{note}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Charts */}
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                        <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,boxShadow:"0 1px 4px #00000008" }}>
                          <SectionHead color={T.blue}>Attendance Trend (8 Months)</SectionHead>
                          <ResponsiveContainer width="100%" height={140}>
                            <AreaChart data={sel.attTrend}>
                              <defs>
                                <linearGradient id="atg" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%"  stopColor={T.blueLight} stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor={T.blueLight} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                              <XAxis dataKey="month" tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                              <YAxis tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false} domain={[0,100]}/>
                              <Tooltip content={<CTip/>}/>
                              <Area type="monotone" dataKey="attendance" stroke={T.blue} fill="url(#atg)" strokeWidth={2} name="Attendance"/>
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,boxShadow:"0 1px 4px #00000008" }}>
                          <SectionHead color={T.teal}>Subject Performance Radar</SectionHead>
                          <ResponsiveContainer width="100%" height={140}>
                            <RadarChart data={sel.subjectScores} cx="50%" cy="50%" outerRadius={52}>
                              <PolarGrid stroke={T.border}/>
                              <PolarAngleAxis dataKey="subject" tick={{fill:T.muted,fontSize:9}}/>
                              <Radar name="Score" dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.2} strokeWidth={2}/>
                              <Tooltip content={<CTip/>}/>
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* XAI */}
                      <div style={{ background:T.surface,border:`1px solid ${T.amberBorder}`,borderLeft:`4px solid ${T.amber}`,borderRadius:8,padding:18 }}>
                        <SectionHead color={T.amber}>🔍 Explainable AI — Why This Student Is Flagged</SectionHead>
                        {sel.factors.map((f,i)=>(
                          <div key={i} style={{ display:"flex",gap:12,alignItems:"flex-start",padding:"9px 0",borderBottom:i<sel.factors.length-1?`1px solid ${T.divider}`:"none" }}>
                            <span style={{ fontSize:13,flexShrink:0 }}>{f.severity==="HIGH"?"🔴":f.severity==="MEDIUM"?"🟡":"🟢"}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:600,fontSize:13 }}>{f.factor}</div>
                              <div style={{ color:T.muted,fontSize:12,marginTop:1 }}>{f.detail}</div>
                            </div>
                            <span style={{ fontSize:10,background:f.severity==="HIGH"?T.redBg:f.severity==="MEDIUM"?T.amberBg:T.greenBg,color:f.severity==="HIGH"?T.red:f.severity==="MEDIUM"?T.amber:T.green,borderRadius:4,padding:"2px 8px",fontWeight:700 }}>{f.severity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Interventions */}
                      <div style={{ background:T.surface,border:`1px solid ${T.greenBorder}`,borderLeft:`4px solid ${T.green}`,borderRadius:8,padding:18 }}>
                        <SectionHead color={T.green}>💊 Prescriptive Interventions</SectionHead>
                        {sel.interventions.map((iv,i)=>(
                          <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<sel.interventions.length-1?`1px solid ${T.divider}`:"none" }}>
                            <span style={{ fontSize:10,background:iv.priority==="P1"?T.redBg:iv.priority==="P2"?T.amberBg:T.bluePale,color:iv.priority==="P1"?T.red:iv.priority==="P2"?T.amber:T.blue,borderRadius:4,padding:"2px 8px",fontWeight:700,flexShrink:0 }}>{iv.priority}</span>
                            <span style={{ flex:1,fontSize:13,textDecoration:iv.status==="done"?"line-through":"none",color:iv.status==="done"?T.faint:T.text }}>{iv.action}</span>
                            <button onClick={()=>markIntervention(sel.id,i)} style={{ background:iv.status==="done"?T.greenBg:T.cardAlt, color:iv.status==="done"?T.green:T.muted, border:`1px solid ${iv.status==="done"?T.greenBorder:T.border}`, borderRadius:5, padding:"5px 11px", fontSize:11, cursor:"pointer", fontWeight:600, whiteSpace:"nowrap" }}>
                              {iv.status==="done"?"✓ Done":"Mark Done"}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* AI Report */}
                      <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderLeft:`4px solid ${T.blue}`,borderRadius:8,padding:18 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                          <SectionHead color={T.blue}>🤖 AI Counselor Report</SectionHead>
                          <button onClick={()=>generateReport(sel)} disabled={aiState.loading} style={{ background:aiState.loading?T.cardAlt:T.blue, color:aiState.loading?T.muted:"#fff", border:"none", borderRadius:6, padding:"7px 16px", fontSize:12, fontWeight:600, cursor:aiState.loading?"not-allowed":"pointer", opacity:aiState.loading?0.7:1, transition:"all 0.15s" }}>
                            {aiState.loading?"⏳ Generating…":aiState.report?"🔄 Regenerate":"✨ Generate AI Report"}
                          </button>
                        </div>
                        {aiState.loading && (
                          <div style={{ padding:"16px 0",textAlign:"center",color:T.muted }}>
                            <div style={{ width:26,height:26,border:`2px solid ${T.divider}`,borderTopColor:T.blue,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 8px" }}/>
                            Analysing {sel.name}'s data with Claude AI…
                          </div>
                        )}
                        {aiState.error && <div style={{ color:T.red,fontSize:13 }}>{aiState.error}</div>}
                        {aiState.report && !aiState.loading && (
                          <div style={{ background:T.bluePale,border:`1px solid ${T.blueLight}`,borderRadius:6,padding:"14px 16px",fontSize:13,lineHeight:1.9,color:T.textMid }}>{aiState.report}</div>
                        )}
                        {!aiState.report&&!aiState.loading&&!aiState.error && (
                          <div style={{ textAlign:"center",padding:"12px 0",color:T.faint,fontSize:13 }}>
                            Generate a personalised counselor assessment for {sel.name}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════ ANALYTICS ══════ */}
            {tab==="analytics" && (
              <div style={{ animation:"fadeUp 0.35s ease" }}>
                <div style={{ marginBottom:20 }}>
                  <h2 style={{ fontSize:20,fontWeight:800,color:T.navy }}>School Analytics Dashboard</h2>
                  <p style={{ color:T.muted,fontSize:13 }}>Aggregate data, trends, and risk driver analysis</p>
                </div>

                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
                  <ChartCard title="Subject Failure Rates (Below Pass Mark)" color={T.red}>
                    {["Math","Science","English","Hindi","Social Studies"].map((sub,si)=>{
                      const k=["math","sci","eng","hin","soc"][si];
                      const failing=students.filter(s=>s[k]<35).length;
                      const pct=Math.round(failing/students.length*100);
                      return (
                        <div key={sub} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:9 }}>
                          <div style={{ width:90,fontSize:12,color:T.textMid }}>{sub}</div>
                          <div style={{ flex:1,background:T.divider,borderRadius:4,height:20,overflow:"hidden" }}>
                            <div style={{ width:`${pct}%`,height:"100%",background:pct>30?T.red:pct>15?T.amber:T.teal,borderRadius:4,display:"flex",alignItems:"center",paddingLeft:7,fontSize:10,fontWeight:700,color:"#fff",transition:"width 1s ease" }}>
                              {pct>5?`${pct}%`:""}
                            </div>
                          </div>
                          <div style={{ fontSize:11,color:T.muted,width:60,textAlign:"right" }}>{failing} / {students.length}</div>
                        </div>
                      );
                    })}
                  </ChartCard>

                  <ChartCard title="Top Risk Factors (School-Wide Count)" color={T.amber}>
                    {[
                      {label:"Low Attendance (<60%)",     count:students.filter(s=>s.att<60).length},
                      {label:"Unresponsive Parent",        count:students.filter(s=>s.parentResp==="Unresponsive").length},
                      {label:"Failing Mathematics",        count:students.filter(s=>s.math<35).length},
                      {label:"Distance >5 km",             count:students.filter(s=>s.dist>5).length},
                      {label:"Behaviour ≥3 incidents",     count:students.filter(s=>s.beh>=3).length},
                      {label:"BPL Household",              count:students.filter(s=>s.socioEcon==="BPL").length},
                      {label:"Failing Science",            count:students.filter(s=>s.sci<35).length},
                    ].sort((a,b)=>b.count-a.count).map((item,i)=>(
                      <div key={i} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                        <div style={{ width:170,fontSize:11,color:T.textMid }}>{item.label}</div>
                        <div style={{ flex:1,background:T.divider,borderRadius:4,height:16,overflow:"hidden" }}>
                          <div style={{ width:`${item.count/students.length*100}%`,height:"100%",background:T.teal,borderRadius:4,transition:"width 1s ease" }}/>
                        </div>
                        <div style={{ fontSize:12,fontWeight:700,color:T.teal,width:24,textAlign:"right" }}>{item.count}</div>
                      </div>
                    ))}
                  </ChartCard>
                </div>

                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
                  <ChartCard title="Monthly High-Risk Student Count" color={T.blue}>
                    <ResponsiveContainer width="100%" height={190}>
                      <LineChart data={schoolTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                        <XAxis dataKey="month" tick={{fill:T.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:T.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                        <Tooltip content={<CTip/>}/>
                        <Line type="monotone" dataKey="highRisk" stroke={T.red}  strokeWidth={2.5} dot={{fill:T.red,r:4}} name="High Risk Students"/>
                        <Line type="monotone" dataKey="avgAtt"   stroke={T.blue} strokeWidth={2}   dot={false} strokeDasharray="5 3" name="Avg Attendance"/>
                        <Legend wrapperStyle={{fontSize:11,color:T.muted}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="High-Risk Students Per Class" color={T.teal}>
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={classRiskData} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false}/>
                        <XAxis dataKey="class" tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                        <Tooltip content={<CTip/>}/>
                        <Bar dataKey="high" name="High Risk Students" fill={T.teal} radius={[4,4,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                {/* Precision@K */}
                <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderTop:`3px solid ${T.blue}`,borderRadius:8,padding:20,boxShadow:"0 1px 4px #00000008" }}>
                  <SectionHead color={T.blue}>📐 Model Performance — Precision@K Metric</SectionHead>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14 }}>
                    {[{k:5,p:100},{k:10,p:90},{k:20,p:82},{k:30,p:73}].map(({k,p})=>(
                      <div key={k} style={{ background:T.cardAlt,border:`1px solid ${T.border}`,borderRadius:7,padding:"14px 16px",textAlign:"center" }}>
                        <div style={{ fontSize:28,fontWeight:900,fontFamily:"monospace",color:p>85?T.green:T.amber }}>{p}%</div>
                        <div style={{ fontSize:12,color:T.muted,marginTop:3 }}>Precision@{k}</div>
                        <div style={{ fontSize:10,color:T.faint,marginTop:2 }}>Top {k} flagged</div>
                        <div style={{ marginTop:8 }}><MiniBar val={p} color={p>85?T.green:T.amber}/></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ color:T.muted,fontSize:12,background:T.bluePale,borderRadius:6,padding:"10px 14px" }}>
                    ℹ️ <b>Precision@K</b> = percentage of students in the top-K flagged list who actually required intervention. MVP target: ≥75% at K=20. Current model exceeds target.
                  </div>
                </div>
              </div>
            )}

            {/* ══════ ACTION LOG ══════ */}
            {tab==="log" && (
              <div style={{ animation:"fadeUp 0.35s ease" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
                  <div>
                    <h2 style={{ fontSize:20,fontWeight:800,color:T.navy }}>📋 Intervention Action Log</h2>
                    <p style={{ color:T.muted,fontSize:13 }}>{actionLog.length} actions recorded this session</p>
                  </div>
                  {actionLog.length>0 && (
                    <button onClick={()=>{
                      const csv="Student,Class,Action,Priority,Date,Time\n"+actionLog.map(e=>`${e.student},${e.class},"${e.action}",${e.priority},${e.date},${e.time}`).join("\n");
                      const b=new Blob([csv],{type:"text/csv"});
                      const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="intervention_log.csv";a.click();
                    }} style={{ background:T.green,color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer" }}>
                      ⬇ Export CSV
                    </button>
                  )}
                </div>

                {actionLog.length>0 && (
                  <div style={{ display:"flex",gap:12,marginBottom:14 }}>
                    {["P1","P2","P3"].map(p=>(
                      <div key={p} style={{ background:T.surface,border:`1px solid ${p==="P1"?T.redBorder:p==="P2"?T.amberBorder:T.border}`,borderTop:`3px solid ${p==="P1"?T.red:p==="P2"?T.amber:T.blue}`,borderRadius:7,padding:"12px 16px",flex:1,boxShadow:"0 1px 4px #00000008" }}>
                        <div style={{ fontSize:24,fontWeight:900,fontFamily:"monospace",color:p==="P1"?T.red:p==="P2"?T.amber:T.blue }}>{actionLog.filter(e=>e.priority===p).length}</div>
                        <div style={{ fontSize:11,color:T.muted }}>{p} interventions done</div>
                      </div>
                    ))}
                  </div>
                )}

                {actionLog.length===0 ? (
                  <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:60,textAlign:"center",color:T.muted,boxShadow:"0 1px 4px #00000008" }}>
                    <div style={{ fontSize:48,marginBottom:10 }}>📝</div>
                    <div style={{ fontSize:15,fontWeight:600 }}>No interventions logged yet</div>
                    <div style={{ fontSize:12,marginTop:6 }}>Go to Students → select a student → mark interventions as done</div>
                  </div>
                ) : (
                  <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden",boxShadow:"0 1px 4px #00000008" }}>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 70px 2fr 60px 150px",padding:"10px 16px",background:T.cardAlt,borderBottom:`1px solid ${T.divider}`,fontSize:10,fontWeight:700,color:T.muted,letterSpacing:1.5,textTransform:"uppercase" }}>
                      <span>Student</span><span>Class</span><span>Action</span><span>Priority</span><span>Timestamp</span>
                    </div>
                    {actionLog.map((e,i)=>(
                      <div key={e.id} className="row-h" style={{ display:"grid",gridTemplateColumns:"1fr 70px 2fr 60px 150px",padding:"11px 16px",borderBottom:i<actionLog.length-1?`1px solid ${T.divider}`:"none",fontSize:13,alignItems:"center",transition:"background 0.15s" }}>
                        <span style={{ fontWeight:600,color:T.navy }}>{e.student}</span>
                        <span style={{ color:T.muted }}>{e.class}</span>
                        <span style={{ color:T.textMid }}>{e.action}</span>
                        <span style={{ fontSize:10,background:e.priority==="P1"?T.redBg:e.priority==="P2"?T.amberBg:T.bluePale,color:e.priority==="P1"?T.red:e.priority==="P2"?T.amber:T.blue,borderRadius:4,padding:"2px 8px",fontWeight:700,textAlign:"center" }}>{e.priority}</span>
                        <span style={{ color:T.faint,fontSize:11 }}>{e.date} · {e.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════ ADD STUDENT MODAL ══════ */}
      {addOpen && (
        <div style={{ position:"fixed",inset:0,background:"#00000055",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={e=>{if(e.target===e.currentTarget)setAddOpen(false);}}>
          <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:28,width:460,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px #00000025",animation:"fadeUp 0.25s ease" }}>
            <div style={{ fontSize:17,fontWeight:800,color:T.navy,marginBottom:20,borderBottom:`1px solid ${T.divider}`,paddingBottom:14 }}>➕ Enrol New Student</div>
            <div style={{ display:"flex",flexDirection:"column",gap:13 }}>
              <div>
                <label style={{ fontSize:11,color:T.muted,display:"block",marginBottom:4,fontWeight:600 }}>Full Name *</label>
                <input value={newS.name} onChange={e=>setNewS(p=>({...p,name:e.target.value}))} placeholder="Enter student name"
                  style={{ width:"100%",background:T.cardAlt,border:`1px solid ${T.border}`,borderRadius:6,padding:"9px 12px",color:T.text,fontSize:13,outline:"none" }}/>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                {[
                  {label:"Attendance %",   key:"att",  min:0,  max:100},
                  {label:"Behaviour Incidents",key:"beh",min:0, max:10},
                  {label:"Math Grade %",   key:"math", min:0,  max:100},
                  {label:"Distance (km)",  key:"dist", min:0,  max:20},
                ].map(({label,key,min,max})=>(
                  <div key={key}>
                    <label style={{ fontSize:11,color:T.muted,display:"block",marginBottom:3,fontWeight:600 }}>{label}: <b style={{ color:T.navy }}>{newS[key]}</b></label>
                    <input type="range" min={min} max={max} value={newS[key]} onChange={e=>setNewS(p=>({...p,[key]:+e.target.value}))} style={{ width:"100%",accentColor:T.blue }}/>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
                {[
                  {label:"Class",     key:"class",     opts:CLASSES},
                  {label:"Parent",    key:"parentResp",opts:["Responsive","Unresponsive"]},
                  {label:"Econ. Status",key:"socioEcon",opts:["APL","BPL"]},
                ].map(({label,key,opts})=>(
                  <div key={key}>
                    <label style={{ fontSize:11,color:T.muted,display:"block",marginBottom:3,fontWeight:600 }}>{label}</label>
                    <select value={newS[key]} onChange={e=>setNewS(p=>({...p,[key]:e.target.value}))} style={{ width:"100%",background:T.cardAlt,border:`1px solid ${T.border}`,color:T.text,borderRadius:6,padding:"8px 10px",fontSize:12 }}>
                      {opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Live preview */}
              {newS.name && (()=>{
                let r=0; r+=(100-newS.att)*0.38; r+=newS.beh*4.2; r+=(100-newS.math)*0.13;
                if(newS.parentResp==="Unresponsive") r+=13; if(newS.dist>5) r+=9; if(newS.socioEcon==="BPL") r+=6;
                r=Math.min(98,Math.max(2,Math.round(r)));
                const lvl=r>=70?"HIGH":r>=40?"MEDIUM":"LOW";
                return (
                  <div style={{ background:RAGBG(r),border:`1px solid ${RAGBD(r)}`,borderRadius:7,padding:12 }}>
                    <div style={{ fontSize:10,color:T.muted,marginBottom:6,fontWeight:600,letterSpacing:1 }}>LIVE RISK PREVIEW</div>
                    <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                      <div style={{ flex:1 }}><MiniBar val={r}/></div>
                      <div style={{ fontFamily:"monospace",fontWeight:900,color:RAG(r),fontSize:18 }}>{r}%</div>
                      <Badge level={lvl}/>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display:"flex",gap:10,marginTop:4 }}>
                <button onClick={()=>setAddOpen(false)} style={{ flex:1,background:T.cardAlt,color:T.muted,border:`1px solid ${T.border}`,borderRadius:6,padding:"10px",fontSize:13,cursor:"pointer" }}>Cancel</button>
                <button onClick={addStudent} disabled={!newS.name} style={{ flex:2,background:newS.name?T.blue:T.borderMid,color:"#fff",border:"none",borderRadius:6,padding:"10px",fontSize:13,fontWeight:700,cursor:newS.name?"pointer":"not-allowed" }}>
                  Enrol & Run Risk Model
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
