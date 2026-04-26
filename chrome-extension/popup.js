/**
 * HailMary Popup Controller v4.0
 * Single unified IIFE — handles standard modes, turns mode, settings, history,
 * export/import, and keyboard shortcuts.
 */
(function () {
  'use strict';

  var DEPTH_LABELS = ['LITE', 'STANDARD', 'ENHANCED', 'ULTRA', 'GOD'];
  var FIRE_LABELS  = {
    hailmary: '☄️ FIRE HAIL MARY',
    manus:    '🧠 RUN MANUS',
    juma:     '⚡ UNLEASH JUMA',
    auto:     '🤖 AUTO-ENHANCE',
    turns:    '🔄 GENERATE TURNS'
  };

  var currentMode  = 'hailmary';
  var currentTurns = 8;
  var lastResult   = null;
  var lastTurns    = null;
  var MAX_HIST     = 50;

  function el(id) { return document.getElementById(id); }
  function show(id) { var e = el(id); if (e) e.style.display = ''; }
  function hide(id) { var e = el(id); if (e) e.style.display = 'none'; }

  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(String(s)));
    return d.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.HailMaryEngine === 'undefined') {
      el('errBox').textContent = 'Engine failed to load. Try reloading the extension.';
      show('errBox');
      el('fireBtn').disabled = true;
      return;
    }

    loadSettings();
    refreshHistory();
    checkTab();
    renderKnowledgeStatus();

    // Load captured text from content script floating button
    chrome.storage.local.get('hm_captured', function (data) {
      if (data && data.hm_captured) {
        el('rawInput').value = data.hm_captured;
        chrome.storage.local.remove('hm_captured');
      }
    });

    // Mode tabs
    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        if (currentMode === 'turns') {
          hide('standardPanel');
          show('turnsPanel');
          hide('outWrap');
        } else {
          show('standardPanel');
          hide('turnsPanel');
          hide('turnsOutWrap');
          updateFireBtn();
        }
        saveSettings();
      });
    });

    // Turns count buttons
    document.querySelectorAll('.turns-count-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.turns-count-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentTurns = parseInt(btn.dataset.turns, 10);
        saveSettings();
      });
    });

    // Depth slider
    el('depthSlider').addEventListener('input', function () {
      el('depthLbl').textContent = DEPTH_LABELS[parseInt(this.value, 10) - 1];
      saveSettings();
    });

    // Fire button
    el('fireBtn').addEventListener('click', handleEnhance);

    // Turns button
    el('turnsBtn').addEventListener('click', handleTurns);

    // Keyboard shortcuts
    el('rawInput').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleEnhance();
    });
    el('turnsInput').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleTurns();
    });

    // Output buttons
    el('copyBtn').addEventListener('click', handleCopy);
    el('injectBtn').addEventListener('click', function () { handleInject(); });
    el('clearBtn').addEventListener('click', handleClear);

    // Turns output buttons
    el('turnsCopyAllBtn').addEventListener('click', handleCopyAllTurns);
    el('turnsClearBtn').addEventListener('click', function () {
      hide('turnsOutWrap');
      lastTurns = null;
    });

    // History toggle
    el('histHdr').addEventListener('click', function () {
      var list = el('histList');
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    });

    // Settings panel toggle
    var settingsHdr = el('settingsHdr');
    if (settingsHdr) {
      settingsHdr.addEventListener('click', function () {
        var panel = el('settingsPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });
    }

    // Export button
    var exportBtn = el('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', handleExport);
    }

    // Import button
    var importBtn = el('importBtn');
    if (importBtn) {
      importBtn.addEventListener('click', function () {
        el('importFile').click();
      });
    }
    var importFile = el('importFile');
    if (importFile) {
      importFile.addEventListener('change', handleImport);
    }

    // Clear history button
    var clearHistBtn = el('clearHistBtn');
    if (clearHistBtn) {
      clearHistBtn.addEventListener('click', function () {
        chrome.storage.local.set({ hm_hist: [] }, function () {
          refreshHistory();
          toast('History cleared');
        });
      });
    }

    // Refresh knowledge button
    var refreshKnBtn = el('refreshKnBtn');
    if (refreshKnBtn) {
      refreshKnBtn.addEventListener('click', function () {
        refreshKnBtn.disabled = true;
        refreshKnBtn.textContent = 'Fetching...';
        chrome.runtime.sendMessage({ type: 'FETCH_KNOWLEDGE_NOW' }, function (r) {
          refreshKnBtn.disabled = false;
          refreshKnBtn.textContent = 'Refresh Knowledge';
          if (r && r.ok) {
            toast('Fetched ' + (r.newCount || 0) + ' new techniques');
          } else {
            toast('Knowledge refresh ' + (r && r.skipped ? 'skipped (recent)' : 'failed'));
          }
          renderKnowledgeStatus();
        });
      });
    }

    // Toggle settings persist
    ['tgInject', 'tgSubmit'].forEach(function (id) {
      el(id).addEventListener('change', saveSettings);
    });
  });

  // ── KNOWLEDGE STATUS ───────────────────────────────────────────────
  function renderKnowledgeStatus() {
    var knStatus = el('knowledgeStatus');
    if (!knStatus) return;
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, function (r) {
      if (chrome.runtime.lastError || !r) return;
      var parts = [];
      parts.push(r.techniqueCount + ' techniques loaded');
      if (r.lastFetch) {
        var ago = Math.round((Date.now() - r.lastFetch) / 60000);
        parts.push('updated ' + (ago < 60 ? ago + 'm ago' : Math.round(ago / 60) + 'h ago'));
      }
      knStatus.textContent = parts.join(' · ');
    });
  }

  // ── TURNS HANDLER ─────────────────────────────────────────────────
  function handleTurns() {
    hide('errBox');
    var raw = el('turnsInput').value.trim();
    if (!raw) { showErr('Enter a topic or goal first.'); el('turnsInput').focus(); return; }

    el('turnsBtn').disabled = true;
    el('turnsLbl').textContent = 'GENERATING...';

    setTimeout(function () {
      window.HailMaryEngine.generateTurns(raw, currentTurns).then(function (result) {
        lastTurns = result;
        renderTurns(result);
        show('turnsOutWrap');
        el('turnsOutWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        toast(result.count + ' turns generated');
        el('turnsBtn').disabled = false;
        el('turnsLbl').textContent = 'GENERATE TURNS';
      }).catch(function (err) {
        showErr('Error: ' + err.message);
        el('turnsBtn').disabled = false;
        el('turnsLbl').textContent = 'GENERATE TURNS';
      });
    }, 0);
  }

  // ── RENDER TURNS (XSS-safe) ───────────────────────────────────────
  function renderTurns(result) {
    var titleEl = el('turnsOutTitle');
    titleEl.textContent = result.count + ' Turns · ' + result.topic.slice(0, 30) + (result.topic.length > 30 ? '...' : '');
    var list = el('turnsList');
    list.innerHTML = '';

    result.turns.forEach(function (turn) {
      var item = document.createElement('div');
      item.className = 'turn-item';

      var header = document.createElement('div');
      header.className = 'turn-header';

      var numSpan = document.createElement('span');
      numSpan.className = 'turn-num';
      numSpan.textContent = 'Turn ' + turn.number;

      var phaseSpan = document.createElement('span');
      phaseSpan.className = 'turn-phase';
      phaseSpan.textContent = turn.phase;

      var copyBtn = document.createElement('button');
      copyBtn.className = 'turn-copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.dataset.turn = turn.number;

      header.appendChild(numSpan);
      header.appendChild(phaseSpan);
      header.appendChild(copyBtn);

      var preview = document.createElement('div');
      preview.className = 'turn-preview';
      preview.textContent = turn.text.slice(0, 90) + '...';

      var body = document.createElement('div');
      body.className = 'turn-body';
      body.textContent = turn.text;

      header.addEventListener('click', function (e) {
        if (e.target.classList.contains('turn-copy-btn')) return;
        var isOpen = body.classList.contains('open');
        body.classList.toggle('open', !isOpen);
        preview.style.display = isOpen ? '' : 'none';
      });

      copyBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        copyText(turn.text);
        var b = e.target;
        b.textContent = 'Copied';
        setTimeout(function () { b.textContent = 'Copy'; }, 1500);
        toast('Turn ' + turn.number + ' copied');
      });

      item.appendChild(header);
      item.appendChild(preview);
      item.appendChild(body);
      list.appendChild(item);
    });
  }

  // ── COPY ALL TURNS ────────────────────────────────────────────────
  function handleCopyAllTurns() {
    if (!lastTurns) return;
    var all = lastTurns.turns.map(function (t) {
      return '── TURN ' + t.number + ' (' + t.phase.toUpperCase() + ') ──\n\n' + t.text;
    }).join('\n\n' + '─'.repeat(50) + '\n\n');
    copyText(all);
    el('turnsCopyAllBtn').textContent = 'Copied All';
    setTimeout(function () { el('turnsCopyAllBtn').textContent = 'Copy All'; }, 1500);
    toast('All ' + lastTurns.count + ' turns copied');
  }

  // ── CORE: ENHANCE ─────────────────────────────────────────────────
  function handleEnhance() {
    hide('errBox');
    var raw = el('rawInput').value.trim();
    if (!raw) { showErr('Please type a prompt first.'); el('rawInput').focus(); return; }

    setLoading(true);

    setTimeout(function () {
      try {
        var depth = parseInt(el('depthSlider').value, 10) || 4;
        var opts  = { depth: depth };

        window.HailMaryEngine.enhance(raw, currentMode, 'auto', opts).then(function (result) {
          lastResult = result;
          renderOutput(result);
          show('outWrap');
          el('outWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          saveHistory(result);
          refreshHistory();

          if (el('tgInject').checked) {
            injectToTab(result.enhanced, el('tgSubmit').checked).then(function (ok) {
              if (ok) toast(el('tgSubmit').checked ? 'Injected & Submitted' : 'Injected');
              else    toast('Enhanced — click inject to send');
            });
          } else {
            var kNote = result.stats.knowledgeUsed > 0 ? ' · ' + result.stats.knowledgeUsed + ' web techniques' : '';
            toast(result.stats.powerMultiplier + 'x boost · ' + result.techniques.length + ' techniques' + kNote);
          }
          setLoading(false);
        }).catch(function (err) {
          showErr('Error: ' + err.message);
          setLoading(false);
        });
      } catch (err) {
        showErr('Error: ' + err.message);
        setLoading(false);
      }
    }, 0);
  }

  // ── RENDER OUTPUT (XSS-safe DOM construction) ─────────────────────
  function renderOutput(r) {
    var tagRow = el('tagRow');
    tagRow.innerHTML = '';

    function addTag(text, cls) {
      var span = document.createElement('span');
      span.className = 'tag' + (cls ? ' ' + cls : '');
      span.textContent = text;
      tagRow.appendChild(span);
    }

    addTag(r.analysis.task || '?', 'task');
    (r.analysis.domains || []).slice(0, 2).forEach(function (d) { addTag(d, 'domain'); });
    var cx = r.analysis.complexity;
    addTag(cx, cx === 'high' ? 'cplx-h' : cx === 'low' ? 'cplx-l' : 'cplx-m');
    if (r.autoRouted) addTag('auto > ' + r.mode);
    (r.techniques || []).slice(0, 10).forEach(function (t) { addTag(t); });

    el('outBox').textContent = r.enhanced;

    el('statsBar').textContent =
      r.stats.originalTokens + ' > ' + r.stats.enhancedTokens + ' tok  ·  ' +
      r.stats.powerMultiplier + 'x  ·  ' +
      r.stats.techniqueCount + ' techniques  ·  ' +
      r.stats.duration + 'ms';
  }

  // ── COPY ──────────────────────────────────────────────────────────
  function handleCopy() {
    if (!lastResult) return;
    copyText(lastResult.enhanced);
    el('copyBtn').textContent = 'Copied';
    setTimeout(function () { el('copyBtn').textContent = 'Copy'; }, 1500);
    toast('Copied to clipboard');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  // ── INJECT ────────────────────────────────────────────────────────
  function handleInject() {
    if (!lastResult) return;
    injectToTab(lastResult.enhanced, el('tgSubmit').checked).then(function (ok) {
      if (ok) toast('Injected' + (el('tgSubmit').checked ? ' & Submitted' : ''));
      else    toast('Not on a supported AI page');
    });
  }

  function injectToTab(text, autoSubmit) {
    return new Promise(function (resolve) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0]) { resolve(false); return; }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: injectFn,
          args: [text, !!autoSubmit]
        }, function (results) {
          resolve(!chrome.runtime.lastError && results && results[0] && results[0].result === true);
        });
      });
    });
  }

  function injectFn(text, autoSubmit) {
    var selectors = [
      '#prompt-textarea', '.ProseMirror', '[contenteditable="true"]',
      'textarea[placeholder*="message"]', 'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="prompt"]', '[role="textbox"]', 'textarea'
    ];
    var input = null;
    for (var i = 0; i < selectors.length; i++) {
      try {
        var found = document.querySelector(selectors[i]);
        if (found && found.offsetParent !== null) { input = found; break; }
      } catch (e) {}
    }
    if (!input) return false;

    var isEditable = input.getAttribute('contenteditable') === 'true' ||
                     input.classList.contains('ProseMirror') || input.tagName !== 'TEXTAREA';
    if (isEditable) {
      input.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
      if (!input.textContent.includes(text.slice(0, 15))) {
        input.textContent = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      var setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
      if (setter && setter.set) setter.set.call(input, text);
      else input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    input.focus();

    if (autoSubmit) {
      setTimeout(function () {
        var btnSels = [
          '[data-testid="send-button"]', 'button[aria-label="Send message"]',
          'button[aria-label="Send"]', '[data-testid="sendButton"]',
          '.send-button', 'button[type="submit"]'
        ];
        for (var j = 0; j < btnSels.length; j++) {
          try {
            var btn = document.querySelector(btnSels[j]);
            if (btn && !btn.disabled) { btn.click(); return; }
          } catch (e) {}
        }
        input.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
        }));
      }, 200);
    }
    return true;
  }

  // ── CLEAR ─────────────────────────────────────────────────────────
  function handleClear() {
    hide('outWrap');
    el('rawInput').value = '';
    el('rawInput').focus();
    lastResult = null;
    hide('errBox');
  }

  // ── SETTINGS PERSIST ──────────────────────────────────────────────
  function saveSettings() {
    try {
      chrome.storage.local.set({
        hm_v3: {
          mode:   currentMode,
          depth:  el('depthSlider').value,
          inject: el('tgInject').checked,
          submit: el('tgSubmit').checked,
          turns:  currentTurns
        }
      });
    } catch (e) {}
  }

  function loadSettings() {
    try {
      chrome.storage.local.get('hm_v3', function (data) {
        var s = data && data.hm_v3;
        if (!s) return;
        if (s.mode) {
          currentMode = s.mode;
          document.querySelectorAll('.tab').forEach(function (b) {
            b.classList.toggle('active', b.dataset.mode === s.mode);
          });
          if (s.mode === 'turns') {
            hide('standardPanel');
            show('turnsPanel');
          } else {
            updateFireBtn();
          }
        }
        if (s.depth) {
          el('depthSlider').value = s.depth;
          el('depthLbl').textContent = DEPTH_LABELS[parseInt(s.depth, 10) - 1];
        }
        if (s.inject !== undefined) el('tgInject').checked = s.inject;
        if (s.submit !== undefined) el('tgSubmit').checked = s.submit;
        if (s.turns) {
          currentTurns = s.turns;
          document.querySelectorAll('.turns-count-btn').forEach(function (b) {
            b.classList.toggle('active', parseInt(b.dataset.turns, 10) === s.turns);
          });
        }
      });
    } catch (e) {}
  }

  function updateFireBtn() {
    var label = FIRE_LABELS[currentMode] || 'ENHANCE';
    var parts = label.split(' ');
    el('fireBtn').querySelector('.fire-ico').textContent = parts[0];
    el('fireLbl').textContent = parts.slice(1).join(' ');
  }

  // ── HISTORY (XSS-safe DOM construction) ───────────────────────────
  function saveHistory(result) {
    try {
      chrome.storage.local.get('hm_hist', function (data) {
        var hist = (data && data.hm_hist) || [];
        hist.unshift({
          raw:      result.original,
          enhanced: result.enhanced,
          mode:     result.mode,
          task:     result.analysis.task,
          depth:    result.stats.depth,
          techniques: result.techniques.length,
          ts:       new Date().toLocaleTimeString()
        });
        if (hist.length > MAX_HIST) hist = hist.slice(0, MAX_HIST);
        chrome.storage.local.set({ hm_hist: hist });
      });
    } catch (e) {}
  }

  function refreshHistory() {
    try {
      chrome.storage.local.get('hm_hist', function (data) {
        var hist = (data && data.hm_hist) || [];
        el('histCount').textContent = hist.length;
        var list = el('histList');
        list.innerHTML = '';
        if (hist.length === 0) {
          var emptyDiv = document.createElement('div');
          emptyDiv.style.cssText = 'padding:10px;color:#64748b;font-size:11px;text-align:center';
          emptyDiv.textContent = 'No history yet';
          list.appendChild(emptyDiv);
          return;
        }
        hist.forEach(function (item) {
          var div = document.createElement('div');
          div.className = 'hist-item';

          var rawDiv = document.createElement('div');
          rawDiv.className = 'hi-raw';
          rawDiv.textContent = item.raw;

          var metaDiv = document.createElement('div');
          metaDiv.className = 'hi-meta';

          var modeSpan = document.createElement('span');
          modeSpan.className = 'hi-mode';
          modeSpan.textContent = item.mode || '';

          var taskSpan = document.createElement('span');
          taskSpan.textContent = item.task || '';

          var techSpan = document.createElement('span');
          techSpan.textContent = (item.techniques || 0) + ' tech';

          var tsSpan = document.createElement('span');
          tsSpan.textContent = item.ts || '';

          metaDiv.appendChild(modeSpan);
          metaDiv.appendChild(taskSpan);
          metaDiv.appendChild(techSpan);
          metaDiv.appendChild(tsSpan);

          div.appendChild(rawDiv);
          div.appendChild(metaDiv);

          div.addEventListener('click', function () {
            el('rawInput').value = item.raw;
            lastResult = { enhanced: item.enhanced, original: item.raw, techniques: [], analysis: { task: item.task, domains: [], complexity: 'medium' }, stats: { originalTokens: 0, enhancedTokens: 0, powerMultiplier: '0', techniqueCount: 0, duration: 0, knowledgeUsed: 0 }, mode: item.mode || 'hailmary' };
            renderOutput(lastResult);
            show('outWrap');
            list.style.display = 'none';
            toast('Loaded from history');
          });
          list.appendChild(div);
        });
      });
    } catch (e) {}
  }

  // ── EXPORT / IMPORT ───────────────────────────────────────────────
  function handleExport() {
    chrome.storage.local.get(['hm_v3', 'hm_hist', 'hm_knowledge', 'hm_memory'], function (data) {
      var exportData = {
        version: '4.0',
        exportedAt: new Date().toISOString(),
        settings: data.hm_v3 || {},
        history: data.hm_hist || [],
        knowledge: data.hm_knowledge || {},
        memory: data.hm_memory || {}
      };
      var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'hailmary-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('Exported successfully');
    });
  }

  function handleImport(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!data.version) { showErr('Invalid backup file'); return; }
        var toSet = {};
        if (data.settings) toSet.hm_v3 = data.settings;
        if (data.history) toSet.hm_hist = data.history;
        if (data.knowledge) toSet.hm_knowledge = data.knowledge;
        if (data.memory) toSet.hm_memory = data.memory;
        chrome.storage.local.set(toSet, function () {
          loadSettings();
          refreshHistory();
          renderKnowledgeStatus();
          toast('Imported successfully');
        });
      } catch (err) {
        showErr('Invalid backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ── TAB STATUS ────────────────────────────────────────────────────
  function checkTab() {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0]) return;
        var url = tabs[0].url || '';
        var supported = ['chatgpt.com', 'openai.com', 'claude.ai', 'gemini.google', 'perplexity.ai', 'poe.com', 'grok.com', 'you.com'];
        var on = supported.some(function (s) { return url.includes(s); });
        var dot = el('statusDot');
        dot.classList.toggle('on', on);
        dot.classList.toggle('warn', !on);
        dot.title = on ? 'Connected — will inject directly' : 'Not on a supported AI page';
      });
    } catch (e) {}
  }

  // ── UTILS ─────────────────────────────────────────────────────────
  function setLoading(on) {
    el('fireBtn').disabled = on;
    el('fireLbl').textContent = on ? 'ENHANCING...' : (FIRE_LABELS[currentMode] || 'ENHANCE').replace(/^[^\s]+\s/, '');
    var spinner = el('loadingSpinner');
    if (spinner) spinner.style.display = on ? 'inline-block' : 'none';
  }

  function showErr(msg) {
    el('errBox').textContent = msg;
    show('errBox');
  }

  function toast(msg) {
    var existing = document.querySelector('.hm-toast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.className = 'hm-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2200);
  }

}());
