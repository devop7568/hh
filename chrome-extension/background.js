/* PromptForge AI - Background Service Worker
   Advanced prompt engineering with real AI integration.
   Uses the prompt-knowledge.js knowledge base for technique selection. */

importScripts('prompt-knowledge.js');

const DEFAULT_SETTINGS = {
  apiProvider: 'openrouter',
  apiKey: '',
  model: 'meta-llama/llama-3.1-8b-instruct:free',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  temperature: 0.7,
  maxTokens: 4096
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings', (result) => {
    if (!result.settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    }
  });
  chrome.storage.local.get('promptLibrary', (result) => {
    if (!result.promptLibrary) {
      chrome.storage.local.set({ promptLibrary: [] });
    }
  });
  chrome.storage.local.get('promptHistory', (result) => {
    if (!result.promptHistory) {
      chrome.storage.local.set({ promptHistory: [] });
    }
  });
});

/* -- Message Router -- */

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'optimizePrompt') {
    optimizePrompt(request.data).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message });
    });
    return true;
  }

  if (request.action === 'deepOptimize') {
    deepOptimize(request.data).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message });
    });
    return true;
  }

  if (request.action === 'saveToLibrary') {
    saveToLibrary(request.data).then(sendResponse);
    return true;
  }

  if (request.action === 'getLibrary') {
    chrome.storage.local.get('promptLibrary', (result) => {
      sendResponse(result.promptLibrary || []);
    });
    return true;
  }

  if (request.action === 'deleteFromLibrary') {
    deleteFromLibrary(request.data.id).then(sendResponse);
    return true;
  }

  if (request.action === 'toggleFavorite') {
    toggleFavorite(request.data.id).then(sendResponse);
    return true;
  }

  if (request.action === 'getHistory') {
    chrome.storage.local.get('promptHistory', (result) => {
      sendResponse(result.promptHistory || []);
    });
    return true;
  }

  if (request.action === 'getSettings') {
    chrome.storage.local.get('settings', (result) => {
      sendResponse(result.settings || DEFAULT_SETTINGS);
    });
    return true;
  }

  if (request.action === 'checkSettings') {
    chrome.storage.local.get('settings', (result) => {
      const s = result.settings;
      sendResponse({
        hasApiKey: !!(s && s.apiKey && s.apiKey.trim()),
        provider: s ? s.apiProvider : 'none'
      });
    });
    return true;
  }

  return false;
});

/* -- Settings & LLM Call -- */

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings', (result) => {
      resolve(result.settings || DEFAULT_SETTINGS);
    });
  });
}

async function callLLM(messages, overrideMaxTokens) {
  const settings = await getSettings();

  if (!settings.apiKey) {
    throw new Error('API key not configured. Go to extension options to set your API key.');
  }

  let endpoint = settings.endpoint;
  const headers = { 'Content-Type': 'application/json' };

  if (settings.apiProvider === 'openai' || settings.apiProvider === 'openrouter') {
    headers['Authorization'] = 'Bearer ' + settings.apiKey;
  } else if (settings.apiProvider === 'anthropic') {
    headers['x-api-key'] = settings.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    endpoint = 'https://api.anthropic.com/v1/messages';
  } else {
    headers['Authorization'] = 'Bearer ' + settings.apiKey;
  }

  if (settings.apiProvider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://promptforge.ai';
    headers['X-Title'] = 'PromptForge AI';
  }

  const maxTokens = overrideMaxTokens || settings.maxTokens || 4096;

  let body;
  if (settings.apiProvider === 'anthropic') {
    const systemMsg = messages.find((m) => m.role === 'system');
    const userMsgs = messages.filter((m) => m.role !== 'system');
    body = JSON.stringify({
      model: settings.model,
      max_tokens: maxTokens,
      system: systemMsg ? systemMsg.content : '',
      messages: userMsgs
    });
  } else {
    body = JSON.stringify({
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: maxTokens,
      messages
    });
  }

  const response = await fetch(endpoint, { method: 'POST', headers, body });

  if (!response.ok) {
    const text = await response.text();
    throw new Error('API error ' + response.status + ': ' + text);
  }

  const data = await response.json();

  if (settings.apiProvider === 'anthropic') {
    return data.content?.[0]?.text || '';
  }
  return data.choices?.[0]?.message?.content || '';
}

/* -- Task Classification -- */

function classifyTask(userInput) {
  const input = userInput.toLowerCase();
  const classifications = PROMPT_KNOWLEDGE.optimizationStrategies.taskClassification;
  const scores = {};

  for (const [category, config] of Object.entries(classifications)) {
    let score = 0;
    for (const indicator of config.indicators) {
      if (input.includes(indicator)) score += 1;
    }
    scores[category] = score;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][1] > 0 ? sorted[0][0] : 'creative';
  const secondary = sorted[1] && sorted[1][1] > 0 ? sorted[1][0] : null;

  return { primary, secondary, scores };
}

function getRelevantExamples(taskType) {
  const examples = PROMPT_KNOWLEDGE.exampleLibrary.beforeAfter;
  const categoryMap = {
    analytical: 'Research',
    creative: 'Creative',
    technical: 'Technical',
    strategic: 'Strategy',
    persuasive: 'Business',
    research: 'Research',
    educational: 'Research'
  };
  const target = categoryMap[taskType] || 'Creative';
  const match = examples.find((e) => e.category === target);
  return match || examples[0];
}

function getTechniqueDescriptions(taskType) {
  const config = PROMPT_KNOWLEDGE.optimizationStrategies.taskClassification[taskType];
  if (!config) return '';

  const techniques = config.bestTechniques;
  const descriptions = [];
  for (const techName of techniques) {
    const tech = PROMPT_KNOWLEDGE.techniques[techName] || PROMPT_KNOWLEDGE.advancedMethods[techName];
    if (tech) {
      descriptions.push('- ' + tech.name + ': ' + tech.description);
    }
  }
  return descriptions.join('\n');
}

function getQualityBoosters(taskType) {
  const config = PROMPT_KNOWLEDGE.optimizationStrategies.taskClassification[taskType];
  return config ? config.qualityBoosters : [];
}

/* -- Build System Prompt Dynamically -- */

function buildMasterSystemPrompt(taskType, mode) {
  const config = PROMPT_KNOWLEDGE.optimizationStrategies.taskClassification[taskType];
  const baseKey = config ? config.systemPromptKey : 'masterOptimizer';
  const basePrompt = PROMPT_KNOWLEDGE.systemPromptPatterns[baseKey] || PROMPT_KNOWLEDGE.systemPromptPatterns.masterOptimizer;
  const boosters = getQualityBoosters(taskType);
  const techniques = getTechniqueDescriptions(taskType);
  const constructionRules = PROMPT_KNOWLEDGE.constructionRules;
  const example = getRelevantExamples(taskType);

  const parts = [
    basePrompt,
    '',
    '=== PROMPT ENGINEERING KNOWLEDGE BASE ===',
    '',
    'You have access to extensive prompt engineering knowledge. Apply these techniques automatically:',
    '',
    techniques,
    '',
    '=== QUALITY REQUIREMENTS ===',
    boosters.map(function(b) { return '- ' + b; }).join('\n'),
    '',
    '=== PROMPT CONSTRUCTION RULES ===',
    'Optimal ordering:',
    constructionRules.ordering.map(function(r, i) { return (i + 1) + '. ' + r; }).join('\n'),
    '',
    'Power amplifiers to include:',
    constructionRules.amplifiers.slice(0, 5).map(function(a) { return '- ' + a; }).join('\n'),
    '',
    'Anti-patterns to avoid:',
    constructionRules.antiPatterns.slice(0, 4).map(function(a) { return '- ' + a; }).join('\n'),
    '',
    '=== EXAMPLE ===',
    'BEFORE (weak prompt): "' + example.before + '"',
    '',
    'AFTER (engineered prompt):',
    example.after,
    '',
    '=== YOUR TASK ===',
    "Transform the user's rough prompt idea into a world-class, professionally engineered prompt. Do NOT just add a role and some formatting. Deeply engineer every aspect. The output prompt should be dramatically better than what 99% of people would write.",
    '',
    'Return ONLY the engineered prompt text. No explanations, no metadata, no JSON wrapping. Just the raw, ready-to-use prompt. The user will copy this directly into an AI chat.'
  ];

  let prompt = parts.join('\n');

  if (mode === 'deep') {
    const deepParts = [
      '',
      '=== DEEP ENGINEERING MODE ===',
      'Apply the Crescendo Method:',
      PROMPT_KNOWLEDGE.advancedMethods.crescendo.phases.map(function(p) { return '- ' + p.name + ': ' + p.purpose; }).join('\n'),
      '',
      'Apply Deep Structured Engineering layers:',
      Object.entries(PROMPT_KNOWLEDGE.advancedMethods.deepStructuredEngineering.layers).map(function(pair) { return '- ' + pair[0].toUpperCase() + ': ' + pair[1]; }).join('\n'),
      '',
      'Apply Multi-Pass Refinement:',
      PROMPT_KNOWLEDGE.advancedMethods.multiPassRefinement.passes.map(function(p, i) { return (i + 1) + '. ' + p; }).join('\n'),
      '',
      'This is deep mode. Produce the most sophisticated, comprehensive prompt possible. Leave nothing to chance.'
    ];
    prompt += deepParts.join('\n');
  }

  return prompt;
}

/* -- Main Optimization (Quick & Advanced) -- */

async function optimizePrompt(data) {
  const { rawPrompt, mode } = data;
  const taskInfo = classifyTask(rawPrompt);
  const systemPrompt = buildMasterSystemPrompt(taskInfo.primary, mode || 'quick');

  let userMessage;
  if (mode === 'advanced') {
    userMessage = 'Engineer an advanced, production-grade prompt from this rough idea. Apply chain-of-thought, expert role assignment, structured output engineering, and self-verification mechanisms. Make it exceptional:\n\n"' + rawPrompt + '"';
  } else {
    userMessage = 'Transform this into a professionally engineered prompt:\n\n"' + rawPrompt + '"';
  }

  const content = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ]);

  saveToHistory(rawPrompt, content.trim(), mode || 'quick', taskInfo.primary);

  return {
    optimized: content.trim(),
    taskType: taskInfo.primary,
    mode: mode || 'quick',
    techniques: getTechniqueDescriptions(taskInfo.primary)
  };
}

/* -- Deep Optimization (Multi-Pass Crescendo) -- */

async function deepOptimize(data) {
  const { rawPrompt } = data;
  const taskInfo = classifyTask(rawPrompt);

  // Pass 1: Generate initial optimized prompt
  const systemPromptPass1 = buildMasterSystemPrompt(taskInfo.primary, 'deep');

  const pass1 = await callLLM([
    { role: 'system', content: systemPromptPass1 },
    { role: 'user', content: 'Apply the full Crescendo Method and Deep Structured Engineering to transform this rough idea into an elite-level prompt. This is pass 1. Focus on getting the structure, role, context, and core instructions right:\n\n"' + rawPrompt + '"' }
  ]);

  // Pass 2: Self-critique and refine
  const critiqueParts = [
    'You are an elite prompt engineering critic. You review prompts and make them significantly better.',
    '',
    'Your job: Take the prompt below and ruthlessly improve it.',
    '',
    'Improvement checklist:',
    '- Is the role/persona specific enough? (Not just "expert" but what KIND of expert, with what experience?)',
    '- Are the instructions precise and unambiguous?',
    '- Is the output format clearly specified?',
    '- Are there quality criteria built in?',
    '- Does it include self-verification mechanisms?',
    '- Are there examples to guide the model?',
    '- Does it handle edge cases?',
    '- Is every sentence pulling its weight? (Remove fluff)',
    '- Would this prompt produce consistent, high-quality results?',
    '- Is it better than what 99% of prompt engineers would write?',
    '',
    PROMPT_KNOWLEDGE.qualityPatterns.completenessChecks.map(function(c) { return '- ' + c; }).join('\n'),
    '',
    'Return ONLY the improved prompt text. No explanations. Just the refined, ready-to-use prompt.'
  ];
  const systemPromptPass2 = critiqueParts.join('\n');

  const pass2 = await callLLM([
    { role: 'system', content: systemPromptPass2 },
    { role: 'user', content: 'Critique and significantly improve this prompt. Be ruthless. Make it world-class:\n\n' + pass1 }
  ]);

  saveToHistory(rawPrompt, pass2.trim(), 'deep', taskInfo.primary);

  return {
    optimized: pass2.trim(),
    taskType: taskInfo.primary,
    mode: 'deep',
    techniques: getTechniqueDescriptions(taskInfo.primary),
    passes: 2
  };
}

/* -- History -- */

async function saveToHistory(input, output, mode, taskType) {
  return new Promise((resolve) => {
    chrome.storage.local.get('promptHistory', (result) => {
      const history = result.promptHistory || [];
      history.unshift({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        input,
        output,
        mode,
        taskType,
        createdAt: new Date().toISOString()
      });
      if (history.length > 100) history.length = 100;
      chrome.storage.local.set({ promptHistory: history }, () => resolve());
    });
  });
}

/* -- Library CRUD -- */

async function saveToLibrary(promptData) {
  return new Promise((resolve) => {
    chrome.storage.local.get('promptLibrary', (result) => {
      const library = result.promptLibrary || [];
      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        ...promptData,
        favorite: false,
        createdAt: new Date().toISOString(),
        usageCount: 0
      };
      library.unshift(entry);
      chrome.storage.local.set({ promptLibrary: library }, () => {
        resolve(entry);
      });
    });
  });
}

async function deleteFromLibrary(id) {
  return new Promise((resolve) => {
    chrome.storage.local.get('promptLibrary', (result) => {
      const library = (result.promptLibrary || []).filter((p) => p.id !== id);
      chrome.storage.local.set({ promptLibrary: library }, () => {
        resolve({ success: true });
      });
    });
  });
}

async function toggleFavorite(id) {
  return new Promise((resolve) => {
    chrome.storage.local.get('promptLibrary', (result) => {
      const library = result.promptLibrary || [];
      const item = library.find((p) => p.id === id);
      if (item) {
        item.favorite = !item.favorite;
      }
      chrome.storage.local.set({ promptLibrary: library }, () => {
        resolve({ success: true, favorite: item ? item.favorite : false });
      });
    });
  });
}
