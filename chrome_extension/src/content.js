const PANEL_ID = 'prompting-pro-panel';

function ensurePanel() {
  let panel = document.getElementById(PANEL_ID);
  if (panel) {
    return panel;
  }

  panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.position = 'fixed';
  panel.style.bottom = '16px';
  panel.style.right = '16px';
  panel.style.width = '420px';
  panel.style.maxHeight = '60vh';
  panel.style.overflow = 'auto';
  panel.style.background = '#0f172a';
  panel.style.color = '#e2e8f0';
  panel.style.padding = '12px';
  panel.style.border = '1px solid #334155';
  panel.style.borderRadius = '12px';
  panel.style.boxShadow = '0 12px 32px rgba(0,0,0,.35)';
  panel.style.fontFamily = 'ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto';
  panel.style.zIndex = '2147483647';

  const title = document.createElement('div');
  title.textContent = 'Prompting Pro';
  title.style.fontWeight = '700';
  title.style.marginBottom = '8px';
  panel.appendChild(title);

  const close = document.createElement('button');
  close.textContent = '×';
  close.style.position = 'absolute';
  close.style.top = '8px';
  close.style.right = '10px';
  close.style.border = '0';
  close.style.background = 'transparent';
  close.style.color = '#e2e8f0';
  close.style.cursor = 'pointer';
  close.style.fontSize = '20px';
  close.addEventListener('click', () => panel.remove());
  panel.appendChild(close);

  const body = document.createElement('pre');
  body.id = `${PANEL_ID}-body`;
  body.style.whiteSpace = 'pre-wrap';
  body.style.lineHeight = '1.35';
  body.style.fontSize = '12px';
  body.textContent = 'No enhanced prompt yet.';
  panel.appendChild(body);

  const copy = document.createElement('button');
  copy.textContent = 'Copy Enhanced Prompt';
  copy.style.marginTop = '8px';
  copy.style.width = '100%';
  copy.style.padding = '8px';
  copy.style.borderRadius = '8px';
  copy.style.border = '1px solid #475569';
  copy.style.background = '#1e293b';
  copy.style.color = '#e2e8f0';
  copy.style.cursor = 'pointer';
  copy.addEventListener('click', async () => {
    const text = body.textContent || '';
    await navigator.clipboard.writeText(text);
    copy.textContent = 'Copied!';
    setTimeout(() => {
      copy.textContent = 'Copy Enhanced Prompt';
    }, 1200);
  });
  panel.appendChild(copy);

  document.documentElement.appendChild(panel);
  return panel;
}

function renderResult(result) {
  const panel = ensurePanel();
  const body = panel.querySelector(`#${PANEL_ID}-body`);
  body.textContent = result.enhancedPrompt;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'PROMPTING_PRO_RESULT') {
    renderResult(message.payload);
  }
});

window.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
    const selection = window.getSelection()?.toString() || '';
    if (!selection.trim()) {
      return;
    }

    chrome.runtime.sendMessage({
      type: 'PROMPTING_PRO_ENHANCE',
      payload: {
        rawPrompt: selection,
        outputType: 'prompt',
        workspace: {
          summary: 'Enhanced from in-page keyboard shortcut.',
          url: location.href,
          title: document.title,
          selectedText: selection,
          constraints: []
        }
      }
    }, (response) => {
      if (response?.ok) {
        renderResult(response.result);
      }
    });
  }
});
