/**
 * EduGuard AI — n8n.js
 * n8n Webhook Integration for Automatic Risk Message Forwarding
 * ─────────────────────────────────────────────────────────────
 * This module sends structured risk alert payloads to a configured
 * n8n webhook URL whenever students hit Critical or High risk thresholds.
 * n8n can then route those payloads to WhatsApp, Telegram, Email, SMS,
 * Google Sheets, or any other service via n8n nodes.
 */

(function () {
  'use strict';

  // ── Config persisted in localStorage ──────────────────────────
  const STORAGE_KEY = 'eduguard_n8n_config';
  const LOG_KEY     = 'eduguard_n8n_log';
  const MAX_LOG     = 50;

  function loadConfig() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }

  function saveConfig(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function loadLog() {
    try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; }
    catch { return []; }
  }

  function saveLog(log) {
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, MAX_LOG)));
  }

  function addLogEntry(entry) {
    const log = loadLog();
    log.unshift({ ...entry, ts: new Date().toISOString() });
    saveLog(log);
  }

  // ── Build payload ──────────────────────────────────────────────
  function buildPayload(students, trigger) {
    return {
      trigger,
      timestamp: new Date().toISOString(),
      system: 'EduGuard AI Early Warning System',
      district: 'Ministry of Education – District Dashboard',
      summary: {
        total_alerted: students.length,
        critical: students.filter(s => s.riskCategory === 'Critical').length,
        high:     students.filter(s => s.riskCategory === 'High').length,
      },
      students: students.map(s => ({
        id:            s.id,
        name:          s.name,
        grade:         s.grade,
        school:        s.schoolName,
        gender:        s.gender,
        age:           s.age,
        risk_level:    s.riskCategory,
        risk_score:    s.riskScore,
        attendance:    s.attendance,
        academic_score: s.academicScore,
        income_tier:   s.incomeTier,
        working_child: s.workingChild || false,
        distance_km:   s.distanceKm,
        parent_lang:   s.parentLang || 'English',
        alert_message: buildAlertMessage(s),
        recommended_actions: (s.recommendations || []).slice(0, 3).map(r => r.text || r),
      })),
    };
  }

  function buildAlertMessage(s) {
    const urgency = s.riskCategory === 'Critical' ? '🚨 CRITICAL ALERT' : '⚠️ HIGH RISK ALERT';
    return `${urgency}: ${s.name} (${s.grade}, ${s.schoolName}) — Risk Score: ${s.riskScore}/100 | Attendance: ${s.attendance}% | Academic: ${s.academicScore}% | Income: ${s.incomeTier}. Immediate intervention recommended.`;
  }

  // ── Core webhook sender ────────────────────────────────────────
  async function sendToN8n(students, trigger = 'manual') {
    const cfg = loadConfig();

    if (!cfg.enabled) {
      throw new Error('n8n integration is disabled. Enable it in the Automation panel.');
    }
    if (!cfg.webhookUrl) {
      throw new Error('No webhook URL configured. Add your n8n webhook URL in the Automation panel.');
    }

    // Filter by selected risk levels
    const levels = cfg.riskLevels || ['Critical', 'High'];
    const filtered = students.filter(s => levels.includes(s.riskCategory));

    if (filtered.length === 0) {
      throw new Error(`No students match the selected risk level(s): ${levels.join(', ')}.`);
    }

    // Batch or individual mode
    const batchMode = cfg.batchMode !== false;
    const payload   = buildPayload(filtered, trigger);

    let response;
    try {
      response = await fetch(cfg.webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(batchMode ? payload : payload.students[0]),
        mode:    'no-cors', // n8n webhooks are usually on a different origin
      });
    } catch (err) {
      addLogEntry({
        status:  'error',
        trigger,
        count:   filtered.length,
        message: `Network error: ${err.message}`,
        url:     cfg.webhookUrl,
      });
      throw new Error(`Failed to reach n8n webhook: ${err.message}. Make sure your n8n instance is running and the URL is correct.`);
    }

    // With no-cors we can't read status — log as sent
    addLogEntry({
      status:  'sent',
      trigger,
      count:   filtered.length,
      levels:  levels,
      message: `Payload sent — ${filtered.length} student(s) forwarded to n8n.`,
      url:     cfg.webhookUrl,
    });

    return { sent: filtered.length, payload };
  }

  // ── Auto-schedule (runs every X minutes if configured) ────────
  let _scheduleTimer = null;

  function startSchedule() {
    stopSchedule();
    const cfg = loadConfig();
    if (!cfg.enabled || !cfg.scheduleMinutes || cfg.scheduleMinutes < 1) return;

    const ms = cfg.scheduleMinutes * 60 * 1000;
    _scheduleTimer = setInterval(async () => {
      const students = window._allStudents || [];
      if (!students.length) return;
      try {
        const result = await sendToN8n(students, 'scheduled');
        if (window.showToast) {
          window.showToast(`⚙️ n8n auto-sent ${result.sent} risk alert(s).`, 'info');
        }
        refreshN8nLogUI();
      } catch (err) {
        if (window.showToast) {
          window.showToast(`n8n auto-send failed: ${err.message}`, 'warning');
        }
      }
    }, ms);

    console.info(`[EduGuard n8n] Scheduler started — every ${cfg.scheduleMinutes} min(s).`);
  }

  function stopSchedule() {
    if (_scheduleTimer) { clearInterval(_scheduleTimer); _scheduleTimer = null; }
  }

  // ── Render log table ──────────────────────────────────────────
  function refreshN8nLogUI() {
    const el = document.getElementById('n8n-log-body');
    if (!el) return;
    const log = loadLog();
    if (!log.length) {
      el.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">No messages sent yet.</td></tr>`;
      return;
    }
    el.innerHTML = log.map(entry => {
      const d    = new Date(entry.ts);
      const time = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
      const badge = entry.status === 'sent'
        ? `<span style="background:rgba(22,163,74,0.15);color:var(--risk-low);border:1px solid rgba(22,163,74,0.3);padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">✓ Sent</span>`
        : `<span style="background:rgba(220,38,38,0.15);color:var(--risk-critical);border:1px solid rgba(220,38,38,0.3);padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">✕ Error</span>`;
      return `<tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px 12px;font-size:12px;color:var(--text-muted);">${time}</td>
        <td style="padding:10px 12px;">${badge}</td>
        <td style="padding:10px 12px;font-size:12px;color:var(--text-secondary);text-transform:capitalize;">${entry.trigger || '—'}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:700;color:var(--accent-blue);">${entry.count || 0}</td>
        <td style="padding:10px 12px;font-size:12px;color:var(--text-secondary);">${entry.message || ''}</td>
      </tr>`;
    }).join('');
  }

  // ── Render n8n Automation View ────────────────────────────────
  function renderN8nView() {
    const el = document.getElementById('view-n8n');
    if (!el) return;

    const cfg = loadConfig();
    el.innerHTML = `
      <div style="max-width:900px;margin:0 auto;">

        <!-- Hero Banner -->
        <div style="
          background: linear-gradient(135deg,#1a2a4a 0%,#0f172a 60%,#1a0a2e 100%);
          border:1px solid rgba(99,120,180,0.3);
          border-radius:16px;padding:28px 32px;margin-bottom:24px;
          display:flex;align-items:center;gap:24px;
          box-shadow:0 12px 40px rgba(0,0,0,0.3);
        ">
          <div style="font-size:52px;flex-shrink:0;">⚡</div>
          <div>
            <div style="font-size:22px;font-weight:900;color:#f1f5f9;margin-bottom:6px;">
              n8n Automation Integration
            </div>
            <div style="font-size:13px;color:#94a3b8;line-height:1.7;">
              Automatically forward <strong style="color:#60a5fa;">Critical</strong> and
              <strong style="color:#f97316;">High-Risk</strong> student alerts to any channel —
              WhatsApp, Telegram, Email, SMS, Google Sheets, and more — via your self-hosted
              or cloud n8n workflow.
            </div>
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
              ${['WhatsApp','Telegram','Email','SMS','Google Sheets','Slack','Discord'].map(t =>
                `<span style="background:rgba(99,120,180,0.15);border:1px solid rgba(99,120,180,0.25);
                  color:#93c5fd;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">${t}</span>`
              ).join('')}
            </div>
          </div>
          <div style="margin-left:auto;flex-shrink:0;text-align:right;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Status</div>
            <div id="n8n-status-badge" style="
              font-size:13px;font-weight:800;padding:8px 18px;border-radius:20px;
              ${cfg.enabled
                ? 'background:rgba(22,163,74,0.2);border:1px solid rgba(22,163,74,0.4);color:#4ade80;'
                : 'background:rgba(100,116,139,0.2);border:1px solid rgba(100,116,139,0.3);color:#94a3b8;'}
            ">
              ${cfg.enabled ? '🟢 Active' : '⚫ Inactive'}
            </div>
          </div>
        </div>

        <!-- Config Card -->
        <div class="card" style="margin-bottom:20px;">
          <div class="card-title">⚙️ Webhook Configuration</div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">

            <!-- Left column -->
            <div>
              <div class="form-group">
                <label class="form-label">n8n Webhook URL</label>
                <input id="n8n-webhook-url" class="form-control" type="url"
                  placeholder="https://your-n8n.instance/webhook/..."
                  value="${cfg.webhookUrl || ''}" />
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
                  Copy this from your n8n Webhook node → <em>Webhook URL</em> field.
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Send Mode</label>
                <select id="n8n-batch-mode" class="form-control">
                  <option value="batch" ${cfg.batchMode !== false ? 'selected' : ''}>Batch — all students in one payload</option>
                  <option value="individual" ${cfg.batchMode === false ? 'selected' : ''}>Individual — one request per student</option>
                </select>
              </div>
            </div>

            <!-- Right column -->
            <div>
              <div class="form-group">
                <label class="form-label">Risk Levels to Forward</label>
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;">
                  ${[
                    {val:'Critical',col:'#ef4444',bg:'rgba(239,68,68,0.12)'},
                    {val:'High',col:'#f97316',bg:'rgba(249,115,22,0.12)'},
                    {val:'Medium',col:'#eab308',bg:'rgba(234,179,8,0.12)'},
                    {val:'Low',col:'#22c55e',bg:'rgba(34,197,94,0.12)'},
                  ].map(r => {
                    const active = (cfg.riskLevels || ['Critical','High']).includes(r.val);
                    return `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                      <input type="checkbox" id="n8n-level-${r.val.toLowerCase()}"
                        ${active ? 'checked' : ''}
                        style="accent-color:${r.col};width:15px;height:15px;" />
                      <span style="font-size:13px;font-weight:700;color:${r.col};
                        background:${r.bg};padding:3px 10px;border-radius:20px;">${r.val}</span>
                    </label>`;
                  }).join('')}
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Auto-Send Interval (minutes)</label>
                <div style="display:flex;gap:10px;align-items:center;">
                  <input id="n8n-schedule" class="form-control" type="number" min="0" max="1440"
                    placeholder="0 = manual only"
                    value="${cfg.scheduleMinutes || 0}"
                    style="max-width:130px;" />
                  <span style="font-size:12px;color:var(--text-muted);">0 = manual / on-demand only</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Enable toggle + save row -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:18px;border-top:1px solid var(--border);flex-wrap:wrap;gap:12px;">
            <label style="display:flex;align-items:center;gap:12px;cursor:pointer;">
              <div id="n8n-toggle-wrap" style="position:relative;width:48px;height:26px;">
                <input type="checkbox" id="n8n-enabled" ${cfg.enabled ? 'checked' : ''}
                  style="opacity:0;width:0;height:0;position:absolute;" />
                <div id="n8n-toggle-track" style="
                  position:absolute;inset:0;border-radius:13px;
                  background:${cfg.enabled ? 'var(--accent-blue)' : 'rgba(100,116,139,0.4)'};
                  transition:background 0.2s;cursor:pointer;
                ">
                  <div id="n8n-toggle-thumb" style="
                    position:absolute;top:3px;
                    left:${cfg.enabled ? '25px' : '3px'};
                    width:20px;height:20px;border-radius:50%;
                    background:#fff;transition:left 0.2s;
                    box-shadow:0 1px 4px rgba(0,0,0,0.3);
                  "></div>
                </div>
              </div>
              <span style="font-size:14px;font-weight:700;color:var(--text-primary);">
                Enable n8n Integration
              </span>
            </label>

            <div style="display:flex;gap:10px;">
              <button id="n8n-test-btn" onclick="window.N8n.test()" style="
                padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;
                background:rgba(37,99,235,0.1);border:1px solid rgba(37,99,235,0.3);
                color:var(--accent-blue);cursor:pointer;font-family:inherit;transition:all 0.2s;
              ">🧪 Test Webhook</button>
              <button onclick="window.N8n.save()" style="
                padding:10px 22px;border-radius:8px;font-size:13px;font-weight:700;
                background:linear-gradient(135deg,#2563eb,#7c3aed);
                border:none;color:white;cursor:pointer;font-family:inherit;transition:opacity 0.2s;
              ">💾 Save Settings</button>
            </div>
          </div>
        </div>

        <!-- Manual Trigger Card -->
        <div class="card" style="margin-bottom:20px;">
          <div class="card-title">🚀 Manual Trigger</div>
          <div style="display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap;">
            <div style="flex:1;min-width:220px;">
              <div style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:14px;">
                Immediately forward all <strong style="color:var(--text-primary);">at-risk student alerts</strong>
                to your n8n workflow right now. Use this after adding new schools or to manually
                push updates to your notification channels.
              </div>
              <div id="n8n-student-preview" style="font-size:13px;color:var(--text-muted);"></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;min-width:180px;">
              <button id="n8n-send-critical" onclick="window.N8n.sendCritical()" style="
                padding:12px 20px;border-radius:8px;font-size:13px;font-weight:700;
                background:rgba(220,38,38,0.12);border:1px solid rgba(220,38,38,0.3);
                color:var(--risk-critical);cursor:pointer;font-family:inherit;
                transition:all 0.2s;text-align:center;
              ">🚨 Send Critical Only</button>
              <button id="n8n-send-all" onclick="window.N8n.sendAll()" style="
                padding:12px 20px;border-radius:8px;font-size:13px;font-weight:700;
                background:linear-gradient(135deg,#2563eb,#7c3aed);
                border:none;color:white;cursor:pointer;font-family:inherit;
                transition:opacity 0.2s;text-align:center;
              ">📡 Send All At-Risk</button>
            </div>
          </div>
        </div>

        <!-- Setup Guide Card -->
        <div class="card" style="margin-bottom:20px;">
          <div class="card-title">📋 n8n Setup Guide</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;">
            ${[
              {step:'1',icon:'🌐',title:'Start n8n',text:'Run n8n locally with <code style="background:var(--bg-card2);padding:2px 6px;border-radius:4px;font-size:11px;">npx n8n</code> or use <a href="https://n8n.io/cloud" target="_blank" style="color:var(--accent-blue);">n8n Cloud</a>.'},
              {step:'2',icon:'🔗',title:'Add Webhook Node',text:'Create a new Workflow → Add <strong>Webhook</strong> node → set HTTP Method to <strong>POST</strong>.'},
              {step:'3',icon:'📋',title:'Copy URL',text:'Copy the <em>Webhook URL</em> from the node and paste it into the field above.'},
              {step:'4',icon:'➕',title:'Add Actions',text:'Connect WhatsApp, Telegram, Gmail, Twilio SMS, or Google Sheets nodes after the webhook.'},
              {step:'5',icon:'🧪',title:'Test',text:'Click <strong>Test Webhook</strong> above — n8n will receive a sample payload with real student data.'},
              {step:'6',icon:'✅',title:'Enable & Save',text:'Toggle <strong>Enable n8n Integration</strong>, set an auto-send interval if desired, then save.'},
            ].map(s => `
              <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:10px;padding:14px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                  <div style="
                    width:24px;height:24px;border-radius:50%;font-size:11px;font-weight:800;
                    background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;
                  ">${s.step}</div>
                  <span style="font-size:14px;">${s.icon}</span>
                  <strong style="font-size:13px;color:var(--text-primary);">${s.title}</strong>
                </div>
                <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">${s.text}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Activity Log -->
        <div class="card">
          <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
            <span>📜 Activity Log</span>
            <button onclick="window.N8n.clearLog()" style="
              padding:4px 12px;border-radius:6px;font-size:11px;font-weight:700;
              background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.2);
              color:var(--risk-critical);cursor:pointer;font-family:inherit;
            ">Clear Log</button>
          </div>
          <div style="overflow-x:auto;border-radius:8px;border:1px solid var(--border);">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:var(--table-header-bg);">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;white-space:nowrap;">Time</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">Status</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">Trigger</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">Count</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">Message</th>
                </tr>
              </thead>
              <tbody id="n8n-log-body"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Wire up toggle
    const toggleEl = document.getElementById('n8n-enabled');
    const track    = document.getElementById('n8n-toggle-track');
    const thumb    = document.getElementById('n8n-toggle-thumb');
    const wrapEl   = document.getElementById('n8n-toggle-wrap');

    const syncToggleUI = (checked) => {
      track.style.background = checked ? 'var(--accent-blue)' : 'rgba(100,116,139,0.4)';
      thumb.style.left       = checked ? '25px' : '3px';
    };

    if (wrapEl) {
      wrapEl.addEventListener('click', () => {
        toggleEl.checked = !toggleEl.checked;
        syncToggleUI(toggleEl.checked);
      });
    }

    // Preview counts
    const preview = document.getElementById('n8n-student-preview');
    if (preview) {
      const s = window._allStudents || [];
      const critical = s.filter(x => x.riskCategory === 'Critical').length;
      const high     = s.filter(x => x.riskCategory === 'High').length;
      const med      = s.filter(x => x.riskCategory === 'Medium').length;
      preview.innerHTML = `
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <span style="background:rgba(220,38,38,0.12);color:var(--risk-critical);border:1px solid rgba(220,38,38,0.3);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">🚨 ${critical} Critical</span>
          <span style="background:rgba(249,115,22,0.12);color:var(--risk-high);border:1px solid rgba(249,115,22,0.3);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">⚠️ ${high} High</span>
          <span style="background:rgba(234,179,8,0.12);color:var(--risk-medium);border:1px solid rgba(234,179,8,0.3);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">🟡 ${med} Medium</span>
        </div>
      `;
    }

    refreshN8nLogUI();
  }

  // ── Public API ─────────────────────────────────────────────────
  window.N8n = {
    save() {
      const url      = document.getElementById('n8n-webhook-url')?.value?.trim() || '';
      const enabled  = document.getElementById('n8n-enabled')?.checked || false;
      const batch    = document.getElementById('n8n-batch-mode')?.value !== 'individual';
      const schedule = parseInt(document.getElementById('n8n-schedule')?.value || '0', 10);
      const levels   = ['Critical','High','Medium','Low'].filter(l =>
        document.getElementById(`n8n-level-${l.toLowerCase()}`)?.checked
      );

      const cfg = { webhookUrl: url, enabled, batchMode: batch, scheduleMinutes: schedule, riskLevels: levels };
      saveConfig(cfg);

      stopSchedule();
      if (enabled) startSchedule();

      if (window.showToast) window.showToast('n8n settings saved!', 'success');

      // Refresh status badge
      const badge = document.getElementById('n8n-status-badge');
      if (badge) {
        badge.textContent = enabled ? '🟢 Active' : '⚫ Inactive';
        badge.style.background = enabled ? 'rgba(22,163,74,0.2)' : 'rgba(100,116,139,0.2)';
        badge.style.border     = enabled ? '1px solid rgba(22,163,74,0.4)' : '1px solid rgba(100,116,139,0.3)';
        badge.style.color      = enabled ? '#4ade80' : '#94a3b8';
      }
    },

    async test() {
      const url = document.getElementById('n8n-webhook-url')?.value?.trim();
      if (!url) {
        if (window.showToast) window.showToast('Please enter a webhook URL first.', 'warning');
        return;
      }
      const btn = document.getElementById('n8n-test-btn');
      if (btn) { btn.textContent = '⏳ Testing…'; btn.disabled = true; }

      const testPayload = {
        trigger: 'test',
        timestamp: new Date().toISOString(),
        system: 'EduGuard AI — Webhook Test',
        message: 'This is a test payload from EduGuard AI. Your n8n webhook is connected successfully!',
        sample_student: {
          id: 'TEST-001', name: 'Priya Sharma', grade: 'Grade 8',
          school: 'Govt. Boys High School, Thanjavur',
          risk_level: 'Critical', risk_score: 88,
          attendance: 52, academic_score: 34,
          income_tier: 'BPL', alert_message: '🚨 CRITICAL ALERT: Priya Sharma — Immediate intervention needed.',
        },
      };

      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload),
          mode: 'no-cors',
        });
        addLogEntry({ status: 'sent', trigger: 'test', count: 1, message: 'Test payload sent to n8n webhook.', url });
        if (window.showToast) window.showToast('✅ Test payload sent to n8n! Check your workflow.', 'success');
      } catch (err) {
        addLogEntry({ status: 'error', trigger: 'test', count: 0, message: `Test failed: ${err.message}`, url });
        if (window.showToast) window.showToast(`Test failed: ${err.message}`, 'error');
      } finally {
        if (btn) { btn.textContent = '🧪 Test Webhook'; btn.disabled = false; }
        refreshN8nLogUI();
      }
    },

    async sendCritical() {
      const students = window._allStudents || [];
      const cfg = loadConfig(); const orig = cfg.riskLevels;
      cfg.riskLevels = ['Critical']; saveConfig(cfg);
      try {
        const result = await sendToN8n(students, 'manual-critical');
        if (window.showToast) window.showToast(`🚨 ${result.sent} Critical alerts sent to n8n!`, 'success');
      } catch (err) {
        if (window.showToast) window.showToast(err.message, 'error');
      } finally {
        cfg.riskLevels = orig; saveConfig(cfg);
        refreshN8nLogUI();
      }
    },

    async sendAll() {
      const students = window._allStudents || [];
      try {
        const result = await sendToN8n(students, 'manual-all');
        if (window.showToast) window.showToast(`📡 ${result.sent} at-risk alerts sent to n8n!`, 'success');
      } catch (err) {
        if (window.showToast) window.showToast(err.message, 'error');
      } finally {
        refreshN8nLogUI();
      }
    },

    clearLog() {
      saveLog([]);
      refreshN8nLogUI();
      if (window.showToast) window.showToast('Activity log cleared.', 'info');
    },

    // Called when the view is navigated to
    renderView: renderN8nView,

    // Called on app init — resume schedule if it was enabled
    init() {
      const cfg = loadConfig();
      if (cfg.enabled && cfg.scheduleMinutes > 0) startSchedule();
    },
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.N8n.init());
  } else {
    window.N8n.init();
  }
})();
