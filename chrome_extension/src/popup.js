const el = {
  rawPrompt: document.getElementById('rawPrompt'),
  profile: document.getElementById('profile'),
  outputType: document.getElementById('outputType'),
  result: document.getElementById('result'),
  status: document.getElementById('status'),
  enhance: document.getElementById('enhance'),
  train: document.getElementById('train'),
  copy: document.getElementById('copy'),
  openOptions: document.getElementById('openOptions')
};

function setStatus(text) {
  el.status.textContent = text;
}

async function getCurrentTabContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return {
    summary: 'Popup-triggered enhancement request.',
    url: tab?.url,
    title: tab?.title,
    selectedText: '',
    constraints: []
  };
}

async function hydrateDefaults() {
  chrome.runtime.sendMessage({ type: 'PROMPTING_PRO_GET_STATE' }, (response) => {
    if (!response?.ok) {
      return;
    }
    const state = response.state;
    if (state.defaultProfile) {
      el.profile.value = state.defaultProfile;
    }
    if (state.defaultOutputType) {
      el.outputType.value = state.defaultOutputType;
    }
  });
}

el.enhance.addEventListener('click', async () => {
  const rawPrompt = el.rawPrompt.value.trim();
  if (!rawPrompt) {
    setStatus('Paste a prompt first.');
    return;
  }

  setStatus('Enhancing...');
  const workspace = await getCurrentTabContext();

  chrome.runtime.sendMessage(
    {
      type: 'PROMPTING_PRO_ENHANCE',
      payload: {
        rawPrompt,
        profile: el.profile.value,
        outputType: el.outputType.value,
        workspace
      }
    },
    (response) => {
      if (!response?.ok) {
        setStatus(response?.error || 'Enhancement failed.');
        return;
      }

      el.result.value = response.result.enhancedPrompt;
      setStatus(`Done • ${response.result.examplesUsed} examples • ${response.result.directivesUsed} directives`);
    }
  );
});

el.train.addEventListener('click', () => {
  setStatus('Training...');
  chrome.runtime.sendMessage({ type: 'PROMPTING_PRO_TRAIN' }, (response) => {
    if (!response?.ok) {
      setStatus('Training failed.');
      return;
    }
    setStatus(`Trained at ${response.trained.trainedAt}`);
  });
});

el.copy.addEventListener('click', async () => {
  if (!el.result.value.trim()) {
    setStatus('Nothing to copy yet.');
    return;
  }
  await navigator.clipboard.writeText(el.result.value);
  setStatus('Copied enhanced prompt.');
});

el.openOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

hydrateDefaults();
