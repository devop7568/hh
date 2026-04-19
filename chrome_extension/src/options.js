const el = {
  defaultProfile: document.getElementById('defaultProfile'),
  defaultOutputType: document.getElementById('defaultOutputType'),
  constraints: document.getElementById('constraints'),
  save: document.getElementById('save'),
  train: document.getElementById('train'),
  stateView: document.getElementById('stateView'),
  status: document.getElementById('status')
};

function setStatus(text) {
  el.status.textContent = text;
}

function renderState(state) {
  el.stateView.textContent = JSON.stringify(state, null, 2);
}

function parseConstraints(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function hydrate() {
  chrome.runtime.sendMessage({ type: 'PROMPTING_PRO_GET_STATE' }, (response) => {
    if (!response?.ok) {
      setStatus('Failed to load state.');
      return;
    }

    const state = response.state;
    el.defaultProfile.value = state.defaultProfile || 'lucario';
    el.defaultOutputType.value = state.defaultOutputType || 'prompt';
    el.constraints.value = (state.globalConstraints || []).join('\n');
    renderState(state);
    setStatus('Loaded settings.');
  });
}

el.save.addEventListener('click', () => {
  const payload = {
    defaultProfile: el.defaultProfile.value,
    defaultOutputType: el.defaultOutputType.value,
    globalConstraints: parseConstraints(el.constraints.value)
  };

  chrome.runtime.sendMessage({ type: 'PROMPTING_PRO_SAVE_SETTINGS', payload }, (response) => {
    if (!response?.ok) {
      setStatus('Save failed.');
      return;
    }

    renderState(response.state);
    setStatus('Settings saved.');
  });
});

el.train.addEventListener('click', () => {
  setStatus('Training...');
  chrome.runtime.sendMessage({ type: 'PROMPTING_PRO_TRAIN' }, (response) => {
    if (!response?.ok) {
      setStatus('Training failed.');
      return;
    }
    setStatus(`Trained at ${response.trained.trainedAt}`);
    hydrate();
  });
});

hydrate();
