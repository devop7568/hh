import { enhancePrompt, trainModel } from './engine.js';

const STATE_KEY = 'prompting_pro_state_v3';
let cachedData = null;

async function loadData() {
  if (cachedData) {
    return cachedData;
  }

  const trainingUrl = chrome.runtime.getURL('data/prompt_training_data.chrome.json');
  const blueprintUrl = chrome.runtime.getURL('data/lucario_prompt_blueprints.chrome.json');
  const playbooksUrl = chrome.runtime.getURL('data/prompt_playbooks.json');

  const [trainingData, blueprintData, playbookData] = await Promise.all([
    fetch(trainingUrl).then((r) => r.json()),
    fetch(blueprintUrl).then((r) => r.json()),
    fetch(playbooksUrl).then((r) => r.json())
  ]);

  cachedData = { trainingData, blueprintData, playbookData };
  return cachedData;
}

async function getState() {
  const stored = await chrome.storage.local.get(STATE_KEY);
  const state = stored[STATE_KEY] || {};
  const { trainingData } = await loadData();

  if (!state.trained) {
    state.trained = trainModel(trainingData);
    await chrome.storage.local.set({ [STATE_KEY]: state });
  }
  return state;
}

async function saveState(state) {
  await chrome.storage.local.set({ [STATE_KEY]: state });
}

chrome.runtime.onInstalled.addListener(async () => {
  await getState();

  chrome.contextMenus.create({
    id: 'prompting-pro-enhance-selection',
    title: 'Enhance selected prompt with Prompting Pro',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'prompting-pro-enhance-selection') {
    return;
  }

  const state = await getState();
  const { trainingData, blueprintData, playbookData } = await loadData();
  const rawPrompt = info.selectionText || '';

  const result = enhancePrompt({
    rawPrompt,
    profile: state.defaultProfile || 'lucario',
    outputType: state.defaultOutputType || 'prompt',
    workspace: {
      summary: 'Context-menu enhancement execution.',
      url: tab?.url,
      title: tab?.title,
      selectedText: rawPrompt,
      constraints: state.globalConstraints || []
    },
    trainingData,
    blueprintData,
    playbookData,
    trained: state.trained
  });

  state.lastEnhancement = {
    at: new Date().toISOString(),
    prompt: rawPrompt.slice(0, 200),
    profile: result.profile,
    outputType: result.outputType,
    score: result.directivesUsed + result.examplesUsed * 0.1
  };
  await saveState(state);

  await chrome.tabs.sendMessage(tab.id, {
    type: 'PROMPTING_PRO_RESULT',
    payload: result
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const state = await getState();
    const { trainingData, blueprintData, playbookData } = await loadData();

    if (message.type === 'PROMPTING_PRO_ENHANCE') {
      const result = enhancePrompt({
        rawPrompt: message.payload.rawPrompt,
        profile: message.payload.profile || state.defaultProfile || 'lucario',
        outputType: message.payload.outputType || state.defaultOutputType || 'prompt',
        workspace: message.payload.workspace,
        trainingData,
        blueprintData,
        playbookData,
        trained: state.trained
      });

      state.lastEnhancement = {
        at: new Date().toISOString(),
        prompt: message.payload.rawPrompt.slice(0, 200),
        profile: result.profile,
        outputType: result.outputType,
        score: result.directivesUsed + result.examplesUsed * 0.1
      };
      await saveState(state);
      sendResponse({ ok: true, result });
      return;
    }

    if (message.type === 'PROMPTING_PRO_TRAIN') {
      state.trained = trainModel(trainingData);
      state.lastTraining = state.trained.trainedAt;
      await saveState(state);
      sendResponse({ ok: true, trained: state.trained });
      return;
    }

    if (message.type === 'PROMPTING_PRO_GET_STATE') {
      sendResponse({ ok: true, state });
      return;
    }

    if (message.type === 'PROMPTING_PRO_SAVE_SETTINGS') {
      state.defaultProfile = message.payload.defaultProfile;
      state.defaultOutputType = message.payload.defaultOutputType;
      state.globalConstraints = message.payload.globalConstraints || [];
      await saveState(state);
      sendResponse({ ok: true, state });
      return;
    }

    sendResponse({ ok: false, error: 'Unknown message type.' });
  })();

  return true;
});
