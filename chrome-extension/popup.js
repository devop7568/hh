/**
 * HailMary v6.0 — POPUP CONTROLLER
 * Uses Core utilities — zero duplicated DOM/storage/clipboard helpers.
 * Unified tool routing via executeTool — no more giant if/else chain.
 */
(function () {
  'use strict';

  var C = window.HailMaryCore;
  var el = C.el, show = C.show, hide = C.hide, esc = C.esc;
  var toast = C.toast, copyText = C.copyText;

  // ─── STATE ───────────────────────────────────────────────────────────────
  var state = {
    currentModel: 'gpt-5.2',
    currentEnhanceMode: 'auto',
    currentTool: null,
    currentTurns: 8,
    lastResult: null,
    lastTurns: null,
    chatBusy: false,
    MAX_HIST: 30
  };

  var DEPTH_LABELS = ['Basic', 'Standard', 'Advanced', 'Expert', 'Maximum'];

  var FIRE_LABELS = {
    hailmary: '\u2604\ufe0f HAIL MARY ACTIVATED',
    manus: '\u{1f9e0} MANUS ORCHESTRATION',
    juma: '\u26a1 JUMA MULTI-PERSPECTIVE',
    openmanus: '\u{1f6e0}\ufe0f OPENMANUS REACT AGENT',
    auto: '\u{1f916} AUTO-ROUTED'
  };

  // ─── TOOL INPUT DEFINITIONS ──────────────────────────────────────────────
  var TOOL_INPUTS = {
    browser_navigate: [{ name: 'url', placeholder: 'URL to navigate to', type: 'text' }, { name: 'newTab', placeholder: 'Open in new tab? (true/false)', type: 'text' }],
    click: [{ name: 'selector', placeholder: 'CSS selector', type: 'text' }],
    fill_form: [{ name: 'fields', placeholder: '{"#email":"test@x.com","#pass":"123"}', type: 'textarea' }],
    extract_data: [{ name: 'config', placeholder: '{"text":true,"links":true,"title":true}', type: 'textarea' }],
    dom_query: [{ name: 'selector', placeholder: 'CSS selector', type: 'text' }, { name: 'limit', placeholder: 'Max results (default 50)', type: 'text' }],
    input_simulate: [{ name: 'selector', placeholder: 'CSS selector', type: 'text' }, { name: 'text', placeholder: 'Text to type', type: 'text' }],
    script_inject: [{ name: 'code', placeholder: 'return document.title;', type: 'textarea' }],
    shell_exec: [{ name: 'command', placeholder: 'ls -la', type: 'text' }, { name: 'cwd', placeholder: 'Working directory (optional)', type: 'text' }],
    file_read: [{ name: 'path', placeholder: '/path/to/file', type: 'text' }],
    file_write: [{ name: 'path', placeholder: '/path/to/file', type: 'text' }, { name: 'content', placeholder: 'Content to write', type: 'textarea' }],
    web_search: [{ name: 'query', placeholder: 'Search query', type: 'text' }, { name: 'limit', placeholder: 'Max results (default 8)', type: 'text' }],
    api_call: [{ name: 'url', placeholder: 'API URL', type: 'text' }, { name: 'method', placeholder: 'GET/POST/PUT/DELETE', type: 'text' }, { name: 'body', placeholder: 'Request body JSON (optional)', type: 'textarea' }],
    download_file: [{ name: 'url', placeholder: 'File URL', type: 'text' }, { name: 'filename', placeholder: 'Save as (optional)', type: 'text' }],
    storage_read: [{ name: 'keys', placeholder: 'Key name(s)', type: 'text' }],
    storage_write: [{ name: 'data', placeholder: '{"key":"value"}', type: 'textarea' }],
    cookie_read: [{ name: 'url', placeholder: 'URL', type: 'text' }, { name: 'name', placeholder: 'Cookie name (optional)', type: 'text' }],
    cookie_write: [{ name: 'details', placeholder: '{"url":"...","name":"...","value":"..."}', type: 'textarea' }],
    clipboard_access: [{ name: 'action', placeholder: 'read or write', type: 'text' }, { name: 'text', placeholder: 'Text to write (if write)', type: 'text' }],
    screenshot: [],
    page_wait: [{ name: 'ms', placeholder: 'Milliseconds to wait', type: 'text' }],
    tab_manage: [{ name: 'action', placeholder: 'list/close/focus/create', type: 'text' }, { name: 'tabId', placeholder: 'Tab ID (optional)', type: 'text' }],
    element_modify: [{ name: 'selector', placeholder: 'CSS selector', type: 'text' }, { name: 'modifications', placeholder: '{"text":"new text"}', type: 'textarea' }],
    style_modify: [{ name: 'selector', placeholder: 'CSS selector', type: 'text' }, { name: 'styles', placeholder: '{"color":"red","display":"none"}', type: 'textarea' }],
    event_dispatch: [{ name: 'selector', placeholder: 'CSS selector', type: 'text' }, { name: 'eventType', placeholder: 'click/mouseover/keydown', type: 'text' }]
  };

  // ─── INIT ────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    setupPanelTabs();
    setupModelSelector();
    setupChat();
    setupEnhancePanel();
    setupToolsPanel();
    setupTurnsPanel();
    setupSettingsPanel();
    setupHistory();
    setupKeyboardShortcuts();
    loadSettings();
    checkTab();
    loadContextMenuText();
    updateToolCount();
  });

  // ─── PANEL TABS ──────────────────────────────────────────────────────────
  function setupPanelTabs() {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        document.querySelectorAll('.panel').forEach(function (p) { p.style.display = 'none'; p.classList.remove('active'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        var panel = el(btn.dataset.panel);
        if (panel) { panel.style.display = ''; panel.classList.add('active'); }
      });
    });
  }

  // ─── KEYBOARD SHORTCUTS ──────────────────────────────────────────────────
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        var tabs = document.querySelectorAll('.tab-btn');
        var idx = parseInt(e.key) - 1;
        if (tabs[idx]) tabs[idx].click();
      }
    });
  }

  // ─── MODEL SELECTOR ─────────────────────────────────────────────────────
  function setupModelSelector() {
    document.querySelectorAll('.model-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.model-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.currentModel = btn.dataset.model;
        if (window.HailMaryModels) window.HailMaryModels.setActiveModel(state.currentModel);
        saveSettings();
      });
    });
  }

  // ─── CHAT PANEL ──────────────────────────────────────────────────────────
  function setupChat() {
    el('chatSendBtn').addEventListener('click', handleChatSend);
    el('chatInput').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleChatSend();
    });
  }

  async function handleChatSend() {
    if (state.chatBusy || !window.HailMaryModels) return;
    var msg = el('chatInput').value.trim();
    if (!msg) { toast('Type a message first'); return; }

    state.chatBusy = true;
    el('chatSendBtn').disabled = true;
    C.setText('chatSendLbl', 'THINKING...');
    appendChatMsg('user', msg, state.currentModel);
    el('chatInput').value = '';
    show('typing');

    try {
      var resp = await window.HailMaryModels.send(msg, state.currentModel);
      hide('typing');
      appendChatMsg('ai', resp.content, state.currentModel, resp);
    } catch (err) {
      hide('typing');
      el('chatErr').textContent = err.message;
      show('chatErr');
    }

    state.chatBusy = false;
    el('chatSendBtn').disabled = false;
    C.setText('chatSendLbl', 'SEND');
  }

  function appendChatMsg(role, text, modelId, resp) {
    var history = el('chatHistory');
    var div = document.createElement('div');
    div.className = 'chat-msg ' + role;

    var header = '<div class="chat-msg-header">';
    if (role === 'user') {
      header += '<span>You</span>';
    } else {
      var model = (resp && resp.model) || modelId;
      var icon = (resp && resp.icon) || '';
      header += '<span>' + icon + ' ' + esc(model) + '</span>';
    }
    header += '<span>' + new Date().toLocaleTimeString() + '</span></div>';

    div.innerHTML = header + '<div class="chat-msg-body">' + C.renderMarkdown(text) + '</div>';
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
  }

  // ─── ENHANCE PANEL ──────────────────────────────────────────────────────
  function setupEnhancePanel() {
    document.querySelectorAll('.mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.mode-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.currentEnhanceMode = btn.dataset.emode;
        saveSettings();
      });
    });

    el('depthSlider').addEventListener('input', function () {
      C.setText('depthLbl', DEPTH_LABELS[parseInt(this.value, 10) - 1]);
      saveSettings();
    });

    el('enhBtn').addEventListener('click', handleEnhance);
    el('rawInput').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleEnhance();
    });

    el('copyBtn').addEventListener('click', function () {
      if (state.lastResult) { copyText(state.lastResult.enhanced); toast('Copied to clipboard!'); }
    });

    el('injectBtn').addEventListener('click', injectToPage);

    el('tgInject').addEventListener('change', saveSettings);
    el('tgSubmit').addEventListener('change', saveSettings);
  }

  async function handleEnhance() {
    if (!window.HailMaryEngine) return;
    var raw = el('rawInput').value.trim();
    if (!raw) { toast('Enter a prompt to enhance'); return; }

    el('enhBtn').disabled = true;
    C.setText('enhLbl', 'ENHANCING...');

    try {
      var result = await window.HailMaryEngine.enhance(raw, state.currentEnhanceMode, null, { depth: el('depthSlider').value });
      state.lastResult = result;

      C.setText('outMode', FIRE_LABELS[result.mode] || result.mode);
      C.setText('outTokens', result.stats.enhancedTokens + ' tokens');
      C.setText('outMultiplier', result.stats.powerMultiplier + 'x');
      C.setText('outTechniques', result.stats.techniqueCount + ' techniques');
      el('outBox').textContent = result.enhanced;
      show('outWrap');

      saveHistory(result);

      if (el('tgInject').checked) injectToPage();

      toast((FIRE_LABELS[result.mode] || 'Enhanced') + ' | ' + result.stats.powerMultiplier + 'x power');
    } catch (err) {
      showErr(err.message);
    }

    el('enhBtn').disabled = false;
    C.setText('enhLbl', '\u26a1 ENHANCE');
  }

  async function injectToPage() {
    if (!state.lastResult) return;
    var tab = await C.getActiveTab();
    if (!tab || !tab.id) { toast('No active tab'); return; }

    var enhanced = state.lastResult.enhanced;
    var autoSubmit = el('tgSubmit').checked;

    try {
      await C.executeOnTab(tab.id, function (text, submit, selectors) {
        for (var i = 0; i < selectors.length; i++) {
          var el = document.querySelector(selectors[i]);
          if (el) {
            if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') el.value = text;
            else el.textContent = text;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            if (submit) {
              var form = el.closest('form');
              if (form) { var btn = form.querySelector('button[type="submit"],button:not([type])'); if (btn) btn.click(); }
              else el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            }
            return { success: true };
          }
        }
        return { success: false, error: 'No input field found' };
      }, [enhanced, autoSubmit, C.INPUT_SELECTORS]);
      toast('Injected into page!');
    } catch (e) {
      toast('Injection failed: ' + e.message);
    }
  }

  // ─── TOOLS PANEL ─────────────────────────────────────────────────────────
  function setupToolsPanel() {
    var grid = el('toolsGrid');
    if (!window.HailMaryTools) return;

    var tools = window.HailMaryTools.getRegistry();
    tools.forEach(function (toolName) {
      var btn = document.createElement('button');
      btn.className = 'tool-btn';
      btn.textContent = toolName.replace(/_/g, ' ');
      btn.dataset.tool = toolName;
      btn.setAttribute('role', 'option');
      grid.appendChild(btn);
    });

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('.tool-btn');
      if (!btn) return;
      document.querySelectorAll('.tool-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.currentTool = btn.dataset.tool;
      renderToolInputs(state.currentTool);
      el('toolRunBtn').disabled = false;
      C.setText('toolRunLbl', 'RUN ' + state.currentTool.toUpperCase().replace(/_/g, ' '));
    });

    el('toolRunBtn').addEventListener('click', handleToolRun);

    el('toolOutputCopy').addEventListener('click', function () {
      copyText(el('toolOutputBox').textContent);
      toast('Output copied!');
    });

    el('toolLogHdr').addEventListener('click', function () {
      var list = el('toolLogList');
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    });
  }

  function renderToolInputs(toolName) {
    var inputs = TOOL_INPUTS[toolName] || [];
    var container = el('toolRunnerInputs');
    C.setText('toolRunnerLabel', 'Tool Runner \u2014 ' + toolName);

    if (inputs.length === 0) {
      container.innerHTML = '<div class="tool-placeholder">No inputs needed. Hit run!</div>';
      return;
    }

    container.innerHTML = inputs.map(function (inp) {
      if (inp.type === 'textarea') {
        return '<textarea class="tool-input" data-name="' + inp.name + '" placeholder="' + esc(inp.placeholder) + '" rows="3"></textarea>';
      }
      return '<input class="tool-input" data-name="' + inp.name + '" placeholder="' + esc(inp.placeholder) + '" type="text">';
    }).join('');
  }

  async function handleToolRun() {
    if (!state.currentTool || !window.HailMaryTools) return;

    el('toolRunBtn').disabled = true;
    C.setText('toolRunLbl', 'RUNNING...');

    var inputEls = document.querySelectorAll('#toolRunnerInputs .tool-input');
    var args = {};
    inputEls.forEach(function (inp) {
      var name = inp.dataset.name;
      var val = inp.value.trim();
      if (val) {
        try { args[name] = JSON.parse(val); } catch (e) { args[name] = val; }
      }
    });

    try {
      var result = await window.HailMaryTools.executeTool(state.currentTool, args);
      el('toolOutputBox').textContent = JSON.stringify(result, null, 2);
      show('toolOutput');
      updateToolLog(state.currentTool, result);
      toast(result.success ? state.currentTool + ' succeeded' : state.currentTool + ' failed');
    } catch (err) {
      el('toolOutputBox').textContent = JSON.stringify({ error: err.message }, null, 2);
      show('toolOutput');
      toast('Error: ' + err.message);
    }

    el('toolRunBtn').disabled = false;
    C.setText('toolRunLbl', 'RUN ' + state.currentTool.toUpperCase().replace(/_/g, ' '));
  }

  function updateToolLog(tool, result) {
    var log = window.HailMaryTools ? window.HailMaryTools.getLog() : [];
    C.setText('toolLogCount', log.length);

    var list = el('toolLogList');
    var time = new Date().toLocaleTimeString();
    var status = result && result.success ? '\u2705' : '\u274c';
    var item = document.createElement('div');
    item.className = 'tool-log-item';
    item.innerHTML = '<span class="tl-time">' + time + '</span>' +
      '<span class="tl-tool">' + status + ' ' + esc(tool) + '</span>' +
      '<span>' + esc(JSON.stringify(result).slice(0, 80)) + '</span>';
    list.insertBefore(item, list.firstChild);
  }

  function updateToolCount() {
    if (window.HailMaryTools) C.setText('toolCount', window.HailMaryTools.getToolCount());
  }

  // ─── TURNS PANEL ─────────────────────────────────────────────────────────
  function setupTurnsPanel() {
    document.querySelectorAll('.turns-count-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.turns-count-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.currentTurns = parseInt(btn.dataset.turns, 10);
      });
    });

    el('turnsBtn').addEventListener('click', handleTurns);
    el('turnsInput').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleTurns();
    });

    el('turnsCopyAllBtn').addEventListener('click', function () {
      if (!state.lastTurns) return;
      var all = state.lastTurns.turns.map(function (t) {
        return '\u2500\u2500 TURN ' + t.number + ' (' + t.phase.toUpperCase() + ') \u2500\u2500\n\n' + t.text;
      }).join('\n\n' + '\u2500'.repeat(50) + '\n\n');
      copyText(all);
      toast('All turns copied!');
    });

    el('turnsClearBtn').addEventListener('click', function () {
      hide('turnsOutWrap');
      state.lastTurns = null;
    });
  }

  function handleTurns() {
    if (!window.HailMaryEngine) return;
    var raw = el('turnsInput').value.trim();
    if (!raw) { toast('Enter a topic first'); return; }

    el('turnsBtn').disabled = true;
    C.setText('turnsLbl', 'GENERATING...');

    window.HailMaryEngine.generateTurns(raw, state.currentTurns).then(function (result) {
      state.lastTurns = result;
      renderTurns(result);
      show('turnsOutWrap');
      toast(result.count + ' turns generated!');
      el('turnsBtn').disabled = false;
      C.setText('turnsLbl', 'GENERATE TURNS');
    }).catch(function (err) {
      toast('Error: ' + err.message);
      el('turnsBtn').disabled = false;
      C.setText('turnsLbl', 'GENERATE TURNS');
    });
  }

  function renderTurns(result) {
    C.setText('turnsOutTitle', result.count + ' Turns \u00b7 ' + result.topic.slice(0, 30));
    var list = el('turnsList');
    list.innerHTML = '';

    result.turns.forEach(function (turn) {
      var item = document.createElement('div');
      item.className = 'turn-item';
      item.setAttribute('role', 'listitem');

      var header = document.createElement('div');
      header.className = 'turn-header';
      header.innerHTML =
        '<span class="turn-num">Turn ' + turn.number + '</span>' +
        '<span class="turn-phase">' + esc(turn.phase) + '</span>' +
        '<button class="turn-copy-btn" data-turn="' + turn.number + '">\u{1f4cb}</button>';

      var preview = document.createElement('div');
      preview.className = 'turn-preview';
      preview.textContent = turn.text.slice(0, 90) + '\u2026';

      var body = document.createElement('div');
      body.className = 'turn-body';
      body.textContent = turn.text;

      header.addEventListener('click', function (e) {
        if (e.target.classList.contains('turn-copy-btn')) return;
        body.classList.toggle('open');
        preview.style.display = body.classList.contains('open') ? 'none' : '';
      });

      header.querySelector('.turn-copy-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        copyText(turn.text);
        toast('Turn ' + turn.number + ' copied!');
      });

      item.appendChild(header);
      item.appendChild(preview);
      item.appendChild(body);
      list.appendChild(item);
    });
  }

  // ─── SETTINGS PANEL ─────────────────────────────────────────────────────
  function setupSettingsPanel() {
    el('kbRefreshBtn').addEventListener('click', function () {
      C.sendMsg({ type: 'FETCH_KNOWLEDGE_NOW' }).then(function (resp) {
        toast('Knowledge refreshed: ' + ((resp && resp.totalCount) || 0) + ' techniques');
        refreshSettingsStats();
      });
    });

    el('clearHistBtn').addEventListener('click', function () {
      C.storageSet({ hm_hist: [] }).then(function () {
        refreshHistory();
        toast('History cleared');
      });
    });

    el('clearChatBtn').addEventListener('click', function () {
      el('chatHistory').innerHTML = '';
      if (window.HailMaryModels) window.HailMaryModels.clearHistory();
      toast('Chat cleared');
    });

    el('exportBtn').addEventListener('click', function () {
      C.storageGet(['hm_v6', 'hm_hist', 'hm_knowledge']).then(function (data) {
        var json = JSON.stringify(data, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'hailmary-export-' + Date.now() + '.json';
        a.click();
        URL.revokeObjectURL(url);
        toast('Settings exported');
      });
    });

    refreshSettingsStats();
  }

  function refreshSettingsStats() {
    C.sendMsg({ type: 'GET_STATUS' }).then(function (resp) {
      if (resp) {
        C.setText('kbStatus', 'Techniques: ' + (resp.techniqueCount || 0) + ' | Fetches: ' + (resp.fetchCount || 0));
      }
    });

    if (window.HailMaryEngine) {
      var ks = window.HailMaryEngine.getKnowledgeStatus();
      C.setText('siLevel', 'Level: ' + (ks.sessionIntelligence || 1).toFixed(2));
      C.setText('siCount', 'Enhancements: ' + (ks.enhancementCount || 0));
      C.setText('siMeta', 'Meta-learning patterns: ' + (ks.metaLearningPatterns || 0));
    }

    if (window.HailMaryModels) {
      var ms = window.HailMaryModels.getStats();
      C.setHTML('modelStatsBox',
        'Requests: ' + ms.totalRequests + '<br>' +
        'Success rate: ' + ms.successRate + '<br>' +
        'Active: ' + ms.activeModel + '<br>' +
        'Sessions: ' + ms.historySize
      );
    }
  }

  // ─── HISTORY ─────────────────────────────────────────────────────────────
  function setupHistory() {
    el('histHdr').addEventListener('click', function () {
      var list = el('histList');
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    });
    refreshHistory();
  }

  function saveHistory(result) {
    C.storageGet('hm_hist').then(function (data) {
      var hist = (data && data.hm_hist) || [];
      hist.unshift({
        raw: result.original, enhanced: result.enhanced, mode: result.mode,
        task: result.analysis.task, ts: new Date().toLocaleTimeString()
      });
      if (hist.length > state.MAX_HIST) hist = hist.slice(0, state.MAX_HIST);
      C.storageSet({ hm_hist: hist });
    });
  }

  function refreshHistory() {
    C.storageGet('hm_hist').then(function (data) {
      var hist = (data && data.hm_hist) || [];
      C.setText('histCount', hist.length);
      var list = el('histList');
      list.innerHTML = '';
      if (hist.length === 0) {
        list.innerHTML = '<div style="padding:10px;color:#64748b;font-size:11px;text-align:center">No history yet</div>';
        return;
      }
      hist.forEach(function (item) {
        var div = document.createElement('div');
        div.className = 'hist-item';
        div.innerHTML = '<div class="hi-raw">' + esc(item.raw) + '</div>' +
          '<div class="hi-meta"><span class="hi-mode">' + esc(item.mode || '') + '</span>' +
          '<span>' + esc(item.task || '') + '</span><span>' + esc(item.ts || '') + '</span></div>';
        div.addEventListener('click', function () {
          el('rawInput').value = item.raw;
          el('outBox').textContent = item.enhanced;
          show('outWrap');
          state.lastResult = { enhanced: item.enhanced, original: item.raw };
          list.style.display = 'none';
          // Switch to enhance panel
          document.querySelector('[data-panel="enhancePanel"]').click();
        });
        list.appendChild(div);
      });
    });
  }

  // ─── TAB STATUS ──────────────────────────────────────────────────────────
  function checkTab() {
    C.getActiveTab().then(function (tab) {
      if (!tab) return;
      var isAI = C.isAISite(tab.url || '');
      var dot = el('statusDot');
      dot.classList.toggle('on', isAI);
      dot.classList.toggle('warn', !isAI);
      dot.title = isAI ? 'Connected \u2014 will inject directly' : 'Not on a supported AI page';
    });
  }

  // ─── CONTEXT MENU TEXT ───────────────────────────────────────────────────
  function loadContextMenuText() {
    C.storageGet('hm_context_text').then(function (data) {
      if (data && data.hm_context_text) {
        el('rawInput').value = data.hm_context_text;
        C.storageSet({ hm_context_text: '' });
        document.querySelector('[data-panel="enhancePanel"]').click();
      }
    });
  }

  // ─── SETTINGS PERSISTENCE ───────────────────────────────────────────────
  function saveSettings() {
    C.storageSet({
      hm_v6: {
        model: state.currentModel,
        emode: state.currentEnhanceMode,
        depth: el('depthSlider').value,
        inject: el('tgInject').checked,
        submit: el('tgSubmit').checked,
        turns: state.currentTurns
      }
    });
  }

  function loadSettings() {
    C.storageGet('hm_v6').then(function (data) {
      var s = data && data.hm_v6;
      if (!s) return;
      if (s.model) {
        state.currentModel = s.model;
        document.querySelectorAll('.model-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.model === s.model); });
      }
      if (s.emode) {
        state.currentEnhanceMode = s.emode;
        document.querySelectorAll('.mode-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.emode === s.emode); });
      }
      if (s.depth) {
        el('depthSlider').value = s.depth;
        C.setText('depthLbl', DEPTH_LABELS[parseInt(s.depth, 10) - 1]);
      }
      if (s.inject !== undefined) el('tgInject').checked = s.inject;
      if (s.submit !== undefined) el('tgSubmit').checked = s.submit;
      if (s.turns) {
        state.currentTurns = s.turns;
        document.querySelectorAll('.turns-count-btn').forEach(function (b) { b.classList.toggle('active', parseInt(b.dataset.turns, 10) === s.turns); });
      }
    });
  }

  // ─── UTILS ───────────────────────────────────────────────────────────────
  function showErr(msg) { el('errBox').textContent = msg; show('errBox'); }

}());
