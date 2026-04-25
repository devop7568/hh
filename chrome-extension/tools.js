/**
 * HailMary v6.0 — TOOLS MODULE
 * 29 browser/system automation tools with unified error handling.
 * Uses shared nativeWithFallback pattern — zero duplication across native/HTTP paths.
 */
window.HailMaryTools = (function () {
  'use strict';

  var toolLog = [];
  var MAX_LOG = 200;

  function log(name, input, result) {
    toolLog.push({ tool: name, input: input, result: result, ts: Date.now() });
    if (toolLog.length > MAX_LOG) toolLog = toolLog.slice(-100);
  }

  function ok(result) { return Object.assign({ success: true }, result); }
  function fail(msg) { return { success: false, error: msg }; }

  // ─── UNIFIED NATIVE/FALLBACK RUNNER ──────────────────────────────────────
  // Single function eliminates the duplicated native+fallback pattern
  // that was repeated for every file/shell tool.
  function nativeWithFallback(nativePayload, fallbackUrl, fallbackBody, logName, logInput) {
    return new Promise(function (resolve) {
      try {
        chrome.runtime.sendNativeMessage('com.hailmary.host', nativePayload, function (response) {
          if (chrome.runtime.lastError) {
            httpFallback(fallbackUrl, fallbackBody).then(function (r) { log(logName, logInput, r); resolve(r); });
          } else {
            log(logName, logInput, response);
            resolve(response);
          }
        });
      } catch (e) {
        httpFallback(fallbackUrl, fallbackBody).then(function (r) { log(logName, logInput, r); resolve(r); });
      }
    });
  }

  async function httpFallback(url, body) {
    try {
      var resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (resp.ok) return await resp.json();
      return fail('Server returned ' + resp.status);
    } catch (e) {
      return fail('Unavailable. Start native-host/server.js');
    }
  }

  // ─── SAFE WRAPPER ────────────────────────────────────────────────────────
  // Every tool uses this so error handling is never duplicated.
  function safe(fn) {
    return async function () {
      try { return await fn.apply(null, arguments); }
      catch (e) { return fail(e.message); }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BROWSER TOOLS (1-11)
  // ═══════════════════════════════════════════════════════════════════════════

  var browser_navigate = safe(async function (url, options) {
    options = options || {};
    if (options.newTab) {
      var tab = await chrome.tabs.create({ url: url, active: true });
      log('browser_navigate', { url: url }, { tabId: tab.id });
      return ok({ tabId: tab.id, url: url });
    }
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return fail('No active tab');
    await chrome.tabs.update(tabs[0].id, { url: url });
    log('browser_navigate', { url: url }, { tabId: tabs[0].id });
    return ok({ tabId: tabs[0].id, url: url });
  });

  var click = safe(async function (selector) {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return fail('No active tab');
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: function (sel) {
        var el = document.querySelector(sel);
        if (!el) return { success: false, error: 'Element not found: ' + sel };
        el.click();
        return { success: true, tag: el.tagName, text: (el.textContent || '').slice(0, 80) };
      },
      args: [selector]
    });
    var r = (results && results[0] && results[0].result) || fail('No result');
    log('click', { selector: selector }, r);
    return r;
  });

  var fill_form = safe(async function (fields) {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return fail('No active tab');
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: function (f) {
        var filled = 0, errors = [];
        for (var sel in f) {
          var el = document.querySelector(sel);
          if (!el) { errors.push('Not found: ' + sel); continue; }
          el.value = f[sel];
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          filled++;
        }
        return { success: errors.length === 0, filled: filled, errors: errors };
      },
      args: [fields]
    });
    var r = (results && results[0] && results[0].result) || fail('No result');
    log('fill_form', { fields: Object.keys(fields).length }, r);
    return r;
  });

  var extract_data = safe(async function (config) {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return fail('No active tab');
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: function (cfg) {
        var data = {};
        if (cfg.text) data.text = document.body.innerText.slice(0, cfg.maxLength || 50000);
        if (cfg.html) data.html = document.body.innerHTML.slice(0, cfg.maxLength || 100000);
        if (cfg.title) data.title = document.title;
        if (cfg.url) data.url = window.location.href;
        if (cfg.meta) {
          data.meta = {};
          document.querySelectorAll('meta[name],meta[property]').forEach(function (m) {
            data.meta[m.getAttribute('name') || m.getAttribute('property')] = m.getAttribute('content');
          });
        }
        if (cfg.links) {
          data.links = [];
          document.querySelectorAll('a[href]').forEach(function (a) {
            if (data.links.length < (cfg.linkLimit || 100)) data.links.push({ text: (a.textContent || '').trim().slice(0, 80), href: a.href });
          });
        }
        if (cfg.images) {
          data.images = [];
          document.querySelectorAll('img[src]').forEach(function (img) {
            if (data.images.length < (cfg.imageLimit || 50)) data.images.push({ src: img.src, alt: img.alt || '' });
          });
        }
        if (cfg.selectors) {
          data.selectors = {};
          for (var key in cfg.selectors) {
            var els = document.querySelectorAll(cfg.selectors[key]);
            data.selectors[key] = [];
            els.forEach(function (el) {
              if (data.selectors[key].length < 50) data.selectors[key].push(el.textContent.trim().slice(0, 200));
            });
          }
        }
        return { success: true, data: data };
      },
      args: [config]
    });
    var r = (results && results[0] && results[0].result) || fail('No result');
    log('extract_data', config, { keys: Object.keys((r.data || {})) });
    return r;
  });

  var dom_query = safe(async function (selector, options) {
    options = options || {};
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return fail('No active tab');
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: function (sel, lim) {
        var els = document.querySelectorAll(sel);
        var items = [];
        els.forEach(function (el) {
          if (items.length >= lim) return;
          items.push({ tag: el.tagName.toLowerCase(), id: el.id || undefined, classes: el.className || undefined, text: (el.textContent || '').trim().slice(0, 200), attrs: {} });
          for (var i = 0; i < el.attributes.length && i < 10; i++) {
            items[items.length - 1].attrs[el.attributes[i].name] = el.attributes[i].value.slice(0, 100);
          }
        });
        return { success: true, count: items.length, total: els.length, elements: items };
      },
      args: [selector, options.limit || 50]
    });
    var r = (results && results[0] && results[0].result) || fail('No result');
    log('dom_query', { selector: selector }, { count: (r.count || 0) });
    return r;
  });

  var input_simulate = safe(async function (selector, text, options) {
    options = options || {};
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return fail('No active tab');
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: function (sel, txt, opts) {
        var el = document.querySelector(sel);
        if (!el) return { success: false, error: 'Element not found' };
        el.focus();
        if (opts.clear) { el.value = ''; el.textContent = ''; }
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = (opts.clear ? '' : el.value) + txt;
        } else if (el.getAttribute('contenteditable')) {
          el.textContent = (opts.clear ? '' : el.textContent) + txt;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        if (opts.submit) {
          var form = el.closest('form');
          if (form) form.submit();
          else {
            var enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true });
            el.dispatchEvent(enterEvent);
          }
        }
        return { success: true, tag: el.tagName };
      },
      args: [selector, text, options]
    });
    var r = (results && results[0] && results[0].result) || fail('No result');
    log('input_simulate', { selector: selector }, r);
    return r;
  });

  var tab_manage = safe(async function (action, options) {
    options = options || {};
    if (action === 'list') {
      var tabs = await chrome.tabs.query({});
      var list = tabs.map(function (t) { return { id: t.id, title: t.title, url: t.url, active: t.active }; });
      return ok({ tabs: list });
    }
    if (action === 'close' && options.tabId) { await chrome.tabs.remove(options.tabId); return ok({ closed: options.tabId }); }
    if (action === 'focus' && options.tabId) { await chrome.tabs.update(options.tabId, { active: true }); return ok({ focused: options.tabId }); }
    if (action === 'create') { var t = await chrome.tabs.create({ url: options.url || 'about:blank' }); return ok({ tabId: t.id }); }
    if (action === 'duplicate' && options.tabId) { var d = await chrome.tabs.duplicate(options.tabId); return ok({ tabId: d.id }); }
    return fail('Unknown action: ' + action);
  });

  var element_modify = safe(async function (selector, modifications) {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return fail('No active tab');
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: function (sel, mods) {
        var el = document.querySelector(sel);
        if (!el) return { success: false, error: 'Element not found' };
        if (mods.text !== undefined) el.textContent = mods.text;
        if (mods.html !== undefined) el.innerHTML = mods.html;
        if (mods.value !== undefined) el.value = mods.value;
        if (mods.attrs) { for (var k in mods.attrs) el.setAttribute(k, mods.attrs[k]); }
        if (mods.remove) el.remove();
        if (mods.hide) el.style.display = 'none';
        if (mods.show) el.style.display = '';
        if (mods.addClass) el.classList.add(mods.addClass);
        if (mods.removeClass) el.classList.remove(mods.removeClass);
        return { success: true, tag: el.tagName };
      },
      args: [selector, modifications]
    });
    return (results && results[0] && results[0].result) || fail('No result');
  });

  var style_modify = safe(async function (selector, styles) {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return fail('No active tab');
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: function (sel, s) {
        var els = document.querySelectorAll(sel);
        if (!els.length) return { success: false, error: 'No elements found' };
        els.forEach(function (el) { for (var prop in s) el.style[prop] = s[prop]; });
        return { success: true, count: els.length };
      },
      args: [selector, styles]
    });
    return (results && results[0] && results[0].result) || fail('No result');
  });

  var script_inject = safe(async function (code) {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return fail('No active tab');
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: function (codeStr) { return new Function(codeStr)(); },
      args: [code]
    });
    var r = (results && results[0] && results[0].result);
    log('script_inject', { codeLength: code.length }, { hasResult: r !== undefined });
    return ok({ result: r });
  });

  var event_dispatch = safe(async function (selector, eventType, options) {
    options = options || {};
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return fail('No active tab');
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: function (sel, type, opts) {
        var el = document.querySelector(sel);
        if (!el) return { success: false, error: 'Element not found' };
        var ev;
        if (/^(mouse|click|dblclick|contextmenu)/.test(type)) ev = new MouseEvent(type, Object.assign({ bubbles: true, cancelable: true }, opts));
        else if (/^key/.test(type)) ev = new KeyboardEvent(type, Object.assign({ bubbles: true }, opts));
        else ev = new Event(type, { bubbles: true, cancelable: true });
        el.dispatchEvent(ev);
        return { success: true, event: type, target: el.tagName };
      },
      args: [selector, eventType, options]
    });
    return (results && results[0] && results[0].result) || fail('No result');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM TOOLS (12-15)
  // ═══════════════════════════════════════════════════════════════════════════

  var shell_exec = safe(function (command, options) {
    options = options || {};
    return nativeWithFallback(
      { type: 'shell_exec', command: command, cwd: options.cwd, timeout: options.timeout || 30000 },
      'http://localhost:7777/shell/exec',
      { command: command, cwd: options.cwd, timeout: options.timeout || 30000 },
      'shell_exec', { command: command }
    );
  });

  var file_read = safe(function (path, options) {
    options = options || {};
    return nativeWithFallback(
      { type: 'file_read', path: path, encoding: options.encoding || 'utf8' },
      'http://localhost:7777/file/read',
      { path: path, encoding: options.encoding || 'utf8' },
      'file_read', { path: path }
    );
  });

  var file_write = safe(function (path, content, options) {
    options = options || {};
    return nativeWithFallback(
      { type: 'file_write', path: path, content: content, append: options.append || false },
      'http://localhost:7777/file/write',
      { path: path, content: content, append: options.append || false },
      'file_write', { path: path, size: (content || '').length }
    );
  });

  var download_file = safe(async function (url, filename) {
    var downloadId = await chrome.downloads.download({ url: url, filename: filename || undefined, saveAs: false });
    log('download_file', { url: url, filename: filename }, { downloadId: downloadId });
    return ok({ downloadId: downloadId });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NETWORK TOOLS (16-17)
  // ═══════════════════════════════════════════════════════════════════════════

  var web_search = safe(async function (query, options) {
    options = options || {};
    var engine = options.engine || 'duckduckgo';
    var url = engine === 'google'
      ? 'https://www.google.com/search?q=' + encodeURIComponent(query)
      : 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);

    var resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' } });
    var text = await resp.text();
    var results = [];
    var titleRegex = /<a[^>]+class="result__a"[^>]*>([^<]+)<\/a>/gi;
    var snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([^<]+)/gi;
    var match;
    while ((match = titleRegex.exec(text)) && results.length < (options.limit || 8)) {
      var title = match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      var snip = snippetRegex.exec(text);
      results.push({ title: title, snippet: snip ? snip[1].replace(/&amp;/g, '&').slice(0, 200) : '' });
    }
    log('web_search', { query: query }, { count: results.length });
    return ok({ query: query, results: results });
  });

  var api_call = safe(async function (url, options) {
    options = options || {};
    var fetchOpts = { method: options.method || 'GET', headers: options.headers || {} };
    if (options.body) {
      fetchOpts.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      if (!fetchOpts.headers['Content-Type']) fetchOpts.headers['Content-Type'] = 'application/json';
    }
    if (options.timeout) fetchOpts.signal = AbortSignal.timeout(options.timeout);
    var resp = await fetch(url, fetchOpts);
    var contentType = resp.headers.get('content-type') || '';
    var data = contentType.includes('json') ? await resp.json() : await resp.text();
    log('api_call', { url: url, method: fetchOpts.method }, { status: resp.status });
    return ok({ status: resp.status, data: data });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA/STORAGE TOOLS (18-22)
  // ═══════════════════════════════════════════════════════════════════════════

  var storage_read = safe(async function (keys) {
    var data = await chrome.storage.local.get(keys);
    return ok({ data: data });
  });

  var storage_write = safe(async function (data) {
    await chrome.storage.local.set(data);
    log('storage_write', { keys: Object.keys(data) }, { ok: true });
    return ok({});
  });

  var cookie_read = safe(async function (url, name) {
    if (name) {
      var cookie = await chrome.cookies.get({ url: url, name: name });
      return ok({ cookie: cookie });
    }
    var cookies = await chrome.cookies.getAll({ url: url });
    return ok({ cookies: cookies });
  });

  var cookie_write = safe(async function (details) {
    var cookie = await chrome.cookies.set(details);
    return ok({ cookie: cookie });
  });

  var clipboard_access = safe(async function (action, text) {
    if (action === 'write') { await navigator.clipboard.writeText(text); return ok({ action: 'write' }); }
    if (action === 'read') { var content = await navigator.clipboard.readText(); return ok({ content: content }); }
    return fail('Unknown action');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVANCED TOOLS (23-29)
  // ═══════════════════════════════════════════════════════════════════════════

  var screenshot = safe(async function (options) {
    options = options || {};
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return fail('No active tab');
    var dataUrl = await chrome.tabs.captureVisibleTab(null, { format: options.format || 'png', quality: options.quality || 90 });
    log('screenshot', options, { size: dataUrl.length });
    return ok({ dataUrl: dataUrl });
  });

  var page_wait = safe(function (ms) {
    ms = Math.min(ms || 1000, 30000);
    return new Promise(function (resolve) { setTimeout(function () { resolve(ok({ waited: ms })); }, ms); });
  });

  var notification_send = safe(async function (title, message, options) {
    options = options || {};
    var id = 'hm-' + Date.now();
    await chrome.notifications.create(id, {
      type: 'basic', iconUrl: options.iconUrl || 'icons/icon48.png', title: title, message: message
    });
    return ok({ notificationId: id });
  });

  var bookmark_manage = safe(async function (action, options) {
    options = options || {};
    if (action === 'create') {
      var node = await chrome.bookmarks.create({ title: options.title, url: options.url, parentId: options.parentId });
      return ok({ bookmark: node });
    }
    if (action === 'search') {
      var results = await chrome.bookmarks.search(options.query || '');
      return ok({ bookmarks: results.slice(0, options.limit || 50) });
    }
    if (action === 'remove' && options.id) {
      await chrome.bookmarks.remove(options.id);
      return ok({ removed: options.id });
    }
    return fail('Unknown action: ' + action);
  });

  var history_search = safe(async function (query, options) {
    options = options || {};
    var results = await chrome.history.search({
      text: query, maxResults: options.limit || 20, startTime: options.startTime || 0
    });
    return ok({ results: results });
  });

  var alarm_manage = safe(async function (action, options) {
    options = options || {};
    if (action === 'create') {
      await chrome.alarms.create(options.name || 'hm-alarm', { delayInMinutes: options.delay || 1, periodInMinutes: options.period });
      return ok({ name: options.name || 'hm-alarm' });
    }
    if (action === 'list') {
      var alarms = await chrome.alarms.getAll();
      return ok({ alarms: alarms });
    }
    if (action === 'clear') {
      await chrome.alarms.clear(options.name);
      return ok({ cleared: options.name });
    }
    return fail('Unknown action: ' + action);
  });

  var window_manage = safe(async function (action, options) {
    options = options || {};
    if (action === 'create') {
      var win = await chrome.windows.create({ url: options.url, type: options.type || 'normal', width: options.width, height: options.height });
      return ok({ windowId: win.id });
    }
    if (action === 'list') {
      var wins = await chrome.windows.getAll({ populate: true });
      return ok({ windows: wins.map(function (w) { return { id: w.id, type: w.type, tabCount: w.tabs ? w.tabs.length : 0, focused: w.focused }; }) });
    }
    if (action === 'focus' && options.windowId) {
      await chrome.windows.update(options.windowId, { focused: true });
      return ok({ focused: options.windowId });
    }
    if (action === 'close' && options.windowId) {
      await chrome.windows.remove(options.windowId);
      return ok({ closed: options.windowId });
    }
    return fail('Unknown action: ' + action);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL REGISTRY & EXECUTOR
  // ═══════════════════════════════════════════════════════════════════════════

  var TOOL_REGISTRY = {
    browser_navigate: browser_navigate, click: click, fill_form: fill_form,
    extract_data: extract_data, dom_query: dom_query, input_simulate: input_simulate,
    tab_manage: tab_manage, element_modify: element_modify, style_modify: style_modify,
    script_inject: script_inject, event_dispatch: event_dispatch,
    shell_exec: shell_exec, file_read: file_read, file_write: file_write, download_file: download_file,
    web_search: web_search, api_call: api_call,
    storage_read: storage_read, storage_write: storage_write,
    cookie_read: cookie_read, cookie_write: cookie_write, clipboard_access: clipboard_access,
    screenshot: screenshot, page_wait: page_wait, notification_send: notification_send,
    bookmark_manage: bookmark_manage, history_search: history_search,
    alarm_manage: alarm_manage, window_manage: window_manage
  };

  // Maps tool names to their argument schema: [positional_arg_name, ..., options_object_fields]
  // The last entry (if an array) collects remaining fields into an options object.
  var TOOL_ARGS = {
    browser_navigate: ['url', ['newTab']],
    click: ['selector'],
    fill_form: ['fields'],
    extract_data: ['config'],
    dom_query: ['selector', ['limit']],
    input_simulate: ['selector', 'text', ['clear', 'submit']],
    tab_manage: ['action', ['tabId', 'url']],
    element_modify: ['selector', 'modifications'],
    style_modify: ['selector', 'styles'],
    script_inject: ['code'],
    event_dispatch: ['selector', 'eventType', ['bubbles', 'key', 'code']],
    shell_exec: ['command', ['cwd', 'timeout']],
    file_read: ['path', ['encoding']],
    file_write: ['path', 'content', ['append']],
    download_file: ['url', 'filename'],
    web_search: ['query', ['engine', 'limit']],
    api_call: ['url', ['method', 'headers', 'body', 'timeout']],
    storage_read: ['keys'],
    storage_write: ['data'],
    cookie_read: ['url', 'name'],
    cookie_write: ['details'],
    clipboard_access: ['action', 'text'],
    screenshot: [['format', 'quality']],
    page_wait: ['ms'],
    notification_send: ['title', 'message', ['iconUrl']],
    bookmark_manage: ['action', ['title', 'url', 'parentId', 'query', 'id', 'limit']],
    history_search: ['query', ['limit', 'startTime']],
    alarm_manage: ['action', ['name', 'delay', 'period']],
    window_manage: ['action', ['url', 'type', 'width', 'height', 'windowId']]
  };

  async function executeTool(toolName, args) {
    var fn = TOOL_REGISTRY[toolName];
    if (!fn) return fail('Unknown tool: ' + toolName);
    try {
      if (Array.isArray(args)) return await fn.apply(null, args);
      if (typeof args === 'object' && args !== null) {
        var schema = TOOL_ARGS[toolName];
        if (schema) {
          var positional = [];
          for (var i = 0; i < schema.length; i++) {
            if (Array.isArray(schema[i])) {
              var opts = {};
              schema[i].forEach(function (field) { if (args[field] !== undefined) opts[field] = args[field]; });
              positional.push(opts);
            } else {
              positional.push(args[schema[i]]);
            }
          }
          return await fn.apply(null, positional);
        }
        var keys = Object.keys(args);
        return await fn.apply(null, keys.map(function (k) { return args[k]; }));
      }
      return await fn(args);
    } catch (e) { return { success: false, error: e.message, tool: toolName }; }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    browser_navigate: browser_navigate, click: click, fill_form: fill_form,
    extract_data: extract_data, dom_query: dom_query, input_simulate: input_simulate,
    tab_manage: tab_manage, element_modify: element_modify, style_modify: style_modify,
    script_inject: script_inject, event_dispatch: event_dispatch,
    shell_exec: shell_exec, file_read: file_read, file_write: file_write, download_file: download_file,
    web_search: web_search, api_call: api_call,
    storage_read: storage_read, storage_write: storage_write,
    cookie_read: cookie_read, cookie_write: cookie_write, clipboard_access: clipboard_access,
    screenshot: screenshot, page_wait: page_wait, notification_send: notification_send,
    bookmark_manage: bookmark_manage, history_search: history_search,
    alarm_manage: alarm_manage, window_manage: window_manage,
    executeTool: executeTool,
    getRegistry: function () { return Object.keys(TOOL_REGISTRY); },
    getLog: function () { return toolLog.slice(-50); },
    getToolCount: function () { return Object.keys(TOOL_REGISTRY).length; }
  };
}());
