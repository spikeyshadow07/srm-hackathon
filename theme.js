/**
 * EduGuard AI — theme.js
 * Theme Switcher: Light, Dark, and System Default
 */

(function () {
  'use strict';

  // Read saved preference or default to 'system'
  let currentTheme = localStorage.getItem('eduguard_theme') || 'system';

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getEffectiveTheme() {
    return currentTheme === 'system' ? getSystemTheme() : currentTheme;
  }

  function updateChartThemeDefaults(effectiveTheme) {
    if (window.CHART_DEFAULTS) {
      if (effectiveTheme === 'dark') {
        window.CHART_DEFAULTS.color = '#94a3b8';
        window.CHART_DEFAULTS.gridColor = 'rgba(148,163,184,0.12)';
        window.CHART_DEFAULTS.tickColor = 'rgba(148,163,184,0.7)';
      } else {
        window.CHART_DEFAULTS.color = '#4a5568';
        window.CHART_DEFAULTS.gridColor = 'rgba(99,120,180,0.1)';
        window.CHART_DEFAULTS.tickColor = 'rgba(74,85,104,0.7)';
      }
    }
  }

  function updateThemeUI(theme, effectiveTheme) {
    const iconEl = document.getElementById('theme-btn-icon');
    const labelEl = document.getElementById('theme-btn-label');
    const options = document.querySelectorAll('.theme-option');

    const icons = { light: '☀️', dark: '🌙', system: '💻' };
    const labels = { light: 'Light', dark: 'Dark', system: 'System' };

    if (iconEl) iconEl.textContent = icons[theme] || '💻';
    if (labelEl) labelEl.textContent = labels[theme] || 'System';

    options.forEach(opt => {
      const optTheme = opt.getAttribute('data-theme');
      if (optTheme === theme) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  function applyTheme(theme, redrawCharts = true) {
    currentTheme = theme;
    localStorage.setItem('eduguard_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    const effective = getEffectiveTheme();
    updateChartThemeDefaults(effective);

    // Update UI elements
    updateThemeUI(theme, effective);

    // Redraw active view charts
    if (redrawCharts && window._allStudents) {
      try {
        if (typeof window.navigateTo === 'function' && window.currentView) {
          window.navigateTo(window.currentView);
        }
      } catch (err) {
        // charts update fallback
      }
    }
  }

  function initThemeSwitcher() {
    const btn = document.getElementById('theme-btn');
    const dropdown = document.getElementById('theme-dropdown');
    const container = document.querySelector('.theme-switcher-container');
    const options = document.querySelectorAll('.theme-option');

    if (btn && dropdown && container) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'flex';
        dropdown.style.display = isOpen ? 'none' : 'flex';
        container.classList.toggle('open', !isOpen);
      });

      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
          dropdown.style.display = 'none';
          container.classList.remove('open');
        }
      });

      options.forEach(opt => {
        opt.addEventListener('click', () => {
          const selected = opt.getAttribute('data-theme');
          applyTheme(selected, true);
          dropdown.style.display = 'none';
          container.classList.remove('open');
          if (window.showToast) {
            const labelMap = { light: 'Light Theme', dark: 'Dark Theme', system: 'System Default' };
            window.showToast(`Theme changed to ${labelMap[selected]}`, 'info');
          }
        });
      });
    }

    // Apply initial theme state
    applyTheme(currentTheme, false);

    // Listen for OS system dark mode changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (currentTheme === 'system') {
        applyTheme('system', true);
      }
    });
  }

  // Pre-apply attribute immediately to avoid FOUC
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Bind UI after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSwitcher);
  } else {
    initThemeSwitcher();
  }

  // Expose helper globally
  window.setEduGuardTheme = applyTheme;
  window.getEduGuardTheme = () => currentTheme;
})();
