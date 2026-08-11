/**
 * EduGuard AI Chatbot — chatbot.js
 * Smart context-aware assistant for the EduGuard Early Warning System
 */

(function () {
  'use strict';

  /* ─── DOM refs ─────────────────────────────────────── */
  const trigger    = document.getElementById('chatbot-trigger');
  const panel      = document.getElementById('chatbot-panel');
  const closeBtn   = document.getElementById('chatbot-close-btn');
  const messages   = document.getElementById('chatbot-messages');
  const inputEl    = document.getElementById('chatbot-input');
  const sendBtn    = document.getElementById('chatbot-send');
  const quickWrap  = document.getElementById('chatbot-quick-replies');
  const notifDot   = trigger.querySelector('.chatbot-notif');

  /* ─── State ────────────────────────────────────────── */
  let isOpen      = false;
  let isTyping    = false;
  let hasGreeted  = false;

  /* ─── Knowledge Base ────────────────────────────────
   * Each entry has:
   *  patterns  – keywords to match (lowercased substrings)
   *  response  – function(ctx) → string (may use live data)
   *  quickReplies – follow-up chips to show (optional)
   ─────────────────────────────────────────────────── */
  const KB = [
    {
      patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings', 'help'],
      response: () =>
        `👋 Hello! I'm the <strong>EduGuard AI Assistant</strong>. I can help you with:<br><br>
        • 📊 Student risk analysis & scores<br>
        • 🎯 Intervention recommendations<br>
        • 🏫 School-level insights<br>
        • 📈 Attendance & academic trends<br>
        • 📋 Reports & data exports<br><br>
        What would you like to know?`,
      quickReplies: ['How many at-risk students?', 'Top critical students', 'Intervention tips', 'System overview'],
    },

    /* ── Student counts / statistics ── */
    {
      patterns: ['how many', 'total student', 'number of student', 'count'],
      response: () => {
        const s = getStudents();
        if (!s.length) return '⚠️ Student data is still loading. Please try again in a moment.';
        const crit  = s.filter(x => x.riskLevel === 'Critical').length;
        const high  = s.filter(x => x.riskLevel === 'High').length;
        const med   = s.filter(x => x.riskLevel === 'Medium').length;
        const low   = s.filter(x => x.riskLevel === 'Low').length;
        return `📊 <strong>Student Summary</strong><br><br>
          Total students: <strong>${s.length}</strong><br>
          🔴 Critical risk: <strong>${crit}</strong> (${pct(crit, s.length)}%)<br>
          🟠 High risk: <strong>${high}</strong> (${pct(high, s.length)}%)<br>
          🟡 Medium risk: <strong>${med}</strong> (${pct(med, s.length)}%)<br>
          🟢 Low risk: <strong>${low}</strong> (${pct(low, s.length)}%)`;
      },
      quickReplies: ['Top critical students', 'Schools with most risk', 'Average attendance'],
    },

    /* ── Critical students ── */
    {
      patterns: ['critical', 'urgent', 'immediate', 'worst', 'danger', 'top risk'],
      response: () => {
        const s = getStudents();
        const crit = s.filter(x => x.riskLevel === 'Critical').sort((a,b) => b.riskScore - a.riskScore).slice(0, 5);
        if (!crit.length) return '✅ Great news — no students are currently in the critical risk category!';
        let list = crit.map((c, i) =>
          `${i + 1}. <strong>${c.name}</strong> — Risk: <span style="color:#dc2626;font-weight:700">${c.riskScore}%</span> | Att: ${c.attendance}% | ${c.school}`
        ).join('<br>');
        return `🚨 <strong>Top ${crit.length} Critical Risk Students:</strong><br><br>${list}<br><br>Click any student in the Students view to see their full profile.`;
      },
      quickReplies: ['Intervention recommendations', 'BPL students at risk', 'Child labour cases'],
    },

    /* ── Attendance ── */
    {
      patterns: ['attendance', 'absent', 'present', 'school days'],
      response: () => {
        const s = getStudents();
        if (!s.length) return '⚠️ Data loading…';
        const avg   = avg1(s.map(x => x.attendance));
        const below75 = s.filter(x => x.attendance < 75).length;
        const below60 = s.filter(x => x.attendance < 60).length;
        return `📅 <strong>Attendance Insights</strong><br><br>
          Average attendance: <strong>${avg}%</strong><br>
          Students below 75%: <strong>${below75}</strong> (${pct(below75, s.length)}%)<br>
          Students below 60% (critical): <strong>${below60}</strong> (${pct(below60, s.length)}%)<br><br>
          💡 Attendance below 60% triggers a <strong>Critical</strong> risk flag and is the #1 predictor of dropout.`;
      },
      quickReplies: ['Academic scores', 'Intervention tips', 'Top critical students'],
    },

    /* ── Academic scores ── */
    {
      patterns: ['academic', 'score', 'marks', 'grade', 'performance', 'fail', 'pass'],
      response: () => {
        const s = getStudents();
        if (!s.length) return '⚠️ Data loading…';
        const avgSc  = avg1(s.map(x => x.academicScore));
        const below40 = s.filter(x => x.academicScore < 40).length;
        return `📚 <strong>Academic Performance</strong><br><br>
          Average score: <strong>${avgSc}%</strong><br>
          Students scoring below 40%: <strong>${below40}</strong> (${pct(below40, s.length)}%)<br><br>
          Academic performance contributes <strong>25%</strong> to the dropout risk score. Low scores combined with poor attendance significantly increase risk.`;
      },
      quickReplies: ['View attendance data', 'Socioeconomic factors', 'Intervention tips'],
    },

    /* ── Interventions ── */
    {
      patterns: ['intervention', 'action', 'help student', 'recommend', 'what should', 'how to help', 'support'],
      response: () =>
        `🎯 <strong>Intervention Strategies</strong><br><br>
        <strong>For Critical Risk students:</strong><br>
        • 🏠 Schedule a Home Visit to assess family situation<br>
        • 📱 Enable SMS alerts to parents<br>
        • 👮 Alert DCPO for child labour cases<br><br>
        <strong>For High Risk students:</strong><br>
        • 📖 Enroll in Remedial classes<br>
        • 🧑‍🏫 Assign a Tutor or Counselor<br>
        • 💰 Apply for National Scholarship (NSP)<br><br>
        <strong>For Medium Risk students:</strong><br>
        • 📋 Schedule SMC Meeting<br>
        • 🚌 Assign Transport if distance is a barrier<br><br>
        Go to the <strong>Interventions</strong> section to log and track these actions.`,
      quickReplies: ['Top critical students', 'BPL students', 'KGBV referral'],
    },

    /* ── Socioeconomic / BPL ── */
    {
      patterns: ['bpl', 'poverty', 'poor', 'socioeconomic', 'income', 'financial', 'scholarship', 'nsp'],
      response: () => {
        const s = getStudents();
        if (!s.length) return '⚠️ Data loading…';
        const bpl    = s.filter(x => x.incomeTier === 'BPL');
        const noSch  = bpl.filter(x => !x.scholarshipReceived);
        const atRisk = bpl.filter(x => ['Critical','High'].includes(x.riskLevel));
        return `💸 <strong>Socioeconomic Analysis</strong><br><br>
          BPL (Below Poverty Line) students: <strong>${bpl.length}</strong> (${pct(bpl.length, s.length)}%)<br>
          BPL students at Critical/High risk: <strong>${atRisk.length}</strong><br>
          BPL without scholarship (NSP eligible): <strong>${noSch.length}</strong><br><br>
          💡 Applying for NSP scholarship is one of the most impactful interventions for BPL students. Go to <strong>Interventions → Apply for NSP</strong>.`;
      },
      quickReplies: ['Child labour cases', 'Intervention tips', 'Female students risk'],
    },

    /* ── Child labour ── */
    {
      patterns: ['child labour', 'working child', 'work', '1098', 'childline'],
      response: () => {
        const s = getStudents();
        if (!s.length) return '⚠️ Data loading…';
        const working = s.filter(x => x.workingChild);
        const critWork = working.filter(x => ['Critical','High'].includes(x.riskLevel));
        return `🏭 <strong>Child Labour Insights</strong><br><br>
          Working children identified: <strong>${working.length}</strong><br>
          Working children at high/critical risk: <strong>${critWork.length}</strong><br><br>
          📞 <strong>Childline India Helpline: 1098</strong> (24×7, toll-free)<br><br>
          Recommended action: <strong>Alert DCPO</strong> through the Interventions module for each confirmed case.`;
      },
      quickReplies: ['Alert DCPO steps', 'BPL students', 'Intervention tips'],
    },

    /* ── Female / Gender ── */
    {
      patterns: ['female', 'girl', 'gender', 'kgbv', 'women'],
      response: () => {
        const s = getStudents();
        if (!s.length) return '⚠️ Data loading…';
        const female  = s.filter(x => x.gender === 'Female');
        const atRisk  = female.filter(x => ['Critical','High'].includes(x.riskLevel));
        return `👧 <strong>Gender Analysis</strong><br><br>
          Total female students: <strong>${female.length}</strong><br>
          Female students at high/critical risk: <strong>${atRisk.length}</strong> (${pct(atRisk.length, female.length)}%)<br><br>
          💡 For at-risk female students, consider a <strong>KGBV Referral</strong> (Kasturba Gandhi Balika Vidyalaya) for residential schooling support.`;
      },
      quickReplies: ['KGBV referral info', 'BPL students', 'Intervention tips'],
    },

    /* ── Schools ── */
    {
      patterns: ['school', 'district', 'which school', 'institution', 'schools with'],
      response: () => {
        const s = getStudents();
        if (!s.length) return '⚠️ Data loading…';
        const schoolMap = {};
        s.forEach(st => {
          if (!schoolMap[st.school]) schoolMap[st.school] = { total: 0, critical: 0, high: 0 };
          schoolMap[st.school].total++;
          if (st.riskLevel === 'Critical') schoolMap[st.school].critical++;
          if (st.riskLevel === 'High') schoolMap[st.school].high++;
        });
        const top = Object.entries(schoolMap)
          .map(([k, v]) => ({ name: k, ...v, atRisk: v.critical + v.high }))
          .sort((a, b) => b.atRisk - a.atRisk)
          .slice(0, 4);
        const list = top.map((sc, i) =>
          `${i+1}. <strong>${sc.name}</strong> — ${sc.atRisk} at-risk of ${sc.total}`
        ).join('<br>');
        return `🏫 <strong>Schools with Most At-Risk Students:</strong><br><br>${list}<br><br>Visit the <strong>Schools</strong> or <strong>Analytics</strong> section for full district-wide breakdowns.`;
      },
      quickReplies: ['Analytics overview', 'Top critical students', 'Export report'],
    },

    /* ── Risk model / system ── */
    {
      patterns: ['how does', 'risk model', 'algorithm', 'calculate', 'ai model', 'system work', 'risk score', 'scoring'],
      response: () =>
        `🤖 <strong>EduGuard Risk Model</strong><br><br>
        The system uses a <strong>Weighted Multi-Factor Model</strong>:<br><br>
        📅 <strong>Attendance</strong> — 30% weight<br>
        📚 <strong>Academic Performance</strong> — 25% weight<br>
        💸 <strong>Socioeconomic Status</strong> — 20% weight<br>
        🚌 <strong>Distance to School</strong> — 10% weight<br>
        👨‍👩‍👧 <strong>Family Background</strong> — 10% weight<br>
        🚩 <strong>Behavioral Indicators</strong> — 5% weight<br><br>
        Risk levels: 🔴 Critical (≥75) · 🟠 High (55-74) · 🟡 Medium (35-54) · 🟢 Low (<35)`,
      quickReplies: ['View analytics', 'How to intervene', 'Export report'],
    },

    /* ── Reports / Export ── */
    {
      patterns: ['report', 'export', 'download', 'csv', 'pdf', 'print', 'word'],
      response: () =>
        `📄 <strong>Reports & Exports</strong><br><br>
        EduGuard supports multiple export formats:<br><br>
        • <strong>CSV</strong> — Full student dataset for spreadsheet analysis<br>
        • <strong>PDF</strong> — Formatted report for official records<br>
        • <strong>Word (.docx)</strong> — Editable document<br>
        • <strong>Print</strong> — Browser print dialog<br><br>
        👉 Go to the <strong>Reports</strong> section or look for export buttons in the Students and Interventions views.`,
      quickReplies: ['Go to Reports', 'How many at-risk students?', 'System overview'],
    },

    /* ── KGBV ── */
    {
      patterns: ['kgbv', 'kasturba', 'residential'],
      response: () =>
        `🏠 <strong>KGBV — Kasturba Gandhi Balika Vidyalaya</strong><br><br>
        KGBV provides residential schooling for girls from disadvantaged backgrounds. To make a referral:<br><br>
        1. Go to <strong>Interventions</strong><br>
        2. Select the at-risk female student<br>
        3. Choose <strong>"KGBV Referral"</strong> as the intervention type<br>
        4. Add notes with parent contact details<br><br>
        This is especially effective for female students with ≥2 risk factors.`,
      quickReplies: ['Female students risk', 'Intervention tips', 'Top critical students'],
    },

    /* ── Distance ── */
    {
      patterns: ['distance', 'transport', 'far', 'km', 'commute', 'travel'],
      response: () => {
        const s = getStudents();
        if (!s.length) return '⚠️ Data loading…';
        const far    = s.filter(x => x.distanceKm > 10);
        const farRisk = far.filter(x => ['Critical','High'].includes(x.riskLevel));
        return `🚌 <strong>Distance Analysis</strong><br><br>
          Students living >10km from school: <strong>${far.length}</strong><br>
          Of those, at high/critical risk: <strong>${farRisk.length}</strong><br><br>
          Distance over 10km contributes to the risk score (10% weight). Recommended intervention: <strong>Assign Transport</strong> for students with both distance and financial barriers.`;
      },
      quickReplies: ['Intervention tips', 'BPL students', 'Top critical students'],
    },

    /* ── Average / overview ── */
    {
      patterns: ['average', 'overview', 'summary', 'overall', 'status'],
      response: () => {
        const s = getStudents();
        if (!s.length) return '⚠️ Data loading…';
        const avgRisk = avg1(s.map(x => x.riskScore));
        const avgAtt  = avg1(s.map(x => x.attendance));
        const avgSc   = avg1(s.map(x => x.academicScore));
        return `📊 <strong>District Overview</strong><br><br>
          👥 Total students: <strong>${s.length}</strong><br>
          ⚡ Avg. risk score: <strong>${avgRisk}%</strong><br>
          📅 Avg. attendance: <strong>${avgAtt}%</strong><br>
          📚 Avg. academic score: <strong>${avgSc}%</strong><br>
          🔴 Critical: <strong>${s.filter(x=>x.riskLevel==='Critical').length}</strong> &nbsp; 🟠 High: <strong>${s.filter(x=>x.riskLevel==='High').length}</strong><br><br>
          Visit the <strong>Analytics</strong> section for detailed district-wide charts.`;
      },
      quickReplies: ['Top critical students', 'School comparison', 'Intervention tips'],
    },

    /* ── Navigational hints ── */
    {
      patterns: ['dashboard', 'navigate', 'where', 'find', 'go to', 'section'],
      response: () =>
        `🗺️ <strong>App Navigation</strong><br><br>
        • 📊 <strong>Dashboard</strong> — KPIs, charts, critical alerts<br>
        • 👥 <strong>Students</strong> — Searchable list with filters & sorting<br>
        • 📈 <strong>Analytics</strong> — District-wide charts & factor analysis<br>
        • 🎯 <strong>Interventions</strong> — Log & track student interventions<br>
        • 📄 <strong>Reports</strong> — Summary stats & data exports<br>
        • 🏫 <strong>Schools</strong> — Manage school roster<br><br>
        Use the <strong>sidebar</strong> on the left to navigate between sections.`,
      quickReplies: ['How many at-risk students?', 'Top critical students', 'Intervention tips'],
    },

    /* ── Previous dropout ── */
    {
      patterns: ['previous dropout', 'dropout history', 'repeat dropout', 'recurrence'],
      response: () => {
        const s = getStudents();
        if (!s.length) return '⚠️ Data loading…';
        const prevDrop = s.filter(x => x.prevDropout);
        return `🔁 <strong>Previous Dropout History</strong><br><br>
          Students with prior dropout history: <strong>${prevDrop.length}</strong><br>
          These students face a <strong>significantly higher recurrence risk</strong>.<br><br>
          💡 Priority recommendation: Assign a <strong>dedicated Counselor</strong> and schedule monthly SMC meetings for all students with prior dropout history.`;
      },
      quickReplies: ['Counselor referral', 'Top critical students', 'Intervention tips'],
    },

    /* ── Thank you ── */
    {
      patterns: ['thank', 'thanks', 'great', 'awesome', 'helpful', 'good job'],
      response: () =>
        `😊 You're welcome! I'm here to help you keep every student in school.<br><br>
        Remember: Early intervention makes all the difference. Together we can reduce dropout rates across the district! 🎓`,
      quickReplies: ['What else can you do?', 'How many at-risk students?', 'Intervention tips'],
    },

    /* ── Fallback ── */
    {
      patterns: ['__fallback__'],
      response: (q) =>
        `🤔 I'm not sure about "<em>${escHtml(q.slice(0,60))}</em>" specifically, but here's what I can help with:<br><br>
        Try asking about:<br>
        • Student counts & risk levels<br>
        • Attendance or academic scores<br>
        • BPL / child labour / female student data<br>
        • Intervention strategies<br>
        • How the risk model works`,
      quickReplies: ['How many at-risk students?', 'Intervention tips', 'System overview'],
    },
  ];

  /* ─── Utility helpers ──────────────────────────────── */
  function getStudents() {
    return window._allStudents || [];
  }
  function pct(n, total) {
    if (!total) return 0;
    return Math.round((n / total) * 100);
  }
  function avg1(arr) {
    if (!arr.length) return 0;
    return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  }
  function escHtml(str) {
    return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  /* ─── Find matching KB entry ──────────────────────── */
  function findAnswer(query) {
    const q = query.toLowerCase();
    for (const entry of KB) {
      if (entry.patterns[0] === '__fallback__') continue;
      if (entry.patterns.some(p => q.includes(p))) {
        return entry;
      }
    }
    return KB[KB.length - 1]; // fallback
  }

  /* ─── Render helpers ──────────────────────────────── */
  function addMessage(html, who = 'bot') {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${who}`;
    if (who === 'bot') {
      msg.innerHTML = `
        <div class="chat-bot-icon">🛡️</div>
        <div class="chat-bubble">${html}</div>`;
    } else {
      msg.innerHTML = `<div class="chat-bubble">${escHtml(html)}</div>`;
    }
    messages.appendChild(msg);
    scrollToBottom();
  }

  function addTypingIndicator() {
    const el = document.createElement('div');
    el.className = 'chat-msg bot';
    el.id = 'typing-msg';
    el.innerHTML = `
      <div class="chat-bot-icon">🛡️</div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
    messages.appendChild(el);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const el = document.getElementById('typing-msg');
    if (el) el.remove();
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messages.scrollTop = messages.scrollHeight;
    });
  }

  function showQuickReplies(replies) {
    quickWrap.innerHTML = '';
    if (!replies || !replies.length) return;
    replies.forEach(r => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply-btn';
      btn.textContent = r;
      btn.addEventListener('click', () => {
        quickWrap.innerHTML = '';
        processQuery(r);
      });
      quickWrap.appendChild(btn);
    });
  }

  /* ─── Main chat logic ─────────────────────────────── */
  function processQuery(query) {
    if (isTyping) return;
    isTyping = true;

    addMessage(query, 'user');
    inputEl.value = '';
    quickWrap.innerHTML = '';

    // Delay to simulate thinking
    addTypingIndicator();
    const delay = 700 + Math.random() * 600;

    setTimeout(() => {
      removeTypingIndicator();
      const entry = findAnswer(query);
      const responseHtml = entry.response(query);
      addMessage(responseHtml, 'bot');
      showQuickReplies(entry.quickReplies || []);
      isTyping = false;
    }, delay);
  }

  /* ─── Greeting ────────────────────────────────────── */
  function showGreeting() {
    if (hasGreeted) return;
    hasGreeted = true;
    setTimeout(() => {
      addMessage(
        `👋 Hi there! I'm <strong>EduGuard AI</strong> — your intelligent assistant for student dropout prevention.<br><br>
        I can give you real-time insights on at-risk students, suggest interventions, and explain the risk model.<br><br>
        What would you like to know today?`,
        'bot'
      );
      showQuickReplies(['How many at-risk students?', 'Top critical students', 'Intervention tips', 'System overview']);
    }, 400);
  }

  /* ─── Panel toggle ────────────────────────────────── */
  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    trigger.classList.add('open');
    // Hide notif dot once opened
    if (notifDot) notifDot.style.display = 'none';
    showGreeting();
    setTimeout(() => inputEl.focus(), 350);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    trigger.classList.remove('open');
  }

  /* ─── Event listeners ────────────────────────────── */
  trigger.addEventListener('click', () => {
    if (isOpen) closePanel(); else openPanel();
  });

  closeBtn.addEventListener('click', closePanel);

  sendBtn.addEventListener('click', () => {
    const q = inputEl.value.trim();
    if (q) processQuery(q);
  });

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = inputEl.value.trim();
      if (q) processQuery(q);
    }
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (isOpen && !panel.contains(e.target) && !trigger.contains(e.target)) {
      closePanel();
    }
  });

  // Show notif dot after 3s to invite users
  setTimeout(() => {
    if (!isOpen && notifDot) notifDot.style.display = 'block';
  }, 3000);

})();
