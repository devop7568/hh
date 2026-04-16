/* PromptForge AI - Content Script
   Injects optimized prompts into AI chat interfaces */

(function () {
  'use strict';

  const SELECTORS = {
    'chat.openai.com': { input: '#prompt-textarea', button: '[data-testid="send-button"]' },
    'chatgpt.com': { input: '#prompt-textarea', button: '[data-testid="send-button"]' },
    'claude.ai': { input: '[contenteditable="true"]', button: 'button[aria-label="Send Message"]' },
    'gemini.google.com': { input: '.ql-editor', button: 'button[aria-label="Send message"]' },
    'copilot.microsoft.com': { input: '#searchbox', button: '#search_icon' },
    'poe.com': { input: 'textarea', button: 'button[class*="send"]' }
  };

  function getSiteSelectors() {
    const host = window.location.hostname;
    for (const [domain, sel] of Object.entries(SELECTORS)) {
      if (host.includes(domain.replace('https://', ''))) {
        return sel;
      }
    }
    return null;
  }

  function findInputElement() {
    const sel = getSiteSelectors();
    if (sel) {
      const el = document.querySelector(sel.input);
      if (el) return el;
    }
    const candidates = [
      'textarea',
      '[contenteditable="true"]',
      'input[type="text"]'
    ];
    for (const c of candidates) {
      const el = document.querySelector(c);
      if (el) return el;
    }
    return null;
  }

  function insertText(text) {
    const el = findInputElement();
    if (!el) {
      showNotification('Could not find chat input on this page.', 'error');
      return false;
    }

    el.focus();

    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(el, text);
      } else {
        el.value = text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (el.getAttribute('contenteditable') === 'true') {
      el.innerHTML = '';
      const lines = text.split('\n');
      lines.forEach((line, i) => {
        const p = document.createElement('p');
        p.textContent = line || '\u200B';
        el.appendChild(p);
        if (i < lines.length - 1) {
          el.appendChild(document.createElement('br'));
        }
      });
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    showNotification('Prompt inserted successfully!', 'success');
    return true;
  }

  function showNotification(message, type) {
    const existing = document.getElementById('promptforge-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'promptforge-notification';
    notification.className = `promptforge-notify promptforge-notify-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
      notification.classList.add('promptforge-notify-visible');
    });

    setTimeout(() => {
      notification.classList.remove('promptforge-notify-visible');
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  }

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'insertPrompt') {
      const success = insertText(request.text);
      sendResponse({ success });
    }
    if (request.action === 'ping') {
      sendResponse({ alive: true });
    }
    return false;
  });
})();
