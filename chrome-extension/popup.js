/* PromptForge AI - Popup Script */

(function () {
  'use strict';

  /* ── Utilities ── */

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function showToast(msg, type) {
    const toast = $('#toast');
    toast.textContent = msg;
    toast.className = 'toast visible ' + (type || '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = 'toast hidden'; }, 2200);
  }

  function setLoading(on, text) {
    const el = $('#loading');
    if (on) {
      el.querySelector('span').textContent = text || 'Optimizing with AI...';
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  }

  async function insertIntoChat(text) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) { showToast('No active tab found', 'error'); return; }
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).catch(() => { /* may already be injected */ });
      chrome.tabs.sendMessage(tab.id, { action: 'insertPrompt', text }, (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          showToast('Could not insert — open an AI chat first', 'error');
        } else {
          showToast('Inserted into chat!', 'success');
        }
      });
    } catch {
      showToast('Could not insert — open an AI chat first', 'error');
    }
  }

  function sendBg(action, data) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action, data }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ error: chrome.runtime.lastError.message });
        } else {
          resolve(response);
        }
      });
    });
  }

  /* ── Tab Navigation ── */

  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => t.classList.remove('active'));
      $$('.tab-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      $(`#tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  /* ── Settings ── */

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  $('#btn-settings').addEventListener('click', openSettings);

  const settingsBanner = $('#api-key-banner');
  const btnOpenSettings = $('#btn-open-settings');
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', openSettings);
  }

  /* Check for API key on popup open */
  function checkApiKeyStatus() {
    chrome.storage.local.get('settings', (result) => {
      const s = result.settings;
      if (!s || !s.apiKey || !s.apiKey.trim()) {
        settingsBanner.classList.remove('hidden');
      } else {
        settingsBanner.classList.add('hidden');
      }
    });
  }
  checkApiKeyStatus();

  /* Listen for storage changes so banner updates if user saves key while popup is open */
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) {
      const newSettings = changes.settings.newValue;
      if (newSettings && newSettings.apiKey && newSettings.apiKey.trim()) {
        settingsBanner.classList.add('hidden');
      } else {
        settingsBanner.classList.remove('hidden');
      }
    }
  });

  /* ══════════════════════════════════════
     TAB 1: OPTIMIZER
     ══════════════════════════════════════ */

  $('#btn-optimize').addEventListener('click', async () => {
    const raw = $('#raw-prompt').value.trim();
    if (!raw) { showToast('Enter a prompt first', 'error'); return; }

    const mode = document.querySelector('input[name="opt-mode"]:checked').value;

    setLoading(true, 'Optimizing with AI...');
    $('#btn-optimize').disabled = true;

    try {
      const result = await sendBg('optimizePrompt', { rawPrompt: raw, mode });

      if (result.error) {
        showToast(result.error, 'error');
        return;
      }

      const resultArea = $('#optimizer-result');
      resultArea.classList.remove('hidden');

      $('#optimized-text').textContent = result.optimized || '';

      if (result.score?.before) {
        $('#score-before').textContent = result.score.before;
        $('#score-after').textContent = result.score.after;
      }

      if (result.breakdown && Object.keys(result.breakdown).length) {
        $('#craft-breakdown').classList.remove('hidden');
        $('#bd-context').textContent = result.breakdown.context || '—';
        $('#bd-role').textContent = result.breakdown.role || '—';
        $('#bd-action').textContent = result.breakdown.action || '—';
        $('#bd-format').textContent = result.breakdown.format || '—';
        $('#bd-tone').textContent = result.breakdown.tone || '—';
      }

      if (result.improvements?.length) {
        $('#improvements-list').classList.remove('hidden');
        const ul = $('#improvements-ul');
        ul.innerHTML = '';
        result.improvements.forEach((imp) => {
          const li = document.createElement('li');
          li.textContent = imp;
          ul.appendChild(li);
        });
      }

      window._lastOptimized = result.optimized || '';
    } catch (err) {
      showToast(err.message || 'Optimization failed', 'error');
    } finally {
      setLoading(false);
      $('#btn-optimize').disabled = false;
    }
  });

  $('#btn-copy-optimized').addEventListener('click', () => {
    if (window._lastOptimized) copyToClipboard(window._lastOptimized);
  });

  $('#btn-insert-optimized').addEventListener('click', () => {
    if (window._lastOptimized) insertIntoChat(window._lastOptimized);
  });

  $('#btn-save-optimized').addEventListener('click', async () => {
    if (!window._lastOptimized) return;
    await sendBg('saveToLibrary', {
      title: window._lastOptimized.slice(0, 60),
      prompt: window._lastOptimized,
      source: 'optimizer',
      tags: ['optimized']
    });
    showToast('Saved to library!', 'success');
  });

  /* ══════════════════════════════════════
     TAB 2: CRAFT BUILDER
     ══════════════════════════════════════ */

  const TEMPLATES = [
    { name: 'Blog Post', context: 'Writing for a company blog targeting professionals', role: 'Act as an experienced content strategist and writer', action: 'Write a well-structured blog post on the given topic', format: 'Markdown with headings, bullet points, and a conclusion', tone: 'Professional' },
    { name: 'Code Review', context: 'Reviewing code for a production application', role: 'Act as a senior software engineer with 10+ years of experience', action: 'Review the provided code and suggest improvements', format: 'Numbered list of issues with code examples for fixes', tone: 'Technical' },
    { name: 'Email Draft', context: 'Business communication with a client or stakeholder', role: 'Act as a professional business communicator', action: 'Draft an email based on the given requirements', format: 'Standard email format with subject line, greeting, body, and sign-off', tone: 'Professional' },
    { name: 'Research', context: 'Conducting analysis on a specific topic', role: 'Act as a research analyst with domain expertise', action: 'Analyze the topic and provide comprehensive findings', format: 'Structured report with executive summary, key findings, and recommendations', tone: 'Academic' },
    { name: 'Marketing', context: 'Creating marketing content for product promotion', role: 'Act as a creative marketing strategist', action: 'Create compelling marketing copy for the given product or service', format: 'Multiple variations with headlines, body copy, and call-to-action', tone: 'Persuasive' }
  ];

  function renderTemplateChips() {
    const container = document.createElement('div');
    container.className = 'templates-row';
    TEMPLATES.forEach((tmpl) => {
      const chip = document.createElement('button');
      chip.className = 'template-chip';
      chip.textContent = tmpl.name;
      chip.addEventListener('click', () => {
        $('#craft-context').value = tmpl.context;
        $('#craft-role').value = tmpl.role;
        $('#craft-action').value = tmpl.action;
        $('#craft-format').value = tmpl.format;
        $('#craft-tone').value = tmpl.tone;
      });
      container.appendChild(chip);
    });
    const builderTab = $('#tab-builder');
    builderTab.insertBefore(container, builderTab.querySelector('.form-group'));
  }
  renderTemplateChips();

  $('#btn-build-craft').addEventListener('click', () => {
    const ctx = $('#craft-context').value.trim();
    const role = $('#craft-role').value.trim();
    const action = $('#craft-action').value.trim();
    const fmt = $('#craft-format').value.trim();
    const tone = $('#craft-tone').value;

    if (!action) { showToast('At least fill in the Action field', 'error'); return; }

    const parts = [];
    if (role) parts.push(role + '.');
    if (ctx) parts.push('\n\nContext: ' + ctx);
    parts.push('\n\nTask: ' + action);
    if (fmt) parts.push('\n\nFormat: ' + fmt);
    if (tone) parts.push('\n\nTone: ' + tone);

    const built = parts.join('');
    window._lastBuilt = built;

    $('#built-text').textContent = built;
    $('#builder-result').classList.remove('hidden');
  });

  $('#btn-copy-built').addEventListener('click', () => {
    if (window._lastBuilt) copyToClipboard(window._lastBuilt);
  });

  $('#btn-insert-built').addEventListener('click', () => {
    if (window._lastBuilt) insertIntoChat(window._lastBuilt);
  });

  $('#btn-save-built').addEventListener('click', async () => {
    if (!window._lastBuilt) return;
    await sendBg('saveToLibrary', {
      title: window._lastBuilt.slice(0, 60),
      prompt: window._lastBuilt,
      source: 'builder',
      tags: ['craft']
    });
    showToast('Saved to library!', 'success');
  });

  /* ══════════════════════════════════════
     TAB 3: GUIDED MODE (Juma-style)
     ══════════════════════════════════════ */

  let guidedStep = 'start';
  let guidedAnswers = {};

  function renderGuidedQuestions(questions) {
    const container = $('#guided-questions');
    container.innerHTML = '';

    questions.forEach((q) => {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.textContent = q.label;
      label.setAttribute('for', 'guided-' + q.id);
      group.appendChild(label);

      if (q.type === 'textarea') {
        const ta = document.createElement('textarea');
        ta.id = 'guided-' + q.id;
        ta.rows = 2;
        ta.placeholder = q.placeholder || '';
        ta.dataset.qid = q.id;
        group.appendChild(ta);
      } else if (q.type === 'select' && q.options) {
        const sel = document.createElement('select');
        sel.id = 'guided-' + q.id;
        sel.dataset.qid = q.id;
        const defOpt = document.createElement('option');
        defOpt.value = '';
        defOpt.textContent = q.placeholder || 'Select...';
        sel.appendChild(defOpt);
        q.options.forEach((opt) => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          sel.appendChild(o);
        });
        group.appendChild(sel);
      } else {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.id = 'guided-' + q.id;
        inp.placeholder = q.placeholder || '';
        inp.dataset.qid = q.id;
        group.appendChild(inp);
      }

      container.appendChild(group);
    });
  }

  function collectGuidedAnswers() {
    const inputs = $$('#guided-questions [data-qid]');
    inputs.forEach((el) => {
      const val = el.value.trim();
      if (val) guidedAnswers[el.dataset.qid] = val;
    });
  }

  function updateStepIndicator(step) {
    const stepMap = { start: 1, basic: 2, details: 3 };
    const current = stepMap[step] || 1;
    $$('.step-dot').forEach((dot) => {
      const s = parseInt(dot.dataset.step, 10);
      dot.classList.remove('active', 'completed');
      if (s < current) dot.classList.add('completed');
      if (s === current) dot.classList.add('active');
    });
    $$('.step-line').forEach((line, i) => {
      line.classList.toggle('active', i < current - 1);
    });
  }

  async function startGuided() {
    guidedStep = 'start';
    guidedAnswers = {};
    $('#guided-result').classList.add('hidden');
    $('#guided-container').classList.remove('hidden');
    updateStepIndicator('start');

    const result = await sendBg('guidedBuild', { step: 'start', answers: {} });
    guidedStep = result.step;
    updateStepIndicator(guidedStep);
    renderGuidedQuestions(result.questions);
    $('#btn-guided-next').textContent = 'Next Step';
  }

  startGuided();

  $('#btn-guided-next').addEventListener('click', async () => {
    collectGuidedAnswers();

    if (guidedStep === 'basic') {
      updateStepIndicator('details');
      setLoading(true, 'Building your prompt...');
    }

    try {
      const result = await sendBg('guidedBuild', { step: guidedStep, answers: guidedAnswers });

      if (result.error) {
        showToast(result.error, 'error');
        return;
      }

      if (result.step === 'complete') {
        $('#guided-container').classList.add('hidden');
        const resultArea = $('#guided-result');
        resultArea.classList.remove('hidden');

        window._lastGuided = result.prompt || '';
        $('#guided-text').textContent = result.prompt || '';

        if (result.tips?.length) {
          $('#guided-tips').classList.remove('hidden');
          const ul = $('#guided-tips-ul');
          ul.innerHTML = '';
          result.tips.forEach((tip) => {
            const li = document.createElement('li');
            li.textContent = tip;
            ul.appendChild(li);
          });
        }
      } else {
        guidedStep = result.step;
        updateStepIndicator(guidedStep);
        renderGuidedQuestions(result.questions);

        if (guidedStep === 'details') {
          const btn = $('#btn-guided-next');
          btn.innerHTML = 'Generate Prompt <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setLoading(false);
    }
  });

  $('#btn-copy-guided').addEventListener('click', () => {
    if (window._lastGuided) copyToClipboard(window._lastGuided);
  });

  $('#btn-insert-guided').addEventListener('click', () => {
    if (window._lastGuided) insertIntoChat(window._lastGuided);
  });

  $('#btn-save-guided').addEventListener('click', async () => {
    if (!window._lastGuided) return;
    await sendBg('saveToLibrary', {
      title: window._lastGuided.slice(0, 60),
      prompt: window._lastGuided,
      source: 'guided',
      tags: ['guided']
    });
    showToast('Saved to library!', 'success');
  });

  $('#btn-guided-restart').addEventListener('click', () => {
    startGuided();
  });

  /* ══════════════════════════════════════
     TAB 4: LIBRARY
     ══════════════════════════════════════ */

  let currentFilter = 'all';

  function renderLibrary(items) {
    const container = $('#library-list');

    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <p>No saved prompts yet.</p>
          <p class="hint">Optimize or build a prompt, then save it here.</p>
        </div>`;
      return;
    }

    container.innerHTML = '';
    items.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'library-item';
      div.innerHTML = `
        <div class="library-item-header">
          <div class="library-item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
          <div class="library-item-actions">
            <button class="lib-fav ${item.favorite ? 'favorited' : ''}" data-id="${item.id}" title="Toggle favorite">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${item.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>
            <button class="lib-copy" data-prompt="${escapeAttr(item.prompt)}" title="Copy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button class="lib-insert" data-prompt="${escapeAttr(item.prompt)}" title="Insert into chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
            <button class="lib-delete" data-id="${item.id}" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="library-item-preview">${escapeHtml(item.prompt)}</div>
        <div class="library-item-meta">
          <span class="library-item-tag">${item.source || 'manual'}</span>
          <span>${timeAgo(item.createdAt)}</span>
        </div>`;
      container.appendChild(div);
    });

    container.querySelectorAll('.lib-fav').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await sendBg('toggleFavorite', { id: btn.dataset.id });
        loadLibrary();
      });
    });

    container.querySelectorAll('.lib-copy').forEach((btn) => {
      btn.addEventListener('click', () => copyToClipboard(btn.dataset.prompt));
    });

    container.querySelectorAll('.lib-insert').forEach((btn) => {
      btn.addEventListener('click', () => insertIntoChat(btn.dataset.prompt));
    });

    container.querySelectorAll('.lib-delete').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await sendBg('deleteFromLibrary', { id: btn.dataset.id });
        showToast('Deleted', 'success');
        loadLibrary();
      });
    });
  }

  async function loadLibrary() {
    const items = await sendBg('getLibrary');
    const search = $('#library-search').value.toLowerCase().trim();

    let filtered = items || [];
    if (currentFilter === 'favorites') {
      filtered = filtered.filter((i) => i.favorite);
    }
    if (search) {
      filtered = filtered.filter((i) =>
        (i.title || '').toLowerCase().includes(search) ||
        (i.prompt || '').toLowerCase().includes(search)
      );
    }
    renderLibrary(filtered);
  }

  $$('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadLibrary();
    });
  });

  $('#library-search').addEventListener('input', () => {
    loadLibrary();
  });

  /* Load library when Library tab is clicked */
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.tab === 'library') loadLibrary();
    });
  });

  /* ── Helpers ── */

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    return days + 'd ago';
  }
})();
