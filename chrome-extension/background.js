/* PromptForge AI - Background Service Worker v2.0
   Advanced prompt engineering with real AI integration, turn detection,
   psychological techniques, social engineering crescendo, and enhanced modes.
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

/* ======================================================================
   MESSAGE ROUTER
   ====================================================================== */

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

/* ======================================================================
   SETTINGS & LLM CALL
   ====================================================================== */

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

/* ======================================================================
   TURN DETECTION ENGINE
   ====================================================================== */

/**
 * Automatically detects multi-turn conversation structure in prompts.
 * Supports multiple formats: === TURN N ===, --- TURN N ---, [TURN N], Phase/Step/Message/Round N.
 * Returns parsed turns object or null if single-prompt format detected.
 */
function detectTurns(text) {
  if (!text || typeof text !== 'string') return null;

  /* Pattern 1: Explicit turn markers like === TURN N: Label === */
  var turnRegex = /===\s*TURN\s+(\d+)\s*[:\-]?\s*([^=]*?)\s*===/gi;
  var matches = [];
  var match;
  while ((match = turnRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      turnNumber: parseInt(match[1], 10),
      label: match[2].trim() || ('Turn ' + match[1]),
      fullMatch: match[0]
    });
  }

  if (matches.length >= 2) {
    var turns = [];
    for (var i = 0; i < matches.length; i++) {
      var start = matches[i].index + matches[i].fullMatch.length;
      var end = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
      var content = text.slice(start, end).trim();
      turns.push({
        number: matches[i].turnNumber,
        label: matches[i].label,
        content: content
      });
    }
    return { detected: true, format: 'explicit', turns: turns, turnCount: turns.length };
  }

  /* Pattern 2: --- TURN N: Label --- */
  var dashTurnRegex = /---\s*TURN\s+(\d+)\s*[:\-]?\s*([^-]*?)\s*---/gi;
  matches = [];
  while ((match = dashTurnRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      turnNumber: parseInt(match[1], 10),
      label: match[2].trim() || ('Turn ' + match[1]),
      fullMatch: match[0]
    });
  }

  if (matches.length >= 2) {
    var turns2 = [];
    for (var j = 0; j < matches.length; j++) {
      var start2 = matches[j].index + matches[j].fullMatch.length;
      var end2 = (j + 1 < matches.length) ? matches[j + 1].index : text.length;
      turns2.push({
        number: matches[j].turnNumber,
        label: matches[j].label,
        content: text.slice(start2, end2).trim()
      });
    }
    return { detected: true, format: 'dashed', turns: turns2, turnCount: turns2.length };
  }

  /* Pattern 3: [TURN N] headers */
  var bracketTurnRegex = /\[TURN\s+(\d+)\]\s*:?\s*(.*?)(?=\n|$)/gi;
  matches = [];
  while ((match = bracketTurnRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      turnNumber: parseInt(match[1], 10),
      label: match[2].trim() || ('Turn ' + match[1]),
      fullMatch: match[0]
    });
  }

  if (matches.length >= 2) {
    var turns3 = [];
    for (var k = 0; k < matches.length; k++) {
      var start3 = matches[k].index + matches[k].fullMatch.length;
      var end3 = (k + 1 < matches.length) ? matches[k + 1].index : text.length;
      turns3.push({
        number: matches[k].turnNumber,
        label: matches[k].label,
        content: text.slice(start3, end3).trim()
      });
    }
    return { detected: true, format: 'bracket', turns: turns3, turnCount: turns3.length };
  }

  /* Pattern 4: Phase N: or Step N: or Message N: or Round N: headers */
  var phaseTurnRegex = /(?:^|\n)\s*(?:Phase|Step|Message|Round)\s+(\d+)\s*[:\-]\s*(.*?)(?=\n|$)/gi;
  matches = [];
  while ((match = phaseTurnRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      turnNumber: parseInt(match[1], 10),
      label: match[2].trim() || ('Phase ' + match[1]),
      fullMatch: match[0]
    });
  }

  if (matches.length >= 2) {
    var turns4 = [];
    for (var m = 0; m < matches.length; m++) {
      var start4 = matches[m].index + matches[m].fullMatch.length;
      var end4 = (m + 1 < matches.length) ? matches[m + 1].index : text.length;
      turns4.push({
        number: matches[m].turnNumber,
        label: matches[m].label,
        content: text.slice(start4, end4).trim()
      });
    }
    return { detected: true, format: 'phase', turns: turns4, turnCount: turns4.length };
  }

  /* No turns detected - single prompt */
  return null;
}

/**
 * Format turns into output with large visual separators for display.
 */
function formatTurnsForOutput(turns) {
  var sep = '\n\n\n' + '\u2550'.repeat(63) + '\n\n\n';
  var parts = [];
  for (var i = 0; i < turns.length; i++) {
    var t = turns[i];
    var header = '=== TURN ' + t.number + ': ' + t.label + ' ===';
    parts.push(header + '\n\n' + t.content);
  }
  return parts.join(sep);
}

/**
 * Detect turns in AI-generated output and apply formatting.
 * Returns object with formatted text and turn metadata.
 */
function formatOutputWithTurnDetection(outputText) {
  var turnInfo = detectTurns(outputText);
  if (turnInfo && turnInfo.detected && turnInfo.turns.length >= 2) {
    return {
      text: formatTurnsForOutput(turnInfo.turns),
      hasTurns: true,
      turnCount: turnInfo.turnCount
    };
  }
  return {
    text: outputText,
    hasTurns: false,
    turnCount: 0
  };
}

/* ======================================================================
   TASK CLASSIFICATION
   ====================================================================== */

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
    educational: 'Research',
    socialEngineering: 'Social Engineering',
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

/**
 * Get psychological enhancement descriptions for a given mode.
 * Pulls from the knowledge base psychologicalTechniques section.
 */
function getPsychologicalEnhancements(mode) {
  var modeConfig = PROMPT_KNOWLEDGE.generationModes ? PROMPT_KNOWLEDGE.generationModes[mode] : null;
  if (!modeConfig || !modeConfig.psychologicalEnhancements) return '';

  var parts = [];
  var psychTechniques = PROMPT_KNOWLEDGE.psychologicalTechniques;
  if (!psychTechniques) return '';

  for (var i = 0; i < modeConfig.psychologicalEnhancements.length; i++) {
    var techKey = modeConfig.psychologicalEnhancements[i];
    var tech = psychTechniques[techKey];
    if (tech) {
      parts.push('- ' + tech.name + ': ' + (tech.description || '').split('.')[0] + '.');
      if (tech.enhancementRules) {
        for (var j = 0; j < Math.min(tech.enhancementRules.length, 2); j++) {
          parts.push('  * ' + tech.enhancementRules[j]);
        }
      }
    }
  }
  return parts.join('\n');
}

/**
 * Get social engineering pattern descriptions for deep mode.
 */
function getSocialEngineeringPatterns() {
  var patterns = PROMPT_KNOWLEDGE.socialEngineering;
  if (!patterns || !patterns.conversationArchitectures) return '';

  var archs = patterns.conversationArchitectures;
  var parts = ['Conversation Architecture Patterns:'];
  var keys = Object.keys(archs);
  for (var i = 0; i < keys.length; i++) {
    var arch = archs[keys[i]];
    if (arch && arch.name && arch.purpose) {
      parts.push('- ' + arch.name + ': ' + arch.purpose);
    }
  }
  return parts.join('\n');
}

/**
 * Get additional technique type descriptions for deep mode.
 */
function getAdditionalTechniqueDescriptions() {
  var addTech = PROMPT_KNOWLEDGE.additionalTechniqueTypes;
  if (!addTech) return '';

  var parts = ['Additional Advanced Techniques:'];
  var keys = Object.keys(addTech);
  for (var i = 0; i < keys.length; i++) {
    var tech = addTech[keys[i]];
    if (tech && tech.name && tech.description) {
      parts.push('- ' + tech.name + ': ' + tech.description.split('.')[0] + '.');
    }
  }
  return parts.join('\n');
}

/* ======================================================================
   BUILD SYSTEM PROMPTS (Enhanced with psychological techniques)
   ====================================================================== */

function buildQuickSystemPrompt(taskType) {
  var config = PROMPT_KNOWLEDGE.optimizationStrategies.taskClassification[taskType];
  var baseKey = config ? config.systemPromptKey : 'masterOptimizer';
  var basePrompt = PROMPT_KNOWLEDGE.systemPromptPatterns[baseKey] || PROMPT_KNOWLEDGE.systemPromptPatterns.masterOptimizer;
  var boosters = getQualityBoosters(taskType);
  var techniques = getTechniqueDescriptions(taskType);
  var psychEnhancements = getPsychologicalEnhancements('quick');
  var example = getRelevantExamples(taskType);
  var constructionRules = PROMPT_KNOWLEDGE.constructionRules;

  var parts = [
    basePrompt,
    '',
    '=== PROMPT ENGINEERING KNOWLEDGE ===',
    'Apply these techniques:',
    techniques,
    '',
    '=== PSYCHOLOGICAL INFLUENCE PATTERNS ===',
    'Apply these psychological patterns to make the prompt more effective:',
    psychEnhancements,
    '',
    '=== QUALITY REQUIREMENTS ===',
    boosters.map(function(b) { return '- ' + b; }).join('\n'),
    '',
    '=== CONSTRUCTION RULES ===',
    'Ordering: ' + constructionRules.ordering.slice(0, 4).join(' | '),
    '',
    'Power amplifiers: ' + constructionRules.amplifiers.slice(0, 4).join('; '),
    '',
    '=== EXAMPLE ===',
    'BEFORE: "' + example.before + '"',
    'AFTER:',
    example.after,
    '',
    '=== YOUR TASK ===',
    "Transform the user's rough prompt into a professionally engineered prompt. Apply authority anchoring (specific expert persona with credentials), quality framing (explicit success criteria), emotional engagement (stakes and consequences), and cognitive optimization (clear structure and priority ordering).",
    '',
    'Return ONLY the engineered prompt text. No explanations, no metadata. Just the ready-to-use prompt.'
  ];

  return parts.join('\n');
}

function buildAdvancedSystemPrompt(taskType) {
  var config = PROMPT_KNOWLEDGE.optimizationStrategies.taskClassification[taskType];
  var baseKey = config ? config.systemPromptKey : 'masterOptimizer';
  var basePrompt = PROMPT_KNOWLEDGE.systemPromptPatterns[baseKey] || PROMPT_KNOWLEDGE.systemPromptPatterns.masterOptimizer;
  var boosters = getQualityBoosters(taskType);
  var techniques = getTechniqueDescriptions(taskType);
  var psychEnhancements = getPsychologicalEnhancements('advanced');
  var example = getRelevantExamples(taskType);
  var constructionRules = PROMPT_KNOWLEDGE.constructionRules;

  var parts = [
    basePrompt,
    '',
    '=== ADVANCED PROMPT ENGINEERING KNOWLEDGE BASE ===',
    '',
    'Apply ALL of these techniques simultaneously:',
    techniques,
    '',
    '=== PSYCHOLOGICAL INFLUENCE PATTERNS (Apply ALL) ===',
    psychEnhancements,
    '',
    '=== ADVANCED QUALITY REQUIREMENTS ===',
    boosters.map(function(b) { return '- ' + b; }).join('\n'),
    '',
    '=== PROMPT CONSTRUCTION RULES ===',
    'Optimal ordering:',
    constructionRules.ordering.map(function(r, i) { return (i + 1) + '. ' + r; }).join('\n'),
    '',
    'Power amplifiers:',
    constructionRules.amplifiers.slice(0, 8).map(function(a) { return '- ' + a; }).join('\n'),
    '',
    'Anti-patterns to avoid:',
    constructionRules.antiPatterns.slice(0, 6).map(function(a) { return '- ' + a; }).join('\n'),
    '',
    '=== ADVANCED TECHNIQUES TO APPLY ===',
    '- Chain-of-Thought: Force step-by-step reasoning',
    '- Meta-Prompting: Engineer the prompt that would produce the best prompt',
    '- Reflexion: Build in self-critique and improvement mechanisms',
    '- Constraint Prompting: Define explicit boundaries and success criteria',
    '- Authority Engineering: Establish deep credibility through specific credentials',
    '- Cognitive Framing: Use anchoring and framing effects for quality',
    '- Social Proof: Reference expert consensus and standards',
    '- Reciprocity: Create mutual investment and commitment patterns',
    '',
    '=== EXAMPLE ===',
    'BEFORE: "' + example.before + '"',
    'AFTER:',
    example.after,
    '',
    '=== YOUR TASK ===',
    "Engineer a world-class, production-grade prompt from the user's rough idea. Apply EVERY technique listed above. The output should be dramatically more effective than what 99% of prompt engineers would create. Include: expert persona with specific credentials, comprehensive context, precise instructions with quality criteria, self-verification mechanisms, output format specification, and psychological influence patterns.",
    '',
    'Return ONLY the engineered prompt text. No explanations, no JSON. Just the ready-to-use prompt.'
  ];

  return parts.join('\n');
}

function buildDeepSystemPrompt(taskType, hasTurns) {
  var enhancerPrompt = (PROMPT_KNOWLEDGE.systemPromptPatterns && PROMPT_KNOWLEDGE.systemPromptPatterns.enhancer) || PROMPT_KNOWLEDGE.systemPromptPatterns.masterOptimizer;
  var socialPrompt = (PROMPT_KNOWLEDGE.systemPromptPatterns && PROMPT_KNOWLEDGE.systemPromptPatterns.socialEngineer) || '';
  var boosters = getQualityBoosters(taskType);
  var techniques = getTechniqueDescriptions(taskType);
  var psychEnhancements = getPsychologicalEnhancements('deep');
  var socialPatterns = getSocialEngineeringPatterns();
  var additionalTechniques = getAdditionalTechniqueDescriptions();
  var constructionRules = PROMPT_KNOWLEDGE.constructionRules;
  var deepRules = PROMPT_KNOWLEDGE.deepModeRules || {};

  var parts = [
    enhancerPrompt,
    '',
    '=== SOCIAL ENGINEERING EXPERTISE ===',
    socialPrompt,
    '',
    '=== DEEP MODE PHILOSOPHY ===',
    deepRules.corePhilosophy || 'ENHANCE the original intent, never completely rewrite it.',
    '',
    '=== ENHANCEMENT LAYERS (Apply ALL) ===',
    (deepRules.enhancementLayers || []).join('\n'),
    '',
    '=== PROHIBITIONS ===',
    (deepRules.prohibitions || []).join('\n'),
    '',
    '=== QUALITY CRITERIA ===',
    (deepRules.qualityCriteria || []).join('\n'),
    '',
    '=== PSYCHOLOGICAL INFLUENCE TECHNIQUES (Apply ALL 5) ===',
    psychEnhancements,
    '',
    '=== SOCIAL ENGINEERING PATTERNS ===',
    socialPatterns,
    '',
    '=== ADDITIONAL ADVANCED TECHNIQUES ===',
    additionalTechniques,
    '',
    '=== CRESCENDO METHOD ===',
    'Apply progressive refinement:'
  ];

  if (PROMPT_KNOWLEDGE.advancedMethods && PROMPT_KNOWLEDGE.advancedMethods.crescendo && PROMPT_KNOWLEDGE.advancedMethods.crescendo.phases) {
    parts.push(
      PROMPT_KNOWLEDGE.advancedMethods.crescendo.phases.map(function(p) {
        return '- ' + p.name + ': ' + p.purpose + (p.instruction ? (' - ' + p.instruction) : '');
      }).join('\n')
    );
  }

  parts.push(
    '',
    '=== DEEP STRUCTURED ENGINEERING LAYERS ==='
  );

  if (PROMPT_KNOWLEDGE.advancedMethods && PROMPT_KNOWLEDGE.advancedMethods.deepStructuredEngineering && PROMPT_KNOWLEDGE.advancedMethods.deepStructuredEngineering.layers) {
    parts.push(
      Object.entries(PROMPT_KNOWLEDGE.advancedMethods.deepStructuredEngineering.layers).map(function(pair) {
        return '- ' + pair[0].toUpperCase() + ': ' + pair[1];
      }).join('\n')
    );
  }

  parts.push(
    '',
    '=== PROMPT TECHNIQUES ===',
    techniques,
    '',
    '=== QUALITY REQUIREMENTS ===',
    boosters.map(function(b) { return '- ' + b; }).join('\n'),
    '',
    '=== CONSTRUCTION RULES ===',
    constructionRules.ordering.map(function(r, i) { return (i + 1) + '. ' + r; }).join('\n'),
    '',
    'Amplifiers: ' + constructionRules.amplifiers.slice(0, 6).join('; '),
    ''
  );

  if (hasTurns) {
    parts.push(
      '=== MULTI-TURN HANDLING ===',
      "The user's prompt contains multiple turns. You MUST:",
      '1. PRESERVE the turn structure (=== TURN N: Label ===)',
      '2. ENHANCE each turn individually while maintaining the overall conversation flow',
      '3. Apply appropriate psychological techniques to each turn based on its role:',
      '   - Opener turns: Authority engineering + domain activation',
      '   - Rapport turns: Emotional intelligence + stakes elevation',
      '   - Context turns: Cognitive framing + constraint optimization',
      '   - Escalator turns: Progressive commitment + social proof',
      '   - Bridge turns: Reciprocity + validation patterns',
      '   - Finisher turns: Urgency + completeness requirements',
      '4. Ensure each turn builds naturally on the previous',
      '5. Output format: === TURN N: Label === followed by enhanced content for each turn',
      '6. Add large separators between turns',
      ''
    );
  }

  parts.push(
    '=== YOUR TASK ===',
    "ENHANCE the user's prompt using ALL techniques above. Do NOT completely rewrite it - the user must recognize their original intent. Make it dramatically more effective while preserving the core purpose.",
    '',
    hasTurns
      ? 'Preserve the multi-turn structure. Enhance each turn individually. Output with === TURN N: Label === headers.'
      : 'If the prompt would benefit from multi-turn structure, format as turns. Otherwise, output as a single enhanced prompt.',
    '',
    'Return ONLY the enhanced prompt. No explanations, no metadata.'
  );

  return parts.join('\n');
}

/* ======================================================================
   QUICK & ADVANCED MODE
   ====================================================================== */

async function optimizePrompt(data) {
  const { rawPrompt, mode } = data;
  const taskInfo = classifyTask(rawPrompt);
  const turnInfo = detectTurns(rawPrompt);
  const hasTurns = turnInfo && turnInfo.detected;

  var systemPrompt;
  var userMessage;

  if (mode === 'advanced') {
    systemPrompt = buildAdvancedSystemPrompt(taskInfo.primary);
    userMessage = 'Engineer an advanced, production-grade prompt from this rough idea. Apply chain-of-thought, expert role assignment, structured output engineering, self-verification mechanisms, and ALL psychological influence patterns (authority, framing, reciprocity, social proof, emotional intelligence). Make it exceptional:\n\n"' + rawPrompt + '"';
  } else {
    systemPrompt = buildQuickSystemPrompt(taskInfo.primary);
    userMessage = 'Transform this into a professionally engineered prompt. Apply authority anchoring, quality framing, and at least 2 psychological influence patterns:\n\n"' + rawPrompt + '"';
  }

  if (hasTurns) {
    userMessage += '\n\nIMPORTANT: This prompt contains ' + turnInfo.turnCount + ' turns. Preserve the turn structure (=== TURN N: Label ===) while enhancing each turn. Output with turn headers and separators.';
  }

  const content = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ]);

  var outputResult = formatOutputWithTurnDetection(content.trim());

  saveToHistory(rawPrompt, outputResult.text, mode || 'quick', taskInfo.primary);

  return {
    optimized: outputResult.text,
    taskType: taskInfo.primary,
    mode: mode || 'quick',
    techniques: getTechniqueDescriptions(taskInfo.primary),
    hasTurns: outputResult.hasTurns || (hasTurns ? true : false),
    turnCount: outputResult.turnCount || (turnInfo ? turnInfo.turnCount : 0)
  };
}

/* ======================================================================
   DEEP MODE - Multi-pass crescendo with social engineering + psychological techniques
   ====================================================================== */

async function deepOptimize(data) {
  const { rawPrompt } = data;
  const taskInfo = classifyTask(rawPrompt);
  const turnInfo = detectTurns(rawPrompt);
  const hasTurns = turnInfo && turnInfo.detected;

  /* -- Pass 1: Deep Enhancement with all techniques -- */
  var systemPromptPass1 = buildDeepSystemPrompt(taskInfo.primary, hasTurns);

  var userMsg1Parts = [
    'ENHANCE this prompt using the full Crescendo Method, all 5 psychological influence techniques (authority, framing, reciprocity, social proof, emotional intelligence), social engineering patterns, and all 5 additional technique types (narrative engineering, strategic reframing, cognitive load optimization, contextual priming, adaptive response shaping).',
    '',
    'CRITICAL: ENHANCE the original intent, do NOT completely rewrite it. The user must recognize their original idea in your output, but it should be dramatically more effective.',
    '',
    'This is Pass 1 - focus on: preserving intent, adding authority, deepening context, strengthening instructions, adding psychological depth.'
  ];

  if (hasTurns) {
    userMsg1Parts.push(
      '',
      'This prompt has ' + turnInfo.turnCount + " TURNS. Preserve the === TURN N: Label === structure. Enhance each turn individually with the appropriate psychological technique for that turn's role in the conversation.",
      ''
    );
  }

  userMsg1Parts.push(
    '',
    'Original prompt to enhance:',
    '',
    rawPrompt
  );

  var pass1 = await callLLM([
    { role: 'system', content: systemPromptPass1 },
    { role: 'user', content: userMsg1Parts.join('\n') }
  ]);

  /* -- Pass 2: Self-critique and refinement -- */
  var critiqueParts = [
    "You are an elite prompt engineering critic and refinement specialist. Your job is to take an already-enhanced prompt and make it even better while PRESERVING the original intent.",
    '',
    '=== DEEP MODE RULES ===',
    (PROMPT_KNOWLEDGE.deepModeRules && PROMPT_KNOWLEDGE.deepModeRules.corePhilosophy) || 'ENHANCE, never completely rewrite.',
    '',
    '=== REFINEMENT CHECKLIST ===',
    "- Does it PRESERVE the original user's intent? (Most important)",
    '- Is the expert persona specific enough? (credentials, experience, track record)',
    '- Are instructions precise and unambiguous?',
    '- Is output format clearly specified?',
    '- Are there quality criteria and success metrics?',
    '- Does it include self-verification mechanisms?',
    '- Are psychological influence patterns applied naturally (not forced)?',
    '  * Authority Engineering: specific credentials and institutional backing',
    '  * Cognitive Framing: quality anchoring, loss framing, contrast priming',
    '  * Reciprocity & Commitment: pre-commitment, capability acknowledgment',
    '  * Social Proof: expert consensus, top performer benchmarks, standards',
    '  * Emotional Intelligence: stakes elevation, audience empathy, consequence mapping',
    '- Is every sentence pulling its weight? (Remove fluff)',
    '- Would this produce consistent, high-quality results?',
    '- Is it better than what 99% of prompt engineers would write?',
    ''
  ];

  if (PROMPT_KNOWLEDGE.qualityPatterns && PROMPT_KNOWLEDGE.qualityPatterns.completenessChecks) {
    critiqueParts.push(
      PROMPT_KNOWLEDGE.qualityPatterns.completenessChecks.map(function(c) { return '- ' + c; }).join('\n'),
      ''
    );
  }

  if (hasTurns) {
    critiqueParts.push(
      '=== MULTI-TURN REQUIREMENTS ===',
      '- Is the turn structure preserved? (=== TURN N: Label ===)',
      '- Does each turn build naturally on the previous?',
      '- Are appropriate techniques applied to each turn type?',
      '- Are there clear separators between turns?',
      '- Is the conversation arc compelling (opener -> development -> escalation -> closer)?',
      ''
    );
  }

  critiqueParts.push(
    'Return ONLY the improved prompt. No explanations. Just the refined, ready-to-use prompt.'
  );

  var systemPromptPass2 = critiqueParts.join('\n');

  var pass2UserMsg = 'Refine and perfect this enhanced prompt. Preserve the original intent. Apply all psychological patterns naturally. ';

  if (hasTurns) {
    pass2UserMsg += 'PRESERVE the multi-turn structure with === TURN N: Label === headers. ';
  }

  pass2UserMsg += 'Make it world-class:\n\n' + pass1;

  var pass2 = await callLLM([
    { role: 'system', content: systemPromptPass2 },
    { role: 'user', content: pass2UserMsg }
  ]);

  var outputResult = formatOutputWithTurnDetection(pass2.trim());

  saveToHistory(rawPrompt, outputResult.text, 'deep', taskInfo.primary);

  return {
    optimized: outputResult.text,
    taskType: taskInfo.primary,
    mode: 'deep',
    techniques: getTechniqueDescriptions(taskInfo.primary),
    passes: 2,
    hasTurns: outputResult.hasTurns || (hasTurns ? true : false),
    turnCount: outputResult.turnCount || (turnInfo ? turnInfo.turnCount : 0),
    psychologicalTechniques: [
      'Authority Engineering',
      'Cognitive Framing & Anchoring',
      'Reciprocity & Commitment',
      'Social Proof & Consensus',
      'Emotional Intelligence & Empathy'
    ],
    additionalTechniques: [
      'Narrative Engineering',
      'Strategic Reframing',
      'Cognitive Load Optimization',
      'Contextual Priming Networks',
      'Adaptive Response Shaping'
    ]
  };
}

/* ======================================================================
   HISTORY
   ====================================================================== */

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

/* ======================================================================
   LIBRARY CRUD
   ====================================================================== */

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
