// HailMary Content Script — floating button + inline text capture on AI pages
(function () {
  if (window.__hm) return;
  window.__hm = true;

  var btn = document.createElement('div');
  btn.id = '__hm_btn';
  btn.textContent = '☄️';
  btn.title = 'HailMary — enhance current input (Alt+H)';
  document.body.appendChild(btn);

  var style = document.createElement('style');
  style.textContent = [
    '#__hm_btn{position:fixed;bottom:76px;right:16px;width:38px;height:38px;border-radius:50%;',
    'background:linear-gradient(135deg,#7c3aed,#f97316);display:flex;align-items:center;',
    'justify-content:center;font-size:17px;cursor:pointer;z-index:2147483647;',
    'box-shadow:0 3px 16px rgba(124,58,237,.55);transition:transform .2s,box-shadow .2s;',
    'user-select:none;opacity:.9}',
    '#__hm_btn:hover{transform:scale(1.15);box-shadow:0 5px 24px rgba(124,58,237,.8);opacity:1}',
    '#__hm_btn.pulse{animation:hm-pulse .6s ease}',
    '@keyframes hm-pulse{0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)}}'
  ].join('');
  document.head.appendChild(style);

  var INPUT_SELECTORS = [
    '#prompt-textarea', '.ProseMirror', '[contenteditable="true"]',
    'textarea[placeholder*="message"]', 'textarea[placeholder*="Ask"]',
    '[role="textbox"]', 'textarea'
  ];

  function findInput() {
    for (var i = 0; i < INPUT_SELECTORS.length; i++) {
      try {
        var e = document.querySelector(INPUT_SELECTORS[i]);
        if (e && e.offsetParent) return e;
      } catch (x) {}
    }
    return null;
  }

  function getInputText(el) {
    return (el.value || el.textContent || '').trim();
  }

  btn.addEventListener('click', function () {
    var inp = findInput();
    if (!inp) { showMsg('No input found on this page'); return; }
    var raw = getInputText(inp);
    if (!raw) { showMsg('Type something first'); inp.focus(); return; }

    // Store captured text so popup can read it
    try {
      chrome.storage.local.set({ hm_captured: raw }, function () {
        btn.classList.add('pulse');
        setTimeout(function () { btn.classList.remove('pulse'); }, 600);
        showMsg('Captured — open HailMary to enhance');
      });
    } catch (e) {
      showMsg('Open HailMary popup to enhance');
    }
  });

  // Alt+H shortcut
  document.addEventListener('keydown', function (e) {
    if (e.altKey && e.key.toLowerCase() === 'h') btn.click();
  });

  // Listen for inject messages from popup
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === 'HM_GET_INPUT_TEXT') {
      var inp = findInput();
      sendResponse({ text: inp ? getInputText(inp) : '' });
    }
  });

  function showMsg(txt) {
    var old = document.getElementById('__hm_msg');
    if (old) old.remove();
    var d = document.createElement('div');
    d.id = '__hm_msg';
    d.textContent = txt;
    d.style.cssText = 'position:fixed;bottom:124px;right:16px;background:#7c3aed;color:#fff;padding:6px 13px;border-radius:14px;font:600 11.5px system-ui;z-index:2147483647;pointer-events:none;box-shadow:0 3px 14px rgba(124,58,237,.4)';
    document.body.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2000);
  }
})();
