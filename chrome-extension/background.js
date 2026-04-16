/* PromptForge AI - Background Service Worker */

const DEFAULT_SETTINGS = {
  apiProvider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  temperature: 0.7,
  maxTokens: 2048
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

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'optimizePrompt') {
    optimizePrompt(request.data).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message });
    });
    return true;
  }

  if (request.action === 'guidedBuild') {
    guidedBuild(request.data).then(sendResponse).catch((err) => {
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

  return false;
});

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings', (result) => {
      resolve(result.settings || DEFAULT_SETTINGS);
    });
  });
}

async function callLLM(messages) {
  const settings = await getSettings();

  if (!settings.apiKey) {
    throw new Error('API key not configured. Go to extension options to set your API key.');
  }

  let endpoint = settings.endpoint;
  const headers = { 'Content-Type': 'application/json' };

  if (settings.apiProvider === 'openai' || settings.apiProvider === 'openrouter') {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  } else if (settings.apiProvider === 'anthropic') {
    headers['x-api-key'] = settings.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    endpoint = 'https://api.anthropic.com/v1/messages';
  }

  let body;
  if (settings.apiProvider === 'anthropic') {
    const systemMsg = messages.find((m) => m.role === 'system');
    const userMsgs = messages.filter((m) => m.role !== 'system');
    body = JSON.stringify({
      model: settings.model,
      max_tokens: settings.maxTokens,
      system: systemMsg ? systemMsg.content : '',
      messages: userMsgs
    });
  } else {
    body = JSON.stringify({
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      messages
    });
  }

  const response = await fetch(endpoint, { method: 'POST', headers, body });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const data = await response.json();

  if (settings.apiProvider === 'anthropic') {
    return data.content?.[0]?.text || '';
  }
  return data.choices?.[0]?.message?.content || '';
}

async function optimizePrompt(data) {
  const { rawPrompt, mode } = data;

  const systemPrompt = `You are PromptForge AI, an expert prompt engineer that combines three proven prompting methodologies:

1. MANUS Framework (Structured Prompting):
   - Role + Task + Context + Format structure
   - Clear persona definition for AI
   - Explicit output format specification
   - Intent and constraints declaration

2. JUMA Method (Guided Building):
   - Convert natural descriptions into structured prompts
   - Add missing context and specificity
   - Ensure consistency and reproducibility
   - Professional formatting for reliable outputs

3. CRAFT System (Comprehensive Optimization):
   - Context: Background and situation
   - Role: AI persona and expertise level
   - Action: Specific task to perform
   - Format: Desired output structure
   - Tone: Communication style

Your job is to take a raw, rough prompt idea and transform it into a highly optimized, professional-grade prompt using all three methodologies combined.

Return your response as JSON with this exact structure:
{
  "optimized": "The fully optimized prompt text ready to use",
  "breakdown": {
    "context": "The context component",
    "role": "The role/persona component",
    "action": "The action/task component",
    "format": "The format specification",
    "tone": "The tone specification"
  },
  "improvements": ["List of specific improvements made"],
  "score": {
    "before": <1-10 score of original>,
    "after": <1-10 score of optimized>
  }
}`;

  let userPrompt;
  if (mode === 'quick') {
    userPrompt = `Optimize this prompt quickly, focusing on clarity and structure:\n\n"${rawPrompt}"`;
  } else if (mode === 'deep') {
    userPrompt = `Perform a deep optimization of this prompt. Apply all three frameworks thoroughly. Add rich context, precise role definition, detailed format specs, and appropriate tone:\n\n"${rawPrompt}"`;
  } else {
    userPrompt = `Optimize this prompt:\n\n"${rawPrompt}"`;
  }

  const content = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    /* fallback below */
  }
  return { optimized: content, breakdown: {}, improvements: [], score: { before: 0, after: 0 } };
}

async function guidedBuild(data) {
  const { step, answers } = data;

  if (step === 'start') {
    return {
      questions: [
        { id: 'goal', label: 'What do you want the AI to do?', placeholder: 'e.g., Write a blog post about sustainable fashion', type: 'textarea' },
        { id: 'audience', label: 'Who is the target audience?', placeholder: 'e.g., Marketing professionals, beginners, executives', type: 'text' },
        { id: 'domain', label: 'What domain or category?', placeholder: 'e.g., Marketing, Coding, Research, Creative Writing', type: 'select', options: ['Marketing', 'Software Development', 'Research & Analysis', 'Creative Writing', 'Business Strategy', 'Education', 'Data Science', 'Design', 'Other'] }
      ],
      step: 'basic'
    };
  }

  if (step === 'basic') {
    return {
      questions: [
        { id: 'format', label: 'Desired output format?', placeholder: 'e.g., Bullet points, essay, code, table', type: 'select', options: ['Paragraph', 'Bullet Points', 'Numbered List', 'Table', 'Code', 'JSON', 'Markdown', 'Email', 'Report', 'Other'] },
        { id: 'tone', label: 'What tone or style?', placeholder: 'e.g., Professional, casual, technical, friendly', type: 'select', options: ['Professional', 'Casual', 'Technical', 'Friendly', 'Formal', 'Persuasive', 'Academic', 'Creative', 'Concise', 'Other'] },
        { id: 'length', label: 'Desired length?', placeholder: 'e.g., 500 words, 3 paragraphs, brief', type: 'text' },
        { id: 'constraints', label: 'Any special constraints or requirements?', placeholder: 'e.g., Must include examples, avoid jargon, use specific framework', type: 'textarea' }
      ],
      step: 'details'
    };
  }

  if (step === 'details') {
    const systemPrompt = `You are PromptForge AI. Based on the user's answers, generate a perfectly structured prompt using the combined CRAFT + Manus + Juma methodology.

Return JSON:
{
  "prompt": "The complete, ready-to-use prompt",
  "breakdown": {
    "context": "...",
    "role": "...",
    "action": "...",
    "format": "...",
    "tone": "..."
  },
  "tips": ["Helpful tips for using this prompt effectively"]
}`;

    const userMsg = `Build an optimized prompt from these answers:\n${JSON.stringify(answers, null, 2)}`;

    const content = await callLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMsg }
    ]);

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { ...JSON.parse(jsonMatch[0]), step: 'complete' };
      }
    } catch {
      /* fallback */
    }
    return { prompt: content, breakdown: {}, tips: [], step: 'complete' };
  }

  return { error: 'Unknown step' };
}

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
