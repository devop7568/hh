/**
 * HailMary v6.0 — CONTENT SCRIPT
 * Floating enhance button on AI pages, inline grab-and-enhance,
 * keyboard shortcut (Ctrl+Shift+H), and expanded AI site detection.
 */
(function () {
  'use strict';

  var AI_SITES = [
    'chatgpt.com', 'openai.com', 'claude.ai', 'gemini.google.com',
    'perplexity.ai', 'poe.com', 'grok.com', 'you.com', 'copilot.microsoft.com',
    'deepseek.com', 'chat.mistral.ai', 'huggingface.co', 'pi.ai',
    'labs.google', 'aistudio.google.com'
  ];

  var INPUT_SELECTORS = [
    '#prompt-textarea', '.ProseMirror', '[contenteditable="true"]',
    'textarea[placeholder*="message"]', 'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Ask"]', '[role="textbox"]', 'textarea'
  ];

  var host = location.hostname;
  var isAI = AI_SITES.some(function (s) { return host.includes(s); });
  if (!isAI) return;

  // ─── FLOATING BUTTON ─────────────────────────────────────────────────────
  var btn = document.createElement('div');
  btn.id = 'hm-float-btn';
  btn.innerHTML = '\u2604\ufe0f';
  btn.title = 'HailMary: Enhance input (Ctrl+Shift+H)';
  btn.style.cssText = [
    'position:fixed', 'bottom:20px', 'right:20px', 'z-index:999999',
    'width:44px', 'height:44px', 'border-radius:50%',
    'background:linear-gradient(135deg,#7c3aed,#5b21b6)',
    'color:white', 'font-size:20px', 'cursor:pointer',
    'display:flex', 'align-items:center', 'justify-content:center',
    'box-shadow:0 4px 16px rgba(124,58,237,0.5)',
    'transition:all 0.2s cubic-bezier(0.4,0,0.2,1)',
    'user-select:none', 'border:2px solid rgba(167,139,250,0.4)'
  ].join(';');

  btn.addEventListener('mouseenter', function () {
    btn.style.transform = 'scale(1.12)';
    btn.style.boxShadow = '0 6px 24px rgba(124,58,237,0.7)';
  });
  btn.addEventListener('mouseleave', function () {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 16px rgba(124,58,237,0.5)';
  });

  btn.addEventListener('click', function () {
    var input = findInput();
    if (!input) {
      showNotice('No input field found on this page');
      return;
    }
    var text = getInputValue(input);
    if (!text || text.trim().length < 2) {
      showNotice('Type something first, then click to enhance');
      return;
    }
    enhanceAndInject(input, text);
  });

  document.body.appendChild(btn);

  // ─── KEYBOARD SHORTCUT ───────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      btn.click();
    }
  });

  // ─── FIND INPUT ──────────────────────────────────────────────────────────
  function findInput() {
    for (var i = 0; i < INPUT_SELECTORS.length; i++) {
      var el = document.querySelector(INPUT_SELECTORS[i]);
      if (el && isVisible(el)) return el;
    }
    return null;
  }

  function isVisible(el) {
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && getComputedStyle(el).display !== 'none';
  }

  function getInputValue(el) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value;
    return el.textContent || el.innerText || '';
  }

  function setInputValue(el, text) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = text;
    } else {
      el.textContent = text;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ─── ENHANCE ─────────────────────────────────────────────────────────────
  function enhanceAndInject(input, text) {
    btn.innerHTML = '\u23f3';
    btn.style.pointerEvents = 'none';

    chrome.runtime.sendMessage({ type: 'GET_KNOWLEDGE' }, function (resp) {
      try {
        var knowledge = (resp && resp.knowledge) || null;
        var enhanced = localEnhance(text, knowledge);
        setInputValue(input, enhanced);
        showNotice('Enhanced! (' + text.split(/\s+/).length + ' \u2192 ' + enhanced.split(/\s+/).length + ' words)');
      } catch (e) {
        showNotice('Enhancement error: ' + e.message);
      }
      btn.innerHTML = '\u2604\ufe0f';
      btn.style.pointerEvents = '';
    });
  }

  function localEnhance(text, knowledge) {
    var enhanced = '';

    enhanced += 'You are an expert assistant. I need thorough, precise help with the following:\n\n';
    enhanced += text + '\n\n';
    enhanced += 'Requirements:\n';
    enhanced += '- Provide a complete, detailed response\n';
    enhanced += '- Include specific examples where helpful\n';
    enhanced += '- Address edge cases and potential issues\n';
    enhanced += '- Structure your response clearly\n';

    if (/\b(code|function|implement|build|debug|script)\b/i.test(text)) {
      enhanced += '- Write production-ready code with error handling\n';
      enhanced += '- Include usage examples and documentation\n';
    }
    if (/\b(explain|research|what|how|why)\b/i.test(text)) {
      enhanced += '- Distinguish established facts from speculation\n';
      enhanced += '- Cite mechanisms and evidence where applicable\n';
    }

    if (knowledge && knowledge.techniques && knowledge.techniques.length > 0) {
      var relevant = knowledge.techniques.slice(0, 3);
      enhanced += '\nApply these prompting techniques:\n';
      relevant.forEach(function (t) {
        enhanced += '- ' + (t.name || t) + (t.instruction ? ': ' + t.instruction : '') + '\n';
      });
    }

    enhanced += '\nProvide your best, most thorough response.';
    return enhanced;
  }

  // ─── NOTICE ──────────────────────────────────────────────────────────────
  function showNotice(msg) {
    var old = document.getElementById('hm-notice');
    if (old) old.remove();

    var notice = document.createElement('div');
    notice.id = 'hm-notice';
    notice.textContent = msg;
    notice.style.cssText = [
      'position:fixed', 'bottom:72px', 'right:20px', 'z-index:999999',
      'padding:8px 16px', 'border-radius:8px', 'font-size:12px',
      'background:rgba(30,30,46,0.95)', 'color:#e2e8f0',
      'border:1px solid rgba(124,58,237,0.4)',
      'box-shadow:0 4px 16px rgba(0,0,0,0.4)',
      'backdrop-filter:blur(8px)', 'font-family:system-ui,sans-serif',
      'max-width:280px', 'animation:hmFadeIn 0.2s ease-out'
    ].join(';');

    var style = document.createElement('style');
    style.textContent = '@keyframes hmFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
    if (!document.getElementById('hm-anim-style')) { style.id = 'hm-anim-style'; document.head.appendChild(style); }

    document.body.appendChild(notice);
    setTimeout(function () { if (notice.parentNode) notice.remove(); }, 3000);
  }

  console.log('[HailMary] Content script loaded on ' + host);
}());
