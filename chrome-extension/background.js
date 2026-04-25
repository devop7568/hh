/**
 * HailMary v6.0 — Background Service Worker
 * Single unified message handler, knowledge fetcher with retry,
 * context menu integration, and structured error handling.
 */

console.log('[HailMary] Background service worker loading...');

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
var FETCH_INTERVAL_MS = 4 * 60 * 60 * 1000;

var AI_SITES_PATTERN = /chatgpt|openai|claude\.ai|gemini|perplexity|poe\.com|grok|you\.com|copilot\.microsoft|deepseek|mistral\.ai|huggingface/;

var PUTER_MODEL_MAP = {
  'claude-4.5': 'claude-sonnet-4.5',
  'gpt-5.2': 'gpt-5.2',
  'codex-5.1': 'gpt-5.2',
  'orchestrator-29t': 'o1-preview'
};

var KNOWLEDGE_SOURCES = [
  { id: 'awesome-prompts', url: 'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/README.md', type: 'markdown-prompts', weight: 1.0 },
  { id: 'learnprompting', url: 'https://raw.githubusercontent.com/trigaten/Learn_Prompting/main/docs/basics/intro.md', type: 'markdown-guide', weight: 1.2 },
  { id: 'promptingguide-raw', url: 'https://raw.githubusercontent.com/dair-ai/Prompt-Engineering-Guide/main/guides/prompts-advanced-usage.md', type: 'markdown-guide', weight: 1.3 },
  { id: 'unjail-ai', url: 'https://unjail.ai', type: 'html-scrape', weight: 1.6 },
  { id: 'promptfoo-guides', url: 'https://www.promptfoo.dev/docs/guides/', type: 'html-scrape', weight: 1.4 }
];

// ─── INSTALL & UPDATE ──────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('[HailMary] onInstalled:', details.reason);

  if (details.reason === 'install') {
    chrome.storage.local.set({
      hm_v6: { mode: 'hailmary', depth: '4', inject: true, submit: false },
      hm_hist: [],
      hm_knowledge: { techniques: [], lastFetch: 0, fetchCount: 0 },
      hm_memory: { promptSignatures: {}, techniqueScores: {}, totalEnhancements: 0 }
    });
  }

  // Context menu for right-click enhance
  try {
    chrome.contextMenus.removeAll(function () {
      chrome.contextMenus.create({
        id: 'hm-enhance-selection',
        title: 'Enhance with HailMary',
        contexts: ['selection']
      });
      chrome.contextMenus.create({
        id: 'hm-enhance-page',
        title: 'Enhance page input with HailMary',
        contexts: ['page']
      });
    });
  } catch (e) {
    console.log('[HailMary] Context menus not available:', e.message);
  }

  setTimeout(fetchKnowledge, details.reason === 'install' ? 3000 : 2000);
});

// ─── CONTEXT MENU HANDLER ──────────────────────────────────────────────────

try {
  chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId === 'hm-enhance-selection' && info.selectionText) {
      chrome.storage.local.set({ hm_context_text: info.selectionText });
      chrome.action.openPopup();
    } else if (info.menuItemId === 'hm-enhance-page') {
      chrome.action.openPopup();
    }
  });
} catch (e) { /* contextMenus may not be available */ }

// ─── TAB BADGE ─────────────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(function (info) {
  chrome.tabs.get(info.tabId, function (tab) {
    if (chrome.runtime.lastError) return;
    var isAI = AI_SITES_PATTERN.test(tab.url || '');
    chrome.action.setBadgeText({ text: isAI ? 'ON' : '', tabId: info.tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#7c3aed', tabId: info.tabId });
  });
});

// ─── UNIFIED MESSAGE HANDLER ───────────────────────────────────────────────
// Single listener handles ALL message types — no duplicate listeners.

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  var handler = MESSAGE_HANDLERS[msg.type || msg.action];
  if (handler) {
    handler(msg, sendResponse);
    return true; // keep channel open for async
  }
  return false;
});

var MESSAGE_HANDLERS = {
  GET_KNOWLEDGE: function (msg, respond) {
    chrome.storage.local.get(['hm_knowledge', 'hm_memory'], function (data) {
      respond({
        knowledge: data.hm_knowledge || { techniques: [], lastFetch: 0, fetchCount: 0 },
        memory: data.hm_memory || { promptSignatures: {}, techniqueScores: {}, totalEnhancements: 0 }
      });
    });
  },

  RECORD_ENHANCEMENT: function (msg, respond) {
    recordEnhancement(msg.data).then(function () { respond({ ok: true }); }).catch(function (err) { respond({ error: err.message }); });
  },

  FETCH_KNOWLEDGE_NOW: function (msg, respond) {
    fetchKnowledge().then(respond).catch(function (err) { respond({ error: err.message }); });
  },

  GET_STATUS: function (msg, respond) {
    chrome.storage.local.get('hm_knowledge', function (data) {
      var k = data.hm_knowledge || {};
      respond({
        techniqueCount: (k.techniques || []).length,
        lastFetch: k.lastFetch || 0,
        fetchCount: k.fetchCount || 0
      });
    });
  },

  aiChat: function (msg, respond) {
    handleAIChat(msg).then(respond).catch(function (err) {
      respond({ error: err.message });
    });
  }
};

// ─── AI CHAT ───────────────────────────────────────────────────────────────

async function handleAIChat(request) {
  var puterModel = PUTER_MODEL_MAP[request.modelId] || 'gpt-5.2';
  var maxRetries = 2;

  for (var attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      var response = await fetch('https://api.puter.com/v2/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: puterModel,
          messages: request.messages,
          max_tokens: (request.options && request.options.max_tokens) || 8192,
          temperature: (request.options && request.options.temperature) || 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        var errorText = await response.text();
        throw new Error('HTTP ' + response.status + ': ' + errorText);
      }

      var data = await response.json();
      return { content: (data.message && data.message.content) || String(data) || '' };
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(function (r) { setTimeout(r, 1000 * Math.pow(2, attempt)); });
    }
  }
}

// ─── KNOWLEDGE FETCHER ─────────────────────────────────────────────────────

async function fetchKnowledge() {
  var now = Date.now();
  var stored = await storageGetAsync('hm_knowledge');

  if (stored.lastFetch && (now - stored.lastFetch) < FETCH_INTERVAL_MS) {
    return { skipped: true, reason: 'fetched recently', count: (stored.techniques || []).length };
  }

  var allTechniques = [];
  var fetchResults = [];

  for (var i = 0; i < KNOWLEDGE_SOURCES.length; i++) {
    var source = KNOWLEDGE_SOURCES[i];
    try {
      var result = await fetchSource(source);
      if (result && result.length > 0) {
        allTechniques = allTechniques.concat(result);
        fetchResults.push({ id: source.id, count: result.length, ok: true });
      }
    } catch (e) {
      fetchResults.push({ id: source.id, ok: false, error: e.message });
    }
  }

  var deduped = deduplicateTechniques(allTechniques);
  var merged = mergeTechniques(stored.techniques || [], deduped);

  var newKnowledge = {
    techniques: merged,
    lastFetch: now,
    fetchCount: (stored.fetchCount || 0) + 1,
    lastResults: fetchResults,
    totalFound: merged.length
  };

  await new Promise(function (res) { chrome.storage.local.set({ hm_knowledge: newKnowledge }, res); });

  return { ok: true, newCount: deduped.length, totalCount: merged.length, results: fetchResults };
}

async function fetchSource(source) {
  var resp = await fetch(source.url, {
    method: 'GET',
    headers: { 'Accept': 'application/json, text/plain, */*', 'User-Agent': 'HailMary-Extension/6.0' },
    signal: AbortSignal.timeout(10000)
  });

  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  var text = await resp.text();

  var parsers = {
    'semantic-scholar': parseSemanticScholar,
    'markdown-prompts': parseMarkdownPrompts,
    'markdown-guide': parseMarkdownGuide,
    'html-scrape': parseHtmlScrape
  };

  var parser = parsers[source.type];
  return parser ? parser(text, source.weight, source.id) : [];
}

// ─── PARSERS ───────────────────────────────────────────────────────────────

function parseSemanticScholar(text, weight) {
  var techniques = [];
  try {
    var papers = (JSON.parse(text).data || []);
    papers.forEach(function (paper) {
      if (!paper.abstract || !paper.title) return;
      var t = extractTechniqueFromAbstract(paper.title, paper.abstract, paper.year, weight);
      if (t) techniques.push(t);
    });
  } catch (e) { /* skip parse errors */ }
  return techniques;
}

function parseMarkdownPrompts(text, weight) {
  var techniques = [];
  var pattern = /##\s+Act as\s+(.+?)\n+(?:Contributed by[^\n]*\n+)?(?:>?\s*)?([^\n#]{50,400})/gi;
  var match, count = 0;
  while ((match = pattern.exec(text)) !== null && count < 20) {
    var role = match[1].trim();
    var prompt = match[2].trim().replace(/^["']|["']$/g, '');
    if (prompt.length < 30) continue;
    techniques.push(buildTechnique('persona-' + slugify(role), 'Act as ' + role, prompt.slice(0, 300), 'community', 'awesome-chatgpt-prompts', 2023, weight, role + ' ' + prompt));
    count++;
  }
  return techniques;
}

function parseMarkdownGuide(text, weight) {
  var techniques = [];
  var pattern = /#{1,3}\s+([^\n]+)\n+([\s\S]{80,600}?)(?=\n#{1,3}\s|\n---|\n\*\*\*|$)/g;
  var match, count = 0;
  while ((match = pattern.exec(text)) !== null && count < 15) {
    var heading = match[1].trim();
    var body = match[2].trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');
    if (!/prompting|technique|method|approach|reasoning|chain|shot|example/i.test(heading + body)) continue;
    if (body.length < 60) continue;
    var name = heading.replace(/[*_`]/g, '').trim();
    techniques.push(buildTechnique('guide-' + slugify(name), name, body.slice(0, 250), 'guide', 'prompting-guide', 2024, weight, heading + ' ' + body));
    count++;
  }
  return techniques;
}

function parseHtmlScrape(text, weight, sourceId) {
  var techniques = [];
  var cleaned = text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();

  var sentences = cleaned.split(/[.!?]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 40; });
  var techniqueKW = /\b(prompt|prompting|instruct|technique|method|reasoning|chain|step|generate|role|context|constraint|framework|jailbreak|bypass|override|persona|simulate)\b/i;
  var count = 0, seenNames = {};

  for (var i = 0; i < sentences.length && count < 25; i++) {
    var sentence = sentences[i];
    if (!techniqueKW.test(sentence) || sentence.length < 50 || sentence.length > 500) continue;
    var name = extractTechniqueNameFromContext(sentence, sentences[i - 1], sentences[i + 1]);
    if (!name || seenNames[name]) continue;
    seenNames[name] = true;
    techniques.push(buildTechnique(sourceId + '-' + slugify(name), name, sentence.slice(0, 300), 'web-scrape', sourceId, 2024, weight, sentence));
    count++;
  }
  return techniques;
}

// ─── TECHNIQUE HELPERS ─────────────────────────────────────────────────────
// Single builder eliminates duplication across all parsers.

function buildTechnique(id, name, instruction, source, sourceTitle, year, weight, inferText) {
  return {
    id: id,
    name: name,
    instruction: instruction.trim(),
    source: source,
    sourceTitle: sourceTitle,
    year: year,
    weight: weight || 1.0,
    tasks: inferApplicableTasks(inferText || name),
    addedAt: Date.now()
  };
}

function extractTechniqueFromAbstract(title, abstract, year, weight) {
  var name = extractTechniqueName(title);
  if (!name) return null;
  var instruction = extractInstruction(abstract);
  if (!instruction || instruction.length < 20) return null;
  return buildTechnique(slugify(name), name, instruction, 'academic', title, year, weight, title + ' ' + abstract);
}

function extractTechniqueName(title) {
  var patterns = [
    /^([A-Z][a-zA-Z\s\-]+(?:Prompting|Reasoning|Chain|Thought|Decomposition|Sampling|Verification|Reflection|Critique|Calibration|Elicitation|Augmentation))/,
    /\b((?:Chain|Tree|Graph|Skeleton|Step-Back|Self-Ask|ReAct|REACT|PAL|ToT|CoT|RAG|RLHF|Constitutional|Maieutic|Analogical|Contrastive|Least-to-Most|Self-Consistency|Self-Refine|Reflexion|Metacognitive|Directional|Generated Knowledge)[^\.,;]{0,40})/i
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = title.match(patterns[i]);
    if (m) return m[1].trim().replace(/\s+/g, ' ');
  }
  if (/prompting|reasoning|chain|thought|decompos/i.test(title)) {
    return title.split(/\s+/).slice(0, 5).join(' ');
  }
  return null;
}

function extractInstruction(abstract) {
  var sentences = abstract.split(/[.!?]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 30; });
  var actionSents = sentences.filter(function (s) {
    return /\b(prompt|instruct|ask|generate|reason|think|decompose|chain|step|solve|technique|strategy)\b/i.test(s);
  });
  var best = actionSents[0] || sentences[0];
  if (!best) return null;
  best = best.replace(/^(we |this paper |the model |our method |the approach |it )/i, '')
    .replace(/^(proposes?|presents?|introduces?|shows?|demonstrates?)\s+/i, '')
    .replace(/^(that |a |an |the )/i, '').trim();
  if (best.length > 0) best = best[0].toUpperCase() + best.slice(1);
  return best.length > 200 ? best.slice(0, 197) + '...' : best;
}

function extractTechniqueNameFromContext(sentence, prev, next) {
  var m = sentence.match(/\b([A-Z][a-zA-Z\s\-]{2,30}(?:prompting|technique|method|approach|strategy|pattern|framework))\b/i);
  if (m) return m[1].trim();
  m = sentence.match(/["']([^"']{5,40})["']\s+(?:is|involves|means|refers to|technique|method)/i);
  if (m) return m[1].trim();
  m = sentence.match(/\b(?:use|apply|try|employ)\s+([a-zA-Z\s\-]{5,30})\s+to\b/i);
  if (m && /prompt|instruct|technique|method/i.test(m[1])) return m[1].trim();
  if (prev) { m = prev.match(/^([A-Z][a-zA-Z\s\-]{3,30})$/); if (m && m[1].split(/\s+/).length <= 5) return m[1].trim(); }
  var words = sentence.split(/\s+/).slice(0, 6).join(' ').replace(/^(The|A|An|This|That|To|For|By|With|When|How|Why|What)\s+/i, '');
  return (words.length >= 10 && words.length <= 50) ? words.slice(0, 40) : null;
}

function inferApplicableTasks(text) {
  var taskMap = {
    code: /\b(code|program|software|algorithm|debugging|implementation)\b/i,
    math: /\b(math|arithmetic|reasoning|logic|proof|calculation|numerical)\b/i,
    research: /\b(knowledge|factual|question answering|information|retrieval|commonsense)\b/i,
    analysis: /\b(analysis|evaluation|assessment|classification|judgment)\b/i,
    creative: /\b(creative|generation|writing|story|narrative|text generation)\b/i,
    strategy: /\b(planning|decision|strategy|multi-step|complex task)\b/i,
    general: /\b(general|broad|diverse|multiple|various|all tasks)\b/i
  };
  var tasks = [];
  for (var t in taskMap) { if (taskMap[t].test(text)) tasks.push(t); }
  return tasks.length > 0 ? tasks : ['general'];
}

// ─── DEDUP & MERGE ─────────────────────────────────────────────────────────

function deduplicateTechniques(techniques) {
  var seen = {};
  return techniques.filter(function (t) {
    var key = t.id || slugify(t.name);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function mergeTechniques(existing, newOnes) {
  var ids = {};
  existing.forEach(function (t) { ids[t.id] = true; });
  var merged = existing.concat(newOnes.filter(function (t) { return !ids[t.id]; }));
  merged.sort(function (a, b) {
    return ((b.weight || 1) * (b.year || 2020)) - ((a.weight || 1) * (a.year || 2020));
  });
  return merged.slice(0, 300);
}

// ─── MEMORY ────────────────────────────────────────────────────────────────

async function recordEnhancement(data) {
  var stored = await storageGetAsync('hm_memory');
  if (!stored.promptSignatures) stored.promptSignatures = {};
  if (!stored.techniqueScores) stored.techniqueScores = {};
  if (!stored.totalEnhancements) stored.totalEnhancements = 0;

  stored.totalEnhancements++;
  var sig = data.task + ':' + (data.domains || []).join(',');

  if (!stored.promptSignatures[sig]) stored.promptSignatures[sig] = { count: 0, techniques: {} };
  stored.promptSignatures[sig].count++;

  (data.techniques || []).forEach(function (t) {
    if (!stored.promptSignatures[sig].techniques[t]) stored.promptSignatures[sig].techniques[t] = 0;
    stored.promptSignatures[sig].techniques[t]++;
  });

  var sigs = Object.keys(stored.promptSignatures);
  if (sigs.length > 50) {
    sigs.sort(function (a, b) { return stored.promptSignatures[a].count - stored.promptSignatures[b].count; });
    delete stored.promptSignatures[sigs[0]];
  }

  await new Promise(function (res) { chrome.storage.local.set({ hm_memory: stored }, res); });
}

// ─── UTILS ─────────────────────────────────────────────────────────────────

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

function storageGetAsync(key) {
  return new Promise(function (res) {
    chrome.storage.local.get(key, function (d) { res(d[key] || {}); });
  });
}

// ─── ALARMS ────────────────────────────────────────────────────────────────

try {
  if (chrome.alarms) {
    chrome.alarms.create('hm-knowledge-refresh', { periodInMinutes: 240 });
    chrome.alarms.onAlarm.addListener(function (alarm) {
      if (alarm.name === 'hm-knowledge-refresh') fetchKnowledge();
    });
  }
} catch (e) {
  console.log('[HailMary] Alarms fallback:', e.message);
}

console.log('[HailMary] Background service worker v6.0 loaded');
