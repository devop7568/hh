/* PromptForge AI - Popup Logic */

(function () {
  'use strict';

  var _q = function(s) { return document.querySelector(s); };
  var _qa = function(s) { return document.querySelectorAll(s); };

  /* -- Toast -- */
  function showToast(msg, type) {
    var t = _q('#toast');
    t.textContent = msg;
    t.className = 'toast ' + (type || 'success');
    clearTimeout(t._tid);
    t._tid = setTimeout(function() { t.className = 'toast hidden'; }, 3000);
  }

  /* -- Clipboard & Insert -- */
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('Copied to clipboard!', 'success');
    }).catch(function() {
      showToast('Copy failed', 'error');
    });
  }

  function insertIntoChat(text) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0]) return;
      // Ensure content script is injected, then message it
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js']
      }).catch(function() { /* may already be injected */ }).then(function() {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'insertPrompt', text: text }, function(response) {
          if (chrome.runtime.lastError || !response || !response.success) {
            showToast('Could not insert — open an AI chat first', 'error');
          } else {
            showToast('Inserted into chat!', 'success');
          }
        });
      });
    });
  }

  /* -- Send message to background -- */
  function sendBg(action, data) {
    return new Promise(function(resolve) {
      chrome.runtime.sendMessage({ action: action, data: data }, function(response) {
        if (chrome.runtime.lastError) {
          console.warn('sendBg error:', chrome.runtime.lastError.message);
          resolve(undefined);
        } else {
          resolve(response);
        }
      });
    });
  }

  /* -- Settings -- */
  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  _q('#btn-settings').addEventListener('click', openSettings);

  /* -- API Key Status -- */
  function checkApiKeyStatus() {
    chrome.storage.local.get('settings', function(result) {
      var data = result.settings;
      var hasKey = data && data.apiKey && data.apiKey.trim();
      _q('#api-warning').classList.toggle('hidden', !!hasKey);
    });
  }

  checkApiKeyStatus();

  _q('#setup-link').addEventListener('click', function(e) {
    e.preventDefault();
    openSettings();
  });

  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.settings) checkApiKeyStatus();
  });

  /* -- Tabs -- */
  _qa('.tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      _qa('.tab').forEach(function(t) { t.classList.remove('active'); });
      _qa('.tab-content').forEach(function(c) { c.classList.remove('active'); });
      tab.classList.add('active');
      var target = tab.dataset.tab;
      document.querySelector('[data-content="' + target + '"]').classList.add('active');

      if (target === 'history') loadHistory();
      if (target === 'library') loadLibrary();
    });
  });

  /* -- Char count -- */
  _q('#raw-prompt').addEventListener('input', function() {
    _q('#char-count').textContent = _q('#raw-prompt').value.length;
  });

  /* -- Mode cards -- */
  _qa('.mode-card').forEach(function(card) {
    card.addEventListener('click', function() {
      _qa('.mode-card').forEach(function(c) { c.classList.remove('active'); });
      card.classList.add('active');
    });
  });

  /* -- Generate -- */
  var lastResult = null;

  function setLoading(on, text) {
    _q('#loading').classList.toggle('hidden', !on);
    if (text) _q('#loading-text').textContent = text;
    _q('#btn-generate').disabled = on;
  }

  _q('#btn-generate').addEventListener('click', generate);
  _q('#btn-regenerate').addEventListener('click', generate);

  function generate() {
    var raw = _q('#raw-prompt').value.trim();
    if (!raw) { showToast('Enter a prompt first', 'error'); return; }

    var mode = document.querySelector('input[name="gen-mode"]:checked').value;
    var isDeep = mode === 'deep';

    setLoading(true, isDeep ? 'Deep engineering (2 passes)...' : 'Engineering your prompt...');
    _q('#result').classList.add('hidden');

    var action = isDeep ? 'deepOptimize' : 'optimizePrompt';
    sendBg(action, { rawPrompt: raw, mode: mode }).then(function(result) {
      setLoading(false);

      if (!result || result.error) {
        showToast((result && result.error) || 'Service unavailable', 'error');
        return;
      }

      lastResult = result;
      displayResult(result);
    }).catch(function(err) {
      setLoading(false);
      showToast(err.message || 'Generation failed', 'error');
    });
  }

  function displayResult(result) {
    _q('#result').classList.remove('hidden');
    var resultTextEl = _q('#result-text');

    /* -- Turn-aware display -- */
    var text = result.optimized || '';
    var hasTurns = result.hasTurns || false;
    var turnCount = result.turnCount || 0;

    if (hasTurns && turnCount >= 2) {
      /* Format with visual turn separators for easy reading */
      resultTextEl.innerHTML = '';
      var turnRegex = /===\s*TURN\s+(\d+)\s*[:\-]?\s*([^=]*?)\s*===/gi;
      var parts = [];
      var lastIndex = 0;
      var match;
      var turnMatches = [];

      while ((match = turnRegex.exec(text)) !== null) {
        turnMatches.push({
          index: match.index,
          end: match.index + match[0].length,
          number: match[1],
          label: match[2].trim() || ('Turn ' + match[1])
        });
      }

      if (turnMatches.length >= 2) {
        for (var i = 0; i < turnMatches.length; i++) {
          var tm = turnMatches[i];
          var contentStart = tm.end;
          var contentEnd = (i + 1 < turnMatches.length) ? turnMatches[i + 1].index : text.length;
          var turnContent = text.slice(contentStart, contentEnd).trim();

          /* Remove separator chars between turns */
          turnContent = turnContent.replace(/[\u2550]{10,}/g, '').trim();

          if (i > 0) {
            /* Big visual separator between turns */
            var sep = document.createElement('div');
            sep.className = 'turn-separator';
            sep.innerHTML = '<div class="turn-separator-line"></div>';
            resultTextEl.appendChild(sep);
          }

          /* Turn header */
          var header = document.createElement('div');
          header.className = 'turn-header';
          header.textContent = 'TURN ' + tm.number + ': ' + tm.label;
          resultTextEl.appendChild(header);

          /* Turn content */
          var contentDiv = document.createElement('div');
          contentDiv.className = 'turn-content';
          contentDiv.textContent = turnContent;
          resultTextEl.appendChild(contentDiv);
        }
      } else {
        /* Fallback: display as plain text */
        resultTextEl.textContent = text;
      }
    } else {
      /* Single prompt - display as plain text */
      resultTextEl.textContent = text;
    }

    _q('#result-mode').textContent = result.mode || 'quick';
    _q('#result-type').textContent = result.taskType || '';

    /* Turn count badge */
    if (hasTurns && turnCount >= 2) {
      _q('#result-mode').textContent = (result.mode || 'quick') + ' \u2022 ' + turnCount + ' turns';
    }

    if (result.techniques) {
      _q('#techniques-used').classList.remove('hidden');
      var techText = result.techniques;

      /* Show psychological techniques for deep mode */
      if (result.psychologicalTechniques && result.psychologicalTechniques.length) {
        techText += '\n\nPsychological Techniques Applied:\n' + result.psychologicalTechniques.map(function(t) { return '\u2022 ' + t; }).join('\n');
      }
      if (result.additionalTechniques && result.additionalTechniques.length) {
        techText += '\n\nAdditional Techniques:\n' + result.additionalTechniques.map(function(t) { return '\u2022 ' + t; }).join('\n');
      }

      _q('#techniques-text').textContent = techText;
    } else {
      _q('#techniques-used').classList.add('hidden');
    }
  }

  /* -- Result Actions -- */
  _q('#btn-copy').addEventListener('click', function() {
    if (lastResult) copyToClipboard(lastResult.optimized);
  });

  _q('#btn-insert').addEventListener('click', function() {
    if (lastResult) insertIntoChat(lastResult.optimized);
  });

  _q('#btn-save').addEventListener('click', function() {
    if (!lastResult) return;
    sendBg('saveToLibrary', {
      title: lastResult.optimized.slice(0, 80),
      prompt: lastResult.optimized,
      source: lastResult.mode || 'quick',
      tags: [lastResult.taskType || 'general']
    }).then(function() {
      showToast('Saved to library!', 'success');
    });
  });

  /* -- History -- */
  function loadHistory() {
    var container = _q('#history-list');
    sendBg('getHistory').then(function(items) {
      items = items || [];

      if (!items.length) {
        container.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><p>No history yet.</p><p class="hint">Generate a prompt to see it here.</p></div>';
        return;
      }

      container.innerHTML = '';
      items.forEach(function(item) {
        var div = document.createElement('div');
        div.className = 'list-item';

        var header = document.createElement('div');
        header.className = 'list-item-header';

        var title = document.createElement('div');
        title.className = 'list-item-title';
        title.textContent = item.input || '';

        var actions = document.createElement('div');
        actions.className = 'list-item-actions';

        var copyBtn = document.createElement('button');
        copyBtn.title = 'Copy';
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        copyBtn.addEventListener('click', function() { copyToClipboard(item.output); });
        actions.appendChild(copyBtn);

        header.appendChild(title);
        header.appendChild(actions);

        var preview = document.createElement('div');
        preview.className = 'list-item-preview';
        preview.textContent = item.output || '';

        var meta = document.createElement('div');
        meta.className = 'list-item-meta';
        meta.innerHTML = '<span class="list-item-tag">' + escapeHtml(item.mode || 'quick') + '</span><span>' + escapeHtml(item.taskType || '') + '</span><span>' + timeAgo(item.createdAt) + '</span>';

        div.appendChild(header);
        div.appendChild(preview);
        div.appendChild(meta);
        container.appendChild(div);
      });
    });
  }

  /* -- Library -- */
  var currentFilter = 'all';

  function loadLibrary() {
    var container = _q('#library-list');
    sendBg('getLibrary').then(function(items) {
      items = items || [];
      var search = (_q('#library-search').value || '').toLowerCase().trim();

      var filtered = items;
      if (currentFilter === 'favorites') {
        filtered = filtered.filter(function(i) { return i.favorite; });
      }
      if (search) {
        filtered = filtered.filter(function(i) {
          return (i.title || '').toLowerCase().indexOf(search) !== -1 ||
                 (i.prompt || '').toLowerCase().indexOf(search) !== -1;
        });
      }

      if (!filtered.length) {
        container.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><p>No saved prompts yet.</p><p class="hint">Generate and save prompts to build your library.</p></div>';
        return;
      }

      container.innerHTML = '';
      filtered.forEach(function(item) {
        var div = document.createElement('div');
        div.className = 'list-item';

        var header = document.createElement('div');
        header.className = 'list-item-header';

        var title = document.createElement('div');
        title.className = 'list-item-title';
        title.textContent = item.title || '';

        var actions = document.createElement('div');
        actions.className = 'list-item-actions';

        var favBtn = document.createElement('button');
        favBtn.title = 'Toggle favorite';
        favBtn.className = item.favorite ? 'favorited' : '';
        favBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="' + (item.favorite ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        favBtn.addEventListener('click', function() {
          sendBg('toggleFavorite', { id: item.id }).then(function() { loadLibrary(); });
        });
        actions.appendChild(favBtn);

        var copyBtn = document.createElement('button');
        copyBtn.title = 'Copy';
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        copyBtn.addEventListener('click', function() { copyToClipboard(item.prompt); });
        actions.appendChild(copyBtn);

        var insertBtn = document.createElement('button');
        insertBtn.title = 'Insert into chat';
        insertBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
        insertBtn.addEventListener('click', function() { insertIntoChat(item.prompt); });
        actions.appendChild(insertBtn);

        var delBtn = document.createElement('button');
        delBtn.title = 'Delete';
        delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
        delBtn.addEventListener('click', function() {
          sendBg('deleteFromLibrary', { id: item.id }).then(function() {
            showToast('Deleted', 'success');
            loadLibrary();
          });
        });
        actions.appendChild(delBtn);

        header.appendChild(title);
        header.appendChild(actions);

        var preview = document.createElement('div');
        preview.className = 'list-item-preview';
        preview.textContent = item.prompt || '';

        var meta = document.createElement('div');
        meta.className = 'list-item-meta';
        meta.innerHTML = '<span class="list-item-tag">' + escapeHtml(item.source || 'manual') + '</span><span>' + timeAgo(item.createdAt) + '</span>';

        div.appendChild(header);
        div.appendChild(preview);
        div.appendChild(meta);
        container.appendChild(div);
      });
    });
  }

  _qa('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _qa('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadLibrary();
    });
  });

  _q('#library-search').addEventListener('input', function() {
    loadLibrary();
  });

  /* -- Helpers -- */
  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function timeAgo(iso) {
    if (!iso) return '';
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    return days + 'd ago';
  }
})();
