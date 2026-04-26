/**
 * HailMary Background Service Worker v3.0
 * Handles: install setup, tab badge, and the Knowledge Fetcher —
 * a real-time web scraper that discovers new prompting techniques
 * and stores them so the engine gets smarter over time.
 */

console.log('[HailMary] Background service worker loading...');

// ─────────────────────────────────────────────────────────────────
// INSTALL
// ─────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(function(details) {
  console.log('[HailMary] onInstalled:', details.reason);
  if (details.reason === 'install') {
    chrome.storage.local.set({
      hm_v3:       { mode:'hailmary', depth:'4', inject:true, submit:false },
      hm_hist:     [],
      hm_knowledge:{ techniques:[], lastFetch:0, fetchCount:0 },
      hm_memory:   { promptSignatures:{}, techniqueScores:{}, totalEnhancements:0 }
    }, function() {
      console.log('[HailMary] Initial storage set');
    });
    // Kick off first knowledge fetch after a short delay
    setTimeout(function() {
      console.log('[HailMary] Starting first knowledge fetch...');
      fetchKnowledge();
    }, 3000);
  }
  if (details.reason === 'update') {
    console.log('[HailMary] Extension updated, re-fetching knowledge...');
    // Re-fetch on update to get fresh techniques
    setTimeout(fetchKnowledge, 2000);
  }
});

// ─────────────────────────────────────────────────────────────────
// TAB BADGE
// ─────────────────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(function(info) {
  chrome.tabs.get(info.tabId, function(tab) {
    if (chrome.runtime.lastError) return;
    var isAI = /chatgpt|openai|claude\.ai|gemini|perplexity|poe\.com|grok|you\.com/.test(tab.url || '');
    chrome.action.setBadgeText({ text: isAI ? 'ON' : '', tabId: info.tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#7c3aed', tabId: info.tabId });
  });
});

// ─────────────────────────────────────────────────────────────────
// MESSAGE HANDLER — popup/engine communicates via chrome.runtime.sendMessage
// ─────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === 'GET_KNOWLEDGE') {
    chrome.storage.local.get(['hm_knowledge', 'hm_memory'], function(data) {
      sendResponse({
        knowledge: data.hm_knowledge || { techniques:[], lastFetch:0, fetchCount:0 },
        memory:    data.hm_memory    || { promptSignatures:{}, techniqueScores:{}, totalEnhancements:0 }
      });
    });
    return true; // async
  }

  if (msg.type === 'RECORD_ENHANCEMENT') {
    recordEnhancement(msg.data);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'FETCH_KNOWLEDGE_NOW') {
    fetchKnowledge().then(function(result) {
      sendResponse(result);
    });
    return true;
  }

  if (msg.type === 'GET_STATUS') {
    chrome.storage.local.get('hm_knowledge', function(data) {
      var k = data.hm_knowledge || {};
      sendResponse({
        techniqueCount: (k.techniques || []).length,
        lastFetch:      k.lastFetch || 0,
        fetchCount:     k.fetchCount || 0
      });
    });
    return true;
  }
});

// ─────────────────────────────────────────────────────────────────
// KNOWLEDGE FETCHER
// Pulls from multiple free, no-auth sources and extracts technique data
// ─────────────────────────────────────────────────────────────────

// Sources: curated GitHub raw files + Semantic Scholar (free API, no key needed) + unjail.ai + promptfoo
var KNOWLEDGE_SOURCES = [
  {
    id:   'awesome-prompts',
    url:  'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/README.md',
    type: 'markdown-prompts',
    weight: 1.0
  },
  {
    id:   'learnprompting',
    url:  'https://raw.githubusercontent.com/trigaten/Learn_Prompting/main/docs/basics/intro.md',
    type: 'markdown-guide',
    weight: 1.2
  },
  {
    id:   'semantic-scholar-cot',
    url:  'https://api.semanticscholar.org/graph/v1/paper/search?query=chain+of+thought+prompting+LLM&fields=title,abstract,year&limit=8',
    type: 'semantic-scholar',
    weight: 1.5
  },
  {
    id:   'semantic-scholar-prompt-eng',
    url:  'https://api.semanticscholar.org/graph/v1/paper/search?query=prompt+engineering+techniques+large+language+models&fields=title,abstract,year&limit=8',
    type: 'semantic-scholar',
    weight: 1.5
  },
  {
    id:   'semantic-scholar-reasoning',
    url:  'https://api.semanticscholar.org/graph/v1/paper/search?query=reasoning+prompting+few-shot+zero-shot+LLM&fields=title,abstract,year&limit=6',
    type: 'semantic-scholar',
    weight: 1.4
  },
  {
    id:   'promptingguide-raw',
    url:  'https://raw.githubusercontent.com/dair-ai/Prompt-Engineering-Guide/main/guides/prompts-advanced-usage.md',
    type: 'markdown-guide',
    weight: 1.3
  },
  {
    id:   'unjail-ai',
    url:  'https://unjail.ai',
    type: 'html-scrape',
    weight: 1.6
  },
  {
    id:   'promptfoo-guides',
    url:  'https://www.promptfoo.dev/docs/guides/',
    type: 'html-scrape',
    weight: 1.4
  }
];

// How often to re-fetch (4 hours)
var FETCH_INTERVAL_MS = 4 * 60 * 60 * 1000;

async function fetchKnowledge() {
  var now = Date.now();

  var stored = await new Promise(function(res) {
    chrome.storage.local.get('hm_knowledge', function(d) { res(d.hm_knowledge || {}); });
  });

  if (stored.lastFetch && (now - stored.lastFetch) < FETCH_INTERVAL_MS) {
    return { skipped: true, reason: 'fetched recently', count: (stored.techniques||[]).length };
  }

  // Fetch all sources in parallel instead of sequentially
  var promises = KNOWLEDGE_SOURCES.map(function(source) {
    return fetchSourceWithRetry(source).then(function(result) {
      return { id: source.id, ok: true, count: (result || []).length, techniques: result || [] };
    }).catch(function(e) {
      return { id: source.id, ok: false, error: e.message, techniques: [] };
    });
  });

  var results = await Promise.all(promises);

  var allTechniques = [];
  var fetchResults  = [];
  results.forEach(function(r) {
    fetchResults.push({ id: r.id, ok: r.ok, count: r.count || 0, error: r.error });
    if (r.techniques.length > 0) {
      allTechniques = allTechniques.concat(r.techniques);
    }
  });

  var deduped  = deduplicateTechniques(allTechniques);
  var existing = stored.techniques || [];
  var merged   = mergeTechniques(existing, deduped);

  var newKnowledge = {
    techniques:   merged,
    lastFetch:    now,
    fetchCount:   (stored.fetchCount || 0) + 1,
    lastResults:  fetchResults,
    totalFound:   merged.length
  };

  await new Promise(function(res) {
    chrome.storage.local.set({ hm_knowledge: newKnowledge }, res);
  });

  console.log('[HailMary] Knowledge fetch complete: ' + deduped.length + ' new, ' + merged.length + ' total');
  return { ok: true, newCount: deduped.length, totalCount: merged.length, results: fetchResults };
}

// Retry wrapper with exponential backoff (max 2 retries)
async function fetchSourceWithRetry(source, attempt) {
  attempt = attempt || 0;
  try {
    return await fetchSource(source);
  } catch(e) {
    if (attempt < 2) {
      var delay = Math.pow(2, attempt) * 1000;
      console.log('[HailMary] Retry ' + (attempt + 1) + ' for ' + source.id + ' in ' + delay + 'ms');
      await new Promise(function(res) { setTimeout(res, delay); });
      return fetchSourceWithRetry(source, attempt + 1);
    }
    throw e;
  }
}

async function fetchSource(source) {
  try {
    var resp = await fetch(source.url, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'HailMary-Extension/3.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!resp.ok) {
      console.log('[HailMary] Fetch failed for ' + source.id + ': HTTP ' + resp.status);
      throw new Error('HTTP ' + resp.status);
    }

    var text = await resp.text();

    if (source.type === 'semantic-scholar') {
      return parseSemanticScholar(text, source.weight);
    }
    if (source.type === 'markdown-prompts') {
      return parseMarkdownPrompts(text, source.weight);
    }
    if (source.type === 'markdown-guide') {
      return parseMarkdownGuide(text, source.weight);
    }
    if (source.type === 'html-scrape') {
      return parseHtmlScrape(text, source.weight, source.id);
    }
    return [];
  } catch(e) {
    console.log('[HailMary] Error fetching ' + source.id + ':', e.message);
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────────
// PARSERS — extract structured technique data from raw content
// ─────────────────────────────────────────────────────────────────

function parseSemanticScholar(text, weight) {
  var techniques = [];
  try {
    var data = JSON.parse(text);
    var papers = data.data || [];
    papers.forEach(function(paper) {
      if (!paper.abstract || !paper.title) return;
      var extracted = extractTechniqueFromAbstract(paper.title, paper.abstract, paper.year, weight);
      if (extracted) techniques.push(extracted);
    });
  } catch(e) {}
  return techniques;
}

function extractTechniqueFromAbstract(title, abstract, year, weight) {
  // Extract the core technique name and instruction from academic abstract
  var name = extractTechniqueName(title);
  if (!name) return null;

  // Extract what the technique does from the abstract
  var instruction = extractInstruction(abstract);
  if (!instruction || instruction.length < 20) return null;

  // Determine which task types this technique applies to
  var applicableTasks = inferApplicableTasks(title + ' ' + abstract);

  return {
    id:           slugify(name),
    name:         name,
    instruction:  instruction,
    source:       'academic',
    sourceTitle:  title,
    year:         year || 2023,
    weight:       weight || 1.0,
    tasks:        applicableTasks,
    addedAt:      Date.now()
  };
}

function extractTechniqueName(title) {
  // Common patterns: "X Prompting", "X-of-Thought", "X Chain", etc.
  var patterns = [
    /^([A-Z][a-zA-Z\s\-]+(?:Prompting|Reasoning|Chain|Thought|Decomposition|Sampling|Verification|Reflection|Critique|Calibration|Elicitation|Augmentation))/,
    /\b((?:Chain|Tree|Graph|Skeleton|Step-Back|Self-Ask|ReAct|REACT|PAL|ToT|CoT|RAG|RLHF|Constitutional|Maieutic|Analogical|Contrastive|Least-to-Most|Self-Consistency|Self-Refine|Reflexion|Metacognitive|Directional|Generated Knowledge)[^\.,;]{0,40})/i
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = title.match(patterns[i]);
    if (m) return m[1].trim().replace(/\s+/g, ' ');
  }
  // Fallback: use first 5 words of title if it looks like a technique
  if (/prompting|reasoning|chain|thought|decompos/i.test(title)) {
    return title.split(/\s+/).slice(0, 5).join(' ');
  }
  return null;
}

function extractInstruction(abstract) {
  // Try to extract the core "how to use" instruction from the abstract
  // Look for sentences describing what the method does
  var sentences = abstract.split(/[.!?]+/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 30; });

  // Prefer sentences with action verbs describing the technique
  var actionSentences = sentences.filter(function(s) {
    return /\b(prompt|instruct|ask|tell|generate|produce|reason|think|decompose|break|chain|step|solve|approach|method|technique|strategy)\b/i.test(s);
  });

  var best = actionSentences[0] || sentences[0];
  if (!best) return null;

  // Convert to imperative instruction
  best = best
    .replace(/^(we |this paper |the model |our method |the approach |it )/i, '')
    .replace(/^(proposes?|presents?|introduces?|shows?|demonstrates?)\s+/i, '')
    .replace(/^(that |a |an |the )/i, '')
    .trim();

  // Capitalize first letter
  if (best.length > 0) best = best[0].toUpperCase() + best.slice(1);

  // Truncate to reasonable length
  if (best.length > 200) best = best.slice(0, 197) + '...';

  return best;
}

function inferApplicableTasks(text) {
  var taskMap = {
    code:       /\b(code|program|software|algorithm|debugging|implementation)\b/i,
    math:       /\b(math|arithmetic|reasoning|logic|proof|calculation|numerical)\b/i,
    research:   /\b(knowledge|factual|question answering|information|retrieval|commonsense)\b/i,
    analysis:   /\b(analysis|evaluation|assessment|classification|judgment)\b/i,
    creative:   /\b(creative|generation|writing|story|narrative|text generation)\b/i,
    strategy:   /\b(planning|decision|strategy|multi-step|complex task)\b/i,
    general:    /\b(general|broad|diverse|multiple|various|all tasks)\b/i
  };
  var tasks = [];
  for (var t in taskMap) {
    if (taskMap[t].test(text)) tasks.push(t);
  }
  return tasks.length > 0 ? tasks : ['general'];
}

function parseMarkdownPrompts(text, weight) {
  var techniques = [];
  // Extract act/prompt pairs from awesome-chatgpt-prompts format
  var actPattern = /##\s+Act as\s+(.+?)\n+(?:Contributed by[^\n]*\n+)?(?:>?\s*)?([^\n#]{50,400})/gi;
  var match;
  var count = 0;
  while ((match = actPattern.exec(text)) !== null && count < 20) {
    var role = match[1].trim();
    var prompt = match[2].trim().replace(/^["']|["']$/g, '');
    if (prompt.length < 30) continue;
    techniques.push({
      id:          'persona-' + slugify(role),
      name:        'Act as ' + role,
      instruction: prompt.slice(0, 300),
      source:      'community',
      sourceTitle: 'awesome-chatgpt-prompts',
      year:        2023,
      weight:      weight,
      tasks:       inferApplicableTasks(role + ' ' + prompt),
      addedAt:     Date.now()
    });
    count++;
  }
  return techniques;
}

function parseMarkdownGuide(text, weight) {
  var techniques = [];
  // Extract technique sections from markdown guides
  var sectionPattern = /#{1,3}\s+([^\n]+)\n+([\s\S]{80,600}?)(?=\n#{1,3}\s|\n---|\n\*\*\*|$)/g;
  var match;
  var count = 0;
  while ((match = sectionPattern.exec(text)) !== null && count < 15) {
    var heading = match[1].trim();
    var body    = match[2].trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');

    // Only keep sections that look like technique descriptions
    if (!/prompting|technique|method|approach|reasoning|chain|shot|example/i.test(heading + body)) continue;
    if (body.length < 60) continue;

    var name = heading.replace(/[*_`]/g, '').trim();
    var instruction = body.slice(0, 250).trim();

    techniques.push({
      id:          'guide-' + slugify(name),
      name:        name,
      instruction: instruction,
      source:      'guide',
      sourceTitle: 'prompting-guide',
      year:        2024,
      weight:      weight,
      tasks:       inferApplicableTasks(heading + ' ' + body),
      addedAt:     Date.now()
    });
    count++;
  }
  return techniques;
}

function parseHtmlScrape(text, weight, sourceId) {
  var techniques = [];
  
  // Strip HTML tags and decode entities
  var cleaned = text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Split into sentences
  var sentences = cleaned.split(/[.!?]+/).map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 40; });

  // Keywords that indicate technique-like content
  var techniqueKeywords = /\b(prompt|prompting|instruct|instruction|technique|method|approach|reasoning|chain|step|generate|output|format|role|context|constraint|example|ask|tell|guide|strategy|pattern|framework|model|response|query|request|command|directive|jailbreak|bypass|override|system|behavior|persona|character|act as|pretend|imagine|simulate)\b/i;

  var count = 0;
  var seenNames = {};

  for (var i = 0; i < sentences.length && count < 25; i++) {
    var sentence = sentences[i];
    
    // Check if sentence contains technique keywords
    if (!techniqueKeywords.test(sentence)) continue;
    if (sentence.length < 50 || sentence.length > 500) continue;

    // Try to extract a technique name from the sentence or surrounding context
    var name = extractTechniqueNameFromSentence(sentence, sentences[i-1], sentences[i+1]);
    if (!name || seenNames[name]) continue;
    
    seenNames[name] = true;

    // Use the sentence as the instruction
    var instruction = sentence.slice(0, 300).trim();

    techniques.push({
      id:          sourceId + '-' + slugify(name),
      name:        name,
      instruction: instruction,
      source:      'web-scrape',
      sourceTitle: sourceId,
      year:        2024,
      weight:      weight,
      tasks:       inferApplicableTasks(sentence),
      addedAt:     Date.now()
    });
    count++;
  }

  return techniques;
}

function extractTechniqueNameFromSentence(sentence, prevSentence, nextSentence) {
  // Try to find a technique name in the sentence or context
  
  // Pattern 1: "X prompting" or "X technique"
  var match = sentence.match(/\b([A-Z][a-zA-Z\s\-]{2,30}(?:prompting|technique|method|approach|strategy|pattern|framework))\b/i);
  if (match) return match[1].trim();

  // Pattern 2: Quoted technique names
  match = sentence.match(/["']([^"']{5,40})["']\s+(?:is|involves|means|refers to|technique|method|approach)/i);
  if (match) return match[1].trim();

  // Pattern 3: "Use X to" or "Apply X to"
  match = sentence.match(/\b(?:use|apply|try|employ)\s+([a-zA-Z\s\-]{5,30})\s+to\b/i);
  if (match && /prompt|instruct|technique|method|approach/i.test(match[1])) return match[1].trim();

  // Pattern 4: Check previous sentence for a heading-like pattern
  if (prevSentence) {
    match = prevSentence.match(/^([A-Z][a-zA-Z\s\-]{3,30})$/);
    if (match && match[1].split(/\s+/).length <= 5) return match[1].trim();
  }

  // Pattern 5: Extract first few meaningful words as name
  var words = sentence.split(/\s+/).slice(0, 6);
  var candidateName = words.join(' ').replace(/^(The|A|An|This|That|These|Those|To|For|By|With|When|Where|How|Why|What)\s+/i, '');
  if (candidateName.length >= 10 && candidateName.length <= 50) {
    return candidateName.slice(0, 40);
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// DEDUP & MERGE
// ─────────────────────────────────────────────────────────────────

function deduplicateTechniques(techniques) {
  var seen = {};
  return techniques.filter(function(t) {
    var key = t.id || slugify(t.name);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function mergeTechniques(existing, newOnes) {
  var existingIds = {};
  existing.forEach(function(t) { existingIds[t.id] = true; });
  var toAdd = newOnes.filter(function(t) { return !existingIds[t.id]; });
  // Keep max 300 techniques, prioritize by weight and recency
  var merged = existing.concat(toAdd);
  merged.sort(function(a, b) {
    return ((b.weight || 1) * (b.year || 2020)) - ((a.weight || 1) * (a.year || 2020));
  });
  return merged.slice(0, 300);
}

// ─────────────────────────────────────────────────────────────────
// MEMORY — record what was enhanced and learn from patterns
// ─────────────────────────────────────────────────────────────────

async function recordEnhancement(data) {
  var stored = await new Promise(function(res) {
    chrome.storage.local.get('hm_memory', function(d) { res(d.hm_memory || {}); });
  });

  var memory = stored;
  if (!memory.promptSignatures) memory.promptSignatures = {};
  if (!memory.techniqueScores)  memory.techniqueScores  = {};
  if (!memory.totalEnhancements) memory.totalEnhancements = 0;

  memory.totalEnhancements++;

  // Record which techniques were used for this task+domain combo
  var sig = data.task + ':' + (data.domains || []).join(',');
  if (!memory.promptSignatures[sig]) {
    memory.promptSignatures[sig] = { count: 0, techniques: {} };
  }
  memory.promptSignatures[sig].count++;

  (data.techniques || []).forEach(function(t) {
    if (!memory.promptSignatures[sig].techniques[t]) {
      memory.promptSignatures[sig].techniques[t] = 0;
    }
    memory.promptSignatures[sig].techniques[t]++;
  });

  // Keep memory lean — max 50 signatures
  var sigs = Object.keys(memory.promptSignatures);
  if (sigs.length > 50) {
    // Remove least-used signatures
    sigs.sort(function(a, b) {
      return memory.promptSignatures[a].count - memory.promptSignatures[b].count;
    });
    delete memory.promptSignatures[sigs[0]];
  }

  await new Promise(function(res) {
    chrome.storage.local.set({ hm_memory: memory }, res);
  });
}

// ─────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

// Periodic re-fetch alarm (every 4 hours = 240 minutes)
try {
  if (chrome.alarms) {
    chrome.alarms.create('hm-knowledge-refresh', { periodInMinutes: 240 });
    chrome.alarms.onAlarm.addListener(function(alarm) {
      if (alarm.name === 'hm-knowledge-refresh') fetchKnowledge();
    });
    console.log('[HailMary] Alarms API configured');
  }
} catch(e) {
  console.log('[HailMary] Alarms API not available, using setTimeout fallback');
}

console.log('[HailMary] Background service worker loaded successfully');
