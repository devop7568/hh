/* PromptForge AI - Options Page Logic */

(function () {
  'use strict';

  var PROVIDER_INFO = {
    openai: {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      note: 'OpenAI models: gpt-4o, gpt-4o-mini, gpt-4-turbo. Get your API key at <a href="https://platform.openai.com/api-keys" target="_blank" style="color: var(--accent);">platform.openai.com/api-keys</a>'
    },
    openrouter: {
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      note: 'OpenRouter offers free models! Get your key at <a href="https://openrouter.ai/keys" target="_blank" style="color: var(--accent);">openrouter.ai/keys</a>. Free models: meta-llama/llama-3.1-8b-instruct:free, google/gemma-2-9b-it:free'
    },
    anthropic: {
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-sonnet-4-20250514',
      note: 'Anthropic models: claude-sonnet-4-20250514, claude-3-haiku-20240307. Get your key at <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color: var(--accent);">console.anthropic.com</a>'
    },
    custom: {
      endpoint: '',
      model: '',
      note: 'Enter any OpenAI-compatible endpoint and model. Works with local servers like Ollama (http://localhost:11434/v1/chat/completions) or LM Studio.'
    }
  };

  var providerSelect = document.getElementById('provider');
  var endpointInput = document.getElementById('endpoint');
  var modelInput = document.getElementById('model');
  var providerNote = document.getElementById('provider-note');
  var tempSlider = document.getElementById('temperature');
  var tempVal = document.getElementById('temp-val');

  providerSelect.addEventListener('change', function () {
    var info = PROVIDER_INFO[providerSelect.value];
    if (info) {
      endpointInput.value = info.endpoint;
      modelInput.value = info.model;
      providerNote.innerHTML = info.note;
    }
  });

  tempSlider.addEventListener('input', function () {
    tempVal.textContent = tempSlider.value;
  });

  // Load saved settings
  chrome.storage.local.get('settings', function (result) {
    var s = result.settings || {};
    if (s.apiProvider) providerSelect.value = s.apiProvider;
    if (s.apiKey) document.getElementById('apiKey').value = s.apiKey;
    if (s.endpoint) endpointInput.value = s.endpoint;
    if (s.model) modelInput.value = s.model;
    if (s.temperature !== undefined) {
      tempSlider.value = s.temperature;
      tempVal.textContent = s.temperature;
    }
    if (s.maxTokens) document.getElementById('maxTokens').value = s.maxTokens;
  });

  document.getElementById('btn-save').addEventListener('click', function () {
    var settings = {
      apiProvider: providerSelect.value,
      apiKey: document.getElementById('apiKey').value.trim(),
      endpoint: endpointInput.value.trim(),
      model: modelInput.value.trim(),
      temperature: parseFloat(tempSlider.value),
      maxTokens: parseInt(document.getElementById('maxTokens').value, 10) || 2048
    };

    chrome.storage.local.set({ settings: settings }, function () {
      // Verify save worked by reading back
      chrome.storage.local.get('settings', function (result) {
        var status = document.getElementById('status');
        if (result.settings && result.settings.apiKey === settings.apiKey) {
          status.textContent = 'Settings saved successfully!';
          status.style.color = 'var(--success)';
        } else {
          status.textContent = 'Warning: Settings may not have saved correctly. Please try again.';
          status.style.color = 'var(--error)';
        }
        status.classList.add('visible');
        setTimeout(function () { status.classList.remove('visible'); }, 3000);
      });
    });
  });
})();
