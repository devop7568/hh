/**
 * HailMary v6.0 — CORE MODULE
 * Shared utilities: EventBus, StorageManager, DOM helpers, error handling.
 * Every other module imports from here — zero duplication across the codebase.
 */
window.HailMaryCore = (function () {
  'use strict';

  // ── EVENT BUS ────────────────────────────────────────────────────────────────
  var _listeners = {};

  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
    return function off() {
      _listeners[event] = (_listeners[event] || []).filter(function (f) { return f !== fn; });
    };
  }

  function emit(event, data) {
    (_listeners[event] || []).forEach(function (fn) {
      try { fn(data); } catch (e) { console.error('[Core] EventBus error on "' + event + '":', e); }
    });
  }

  // ── STORAGE WRAPPER ──────────────────────────────────────────────────────────
  function storageGet(keys) {
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.get(keys, function (data) {
          resolve(chrome.runtime.lastError ? {} : data);
        });
      } catch (e) { resolve({}); }
    });
  }

  function storageSet(obj) {
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.set(obj, function () { resolve(!chrome.runtime.lastError); });
      } catch (e) { resolve(false); }
    });
  }

  // ── CHROME MESSAGE WRAPPER ───────────────────────────────────────────────────
  function sendMsg(msg) {
    return new Promise(function (resolve) {
      try {
        chrome.runtime.sendMessage(msg, function (resp) {
          resolve(chrome.runtime.lastError ? null : resp);
        });
      } catch (e) { resolve(null); }
    });
  }

  // ── ACTIVE TAB HELPER ───────────────────────────────────────────────────────
  function getActiveTab() {
    return new Promise(function (resolve) {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          resolve(chrome.runtime.lastError ? null : (tabs && tabs[0]) || null);
        });
      } catch (e) { resolve(null); }
    });
  }

  function executeOnTab(tabId, fn, args) {
    return new Promise(function (resolve) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: fn,
        args: args || []
      }, function (results) {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve((results && results[0] && results[0].result) || { success: false, error: 'No result' });
        }
      });
    });
  }

  // ── DOM HELPERS (popup context) ──────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }
  function show(id) { var e = el(id); if (e) e.style.display = ''; }
  function hide(id) { var e = el(id); if (e) e.style.display = 'none'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function setText(id, text) { var e = el(id); if (e) e.textContent = text; }
  function setHTML(id, html) { var e = el(id); if (e) e.innerHTML = html; }

  // ── TOAST ────────────────────────────────────────────────────────────────────
  function toast(msg, duration) {
    var old = document.querySelector('.hm-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'hm-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, duration || 2200);
  }

  // ── CLIPBOARD ────────────────────────────────────────────────────────────────
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { _fallbackCopy(text); });
    }
    _fallbackCopy(text);
    return Promise.resolve();
  }

  function _fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }

  // ── MARKDOWN RENDERER ────────────────────────────────────────────────────────
  function renderMarkdown(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\[([^\]]+)\]\((?!javascript:)([^)"]+)\)/gi, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/^---$/gm, '<hr>')
      .replace(/\n/g, '<br>');
  }

  // ── DEBOUNCE & THROTTLE ──────────────────────────────────────────────────────
  function debounce(fn, ms) {
    var timer;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function throttle(fn, ms) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= ms) { last = now; fn.apply(this, arguments); }
    };
  }

  // ── RETRY WITH EXPONENTIAL BACKOFF ───────────────────────────────────────────
  function retry(fn, maxAttempts, baseDelay) {
    maxAttempts = maxAttempts || 3;
    baseDelay = baseDelay || 1000;
    return new Promise(function (resolve, reject) {
      var attempt = 0;
      function tryOnce() {
        attempt++;
        Promise.resolve().then(fn).then(resolve).catch(function (err) {
          if (attempt >= maxAttempts) return reject(err);
          var delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
          setTimeout(tryOnce, delay);
        });
      }
      tryOnce();
    });
  }

  // ── HASH / FINGERPRINT ───────────────────────────────────────────────────────
  function hash32(str) {
    return str.split('').reduce(function (h, c) {
      return (((h << 5) - h) + c.charCodeAt(0)) | 0;
    }, 0);
  }

  function slugify(str) {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  }

  // ── SUPPORTED AI SITES ───────────────────────────────────────────────────────
  var AI_SITES = [
    'chatgpt.com', 'openai.com', 'claude.ai', 'gemini.google.com',
    'perplexity.ai', 'poe.com', 'grok.com', 'you.com', 'copilot.microsoft.com',
    'deepseek.com', 'chat.mistral.ai', 'huggingface.co/chat', 'pi.ai',
    'labs.google', 'aistudio.google.com'
  ];

  var INPUT_SELECTORS = [
    '#prompt-textarea', '.ProseMirror', '[contenteditable="true"]',
    'textarea[placeholder*="message"]', 'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Ask"]', '[role="textbox"]', 'textarea'
  ];

  function isAISite(url) {
    return AI_SITES.some(function (s) { return (url || '').includes(s); });
  }

  // ── VERSION ──────────────────────────────────────────────────────────────────
  var VERSION = '6.0.0';

  // ── PUBLIC API ───────────────────────────────────────────────────────────────
  return {
    VERSION: VERSION,
    on: on,
    emit: emit,
    storageGet: storageGet,
    storageSet: storageSet,
    sendMsg: sendMsg,
    getActiveTab: getActiveTab,
    executeOnTab: executeOnTab,
    el: el,
    show: show,
    hide: hide,
    esc: esc,
    setText: setText,
    setHTML: setHTML,
    toast: toast,
    copyText: copyText,
    renderMarkdown: renderMarkdown,
    debounce: debounce,
    throttle: throttle,
    retry: retry,
    hash32: hash32,
    slugify: slugify,
    AI_SITES: AI_SITES,
    INPUT_SELECTORS: INPUT_SELECTORS,
    isAISite: isAISite
  };
}());
