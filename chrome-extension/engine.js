/**
 * HailMary v6.0 — ENGINE MODULE
 * Prompt engineering engine with meta-learning, analysis, and enhancement.
 * Brain builders share a single task-trait table — zero duplicated prompt logic.
 */
window.HailMaryEngine = (function () {
  'use strict';

  // ─── SESSION INTELLIGENCE ────────────────────────────────────────────────
  var session = { current: 1.0, count: 0, firstFP: null, peakIntelligence: 1.0 };

  function boost(task) {
    var map = { code: 0.08, research: 0.06, strategy: 0.07, analysis: 0.06, creative: 0.05, general: 0.03 };
    session.current = Math.min(session.current + (map[task] || 0.03), 2.5);
    session.count++;
    if (session.current > session.peakIntelligence) session.peakIntelligence = session.current;
  }

  // ─── META-LEARNING ──────────────────────────────────────────────────────
  var metaLearn = { techniqueWeights: {}, qualityHistory: [], adaptiveThreshold: 0.5, taskProfiles: {} };

  function updateMetaLearning(signature, techniques, quality) {
    metaLearn.qualityHistory.push({ sig: signature, q: quality, ts: Date.now() });
    if (metaLearn.qualityHistory.length > 100) metaLearn.qualityHistory = metaLearn.qualityHistory.slice(-80);
    techniques.forEach(function (t) {
      if (!metaLearn.techniqueWeights[t]) metaLearn.techniqueWeights[t] = { sum: 0, count: 0 };
      metaLearn.techniqueWeights[t].sum += quality;
      metaLearn.techniqueWeights[t].count++;
    });
    var avg = metaLearn.qualityHistory.reduce(function (s, h) { return s + h.q; }, 0) / metaLearn.qualityHistory.length;
    metaLearn.adaptiveThreshold = Math.max(0.3, Math.min(0.9, avg * 0.8));
  }

  // ─── KNOWLEDGE CACHE ────────────────────────────────────────────────────
  var kCache = null;

  function loadKnowledge(cb) {
    if (kCache) return cb(kCache, null);
    try {
      chrome.runtime.sendMessage({ type: 'GET_KNOWLEDGE' }, function (resp) {
        if (resp && resp.knowledge) { kCache = resp.knowledge; cb(kCache, resp.memory); }
        else cb({ techniques: [] }, null);
      });
    } catch (e) { cb({ techniques: [] }, null); }
  }

  function record(data) {
    try { chrome.runtime.sendMessage({ type: 'RECORD_ENHANCEMENT', data: data }); } catch (e) {}
  }

  // ─── ANALYZER ────────────────────────────────────────────────────────────
  var TASK_KW = {
    code: /\b(code|implement|function|class|debug|script|refactor|build|program|api|sql|query|algorithm|parser|compiler|deploy|endpoint|microservice|lambda|component)\b/i,
    research: /\b(research|explain|what is|how does|evidence|study|paper|theory|mechanism|discover|compare|survey|review literature|cite|source)\b/i,
    analysis: /\b(analyze|evaluate|assess|diagnose|interpret|audit|benchmark|measure|metric|compare|examine|investigate|root cause|bottleneck)\b/i,
    strategy: /\b(strategy|plan|roadmap|decision|tradeoff|prioritize|architect|design system|scale|migrate|optimize|budget|allocate|stakeholder)\b/i,
    creative: /\b(write|create|generate|story|poem|essay|article|content|compose|draft|brainstorm|ideate|design|pitch|copy|slogan|tagline)\b/i,
    howto: /\b(how to|step by step|tutorial|guide|walkthrough|setup|install|configure|instructions|procedure|recipe)\b/i,
    summarize: /\b(summarize|summary|tldr|tl;dr|condense|distill|key points|takeaways|overview|brief)\b/i,
    math: /\b(calculate|solve|equation|formula|proof|theorem|derive|integral|matrix|probability|statistics|linear algebra)\b/i
  };

  var DOMAIN_KW = {
    tech: /\b(software|web|database|cloud|devops|docker|kubernetes|react|node|python|java|typescript|rust|golang|aws|azure|gcp|ci\/cd|api|microservice|serverless)\b/i,
    business: /\b(revenue|profit|growth|market|customer|startup|enterprise|saas|b2b|funnel|kpi|roi|churn|retention|pricing|monetize)\b/i,
    science: /\b(experiment|hypothesis|data|statistical|genome|protein|quantum|physics|chemistry|biology|neuroscience|climate|ecology)\b/i,
    finance: /\b(investment|portfolio|stock|bond|derivative|valuation|risk|hedge|dividend|asset|liability|balance sheet|cashflow)\b/i,
    health: /\b(medical|clinical|diagnosis|treatment|patient|pharmaceutical|biomarker|therapy|surgery|symptom|pathology|epidemiology)\b/i,
    legal: /\b(legal|law|regulation|compliance|contract|liability|statute|jurisdiction|patent|trademark|copyright|litigation)\b/i
  };

  var FMT_KW = {
    short: /\b(brief|concise|short|quick|one.line|tl;?dr)\b/i,
    bullets: /\b(bullet|list|points)\b/i,
    numbered: /\b(numbered|step|ordered)\b/i,
    detailed: /\b(detailed|comprehensive|thorough|in.depth|exhaustive)\b/i,
    json: /\b(json|structured data|schema)\b/i,
    table: /\b(table|spreadsheet|grid|tabular)\b/i,
    markdown: /\b(markdown|md|formatted)\b/i
  };

  var AUDIENCE_KW = {
    beginner: /\b(beginner|newbie|eli5|simple|basics|intro|101)\b/i,
    expert: /\b(expert|advanced|senior|deep.dive|low.level)\b/i,
    developer: /\b(developer|programmer|engineer|coder|dev)\b/i,
    executive: /\b(executive|ceo|cto|manager|leadership|stakeholder|board)\b/i
  };

  function analyze(raw) {
    var words = raw.split(/\s+/);
    var wc = words.length;
    var lower = raw.toLowerCase();
    var fp = hash32(raw);

    var task = 'general';
    for (var t in TASK_KW) { if (TASK_KW[t].test(raw)) { task = t; break; } }

    var domains = [];
    for (var d in DOMAIN_KW) { if (DOMAIN_KW[d].test(raw)) domains.push(d); }

    var fmt = [];
    for (var f in FMT_KW) { if (FMT_KW[f].test(raw)) fmt.push(f); }

    var audience = null;
    for (var a in AUDIENCE_KW) { if (AUDIENCE_KW[a].test(raw)) { audience = a; break; } }

    var context = [], constraints = [], negations = [];
    var sents = raw.split(/[.!?\n]+/).map(function (s) { return s.trim(); }).filter(Boolean);
    sents.forEach(function (s) {
      if (/^(context|background|note|fyi|btw|given that|assuming)/i.test(s)) context.push(s);
      if (/\b(must|shall|require|need|ensure|constrain|limit|restrict)\b/i.test(s)) constraints.push(s);
      if (/\b(don't|do not|avoid|never|without|exclude|no\s+\w+ing)\b/i.test(s)) negations.push(s);
    });

    var ambiguity = 0;
    if (wc < 5) ambiguity += 2;
    else if (wc < 10) ambiguity += 1;
    if (!domains.length) ambiguity++;
    if (/\b(thing|stuff|it|something)\b/i.test(raw)) ambiguity++;

    var complexity = 'medium';
    if (wc > 80 || constraints.length > 2 || domains.length > 2) complexity = 'high';
    else if (wc < 15 && !constraints.length) complexity = 'low';

    var intent = raw.length > 120 ? raw.slice(0, 117) + '...' : raw;

    return { raw: raw, wc: wc, fp: fp, task: task, domains: domains, fmt: fmt, audience: audience, context: context, constraints: constraints, negations: negations, amb: ambiguity, complexity: complexity, intent: intent, signature: task + ':' + domains.join(',') };
  }

  function hash32(str) {
    return str.split('').reduce(function (h, c) { return (((h << 5) - h) + c.charCodeAt(0)) | 0; }, 0).toString(36);
  }

  // ─── PROMPT QUALITY SCORING ──────────────────────────────────────────────
  function scorePromptQuality(a) {
    var score = 0.3;
    if (a.wc >= 15) score += 0.1;
    if (a.wc >= 40) score += 0.1;
    if (a.domains.length > 0) score += 0.1;
    if (a.constraints.length > 0) score += 0.1;
    if (a.context.length > 0) score += 0.1;
    if (a.fmt.length > 0) score += 0.05;
    if (a.audience) score += 0.05;
    if (a.amb === 0) score += 0.1;
    return Math.min(1.0, score);
  }

  // ─── MULTI-AGENT SIMULATION ──────────────────────────────────────────────
  function simulateMultiAgent(a) {
    var agents = [
      { agent: 'Architect', prompt: 'Design the optimal structure for: ' + a.intent },
      { agent: 'Critic', prompt: 'Identify flaws and edge cases in: ' + a.intent },
      { agent: 'Optimizer', prompt: 'Find the most efficient approach to: ' + a.intent },
      { agent: 'User Advocate', prompt: 'Ensure usability and clarity for: ' + a.intent }
    ];
    if (a.task === 'code') agents.push({ agent: 'Security Auditor', prompt: 'Audit security of: ' + a.intent });
    if (a.task === 'research') agents.push({ agent: 'Fact Checker', prompt: 'Verify claims about: ' + a.intent });
    return agents;
  }

  // ─── CONTEXTUAL TECHNIQUE SELECTION ──────────────────────────────────────
  function selectContextualTechniques(a, k) {
    if (!k || !k.techniques || k.techniques.length === 0) return [];
    return k.techniques.map(function (t) {
      var s = 0;
      if (t.tasks && t.tasks.indexOf(a.task) >= 0) s += 0.4;
      if (t.weight) s += t.weight * 0.2;
      var w = metaLearn.techniqueWeights[t.name];
      if (w && w.count > 0) s += (w.sum / w.count) * 0.3;
      return { technique: t, score: s };
    }).filter(function (x) { return x.score > metaLearn.adaptiveThreshold; })
      .sort(function (a, b) { return b.score - a.score; });
  }

  // ─── SELF-REFLECTION GENERATOR ───────────────────────────────────────────
  function generateSelfReflection(a) {
    var r = '\n\n[SELF-REFLECTION]\nBefore responding, verify:\n';
    r += '- Response directly addresses: ' + a.intent + '\n';
    r += '- All claims supported by evidence or reasoning\n';
    r += '- Edge cases and failure modes considered\n';
    if (a.constraints.length > 0) r += '- All constraints satisfied: ' + a.constraints.join('; ') + '\n';
    if (a.negations.length > 0) r += '- Avoided: ' + a.negations.join('; ') + '\n';
    r += '- Response format matches request\n';
    r += '- Complexity appropriate for ' + (a.audience || 'general') + ' audience\n';
    return r;
  }

  // ─── SHARED TASK TRAITS TABLE ────────────────────────────────────────────
  // Single source of truth for all brain builders. No task logic is duplicated.
  var TASK_TRAITS = {
    code: {
      requirements: ['Functional requirements', 'Non-functional (performance, security, maintainability)', 'Constraints (language, libraries, environment)', 'Success criteria'],
      phases: ['Design architecture, interfaces, error boundaries', 'Implement core logic, happy path, then error handling', 'Harden against edge cases, invalid inputs, boundary conditions', 'Verify with usage examples against requirements'],
      considerations: ['Abstractions and component interaction', 'Error handling strategy', 'Invariant maintenance', 'Inline documentation for non-obvious decisions']
    },
    research: {
      requirements: ['Core question and specific knowledge needed', 'Scope and appropriate detail level', 'Evidence standards and authoritative sources', 'Unknown or contested knowledge gaps'],
      phases: ['Scan for established findings and strong evidence', 'Synthesize coherent model from evidence', 'Critique: identify gaps, limitations, contradictions', 'Conclude with clear answer and confidence levels'],
      considerations: ['Distinguish empirical findings from theoretical models', 'Acknowledge limitations and knowledge gaps', 'Present competing perspectives', 'State confidence levels clearly']
    },
    analysis: {
      requirements: ['Data or situation to examine', 'Multiple possible interpretations', 'Known facts vs inferences', 'Uncertainty and limitations'],
      phases: ['Frame the question, scope, and success criteria', 'Extract patterns, separate fact from interpretation', 'Identify root causes, not just symptoms', 'Provide specific, actionable recommendations'],
      considerations: ['Objective examination', 'Multiple interpretations considered', 'Actionable insights derived', 'Assumptions clearly stated']
    },
    strategy: {
      requirements: ['Desired objective and outcome', 'Context, constraints, and opportunities', 'Stakeholders and their optimization targets', 'Short-term vs long-term timeframe'],
      phases: ['Assess situation and key decision points', 'Generate multiple viable approaches with tradeoffs', 'Evaluate risk and feasibility of each', 'Recommend with clear rationale and implementation path'],
      considerations: ['Multiple viable approaches generated', 'Risk assessment for each option', 'Clear recommendation with rationale', 'Implementation considerations addressed']
    },
    creative: {
      requirements: ['Type of content (story, article, etc.)', 'Tone, style, and voice', 'Length and format constraints', 'Target audience and purpose'],
      phases: ['Establish concept, voice, and structure', 'Draft core content with creative flair', 'Polish for engagement and readability', 'Verify alignment with purpose and audience'],
      considerations: ['Engaging and well-structured', 'Tailored to intended audience', 'Original and creative', 'Polished and ready to use']
    },
    general: {
      requirements: ['Intent and desired outcome', 'Relevant context and background', 'Applicable constraints and limitations', 'Appropriate quality bar and depth level'],
      phases: ['Understand requirements and constraints', 'Plan approach and key decisions', 'Execute and deliver complete solution', 'Verify completeness and accuracy'],
      considerations: ['Direct and thorough response', 'Well-structured and easy to follow', 'Includes relevant examples', 'Anticipates follow-up questions']
    },
    howto: {
      requirements: ['Prerequisites and dependencies', 'Target environment and platform', 'Expected outcome', 'Skill level of reader'],
      phases: ['List all prerequisites and required knowledge', 'Step-by-step instructions, each action explicit', 'Common failure modes with symptoms and fixes', 'Verification: how to confirm success'],
      considerations: ['Every step is explicit and testable', 'Common pitfalls addressed', 'Expected output at each step', 'Troubleshooting guidance included']
    },
    math: {
      requirements: ['Problem statement and known quantities', 'Required precision and format', 'Allowed methods and tools', 'Proof or derivation requirements'],
      phases: ['State the problem formally', 'Choose method and set up equations', 'Solve step by step, showing work', 'Verify by substitution or alternative method'],
      considerations: ['Rigorous and precise', 'Show all work', 'Handle edge cases (division by zero, etc.)', 'Verify final answer']
    }
  };

  function getTraits(task) { return TASK_TRAITS[task] || TASK_TRAITS.general; }

  // ─── BRAIN: DEEPSEEK V3 (structured reasoning with <think> tags) ────────
  function buildDeepSeekBrain(a, depth) {
    var traits = getTraits(a.task);
    var p = '<think>\n';
    p += 'Step 1 — DECOMPOSITION:\n' + traits.requirements.map(function (r) { return '- ' + r; }).join('\n') + '\n\n';
    p += 'Step 2 — MULTI-PATH EXPLORATION:\n';
    p += 'Path A: Most direct approach\nPath B: Optimize for different tradeoff\nPath C: Unconventional but potentially superior\n\n';
    p += 'Evaluate each path on: Correctness, Robustness, Efficiency, Maintainability\n\n';
    p += 'Step 3 — VERIFICATION:\n- Logical gaps? Unsupported assumptions? Counterexamples? What am I most likely wrong about?\n\n';
    if (depth >= 4) {
      p += 'Step 4 — DEEP SYNTHESIS:\n- Non-obvious insight? Expert vs beginner knowledge? Elegant vs obvious solution?\n\n';
    }
    p += '</think>\n\nBased on this reasoning, here is my response to: ' + a.intent + '\n\n';
    var ctx = buildContextBlock(a);
    if (ctx) p += ctx + '\n\n';
    return p;
  }

  // ─── BRAIN: CHATGPT O1 (extended chain-of-thought) ──────────────────────
  function buildChatGPTO1Brain(a, depth) {
    var traits = getTraits(a.task);
    var p = '[REASONING MODE: EXTENDED CHAIN-OF-THOUGHT]\n\nQuery: ' + a.intent + '\n\n';
    p += '## Phase 1: Understanding\n' + traits.requirements.map(function (r, i) { return (i + 1) + '. ' + r; }).join('\n') + '\n\n';
    p += '## Phase 2: Strategic Planning\nBreak into sub-problems. Identify dependencies. Plan verification strategy.\n\n';
    p += '## Phase 3: Execution\n' + traits.phases.map(function (ph) { return '- ' + ph; }).join('\n') + '\n\n';
    p += '## Phase 4: Verification & Refinement\n- Does this fully address the request?\n- Logical gaps or unsupported claims?\n- What would make this answer better?\n\n';
    if (depth >= 4) {
      p += '## Phase 5: Expert-Level Insight\n- Nuance that separates good from great? Practitioner wisdom? Common misconceptions?\n\n';
    }
    p += '---\n\nComplete response:\n\n';
    var ctx = buildContextBlock(a);
    if (ctx) p += ctx + '\n\n';
    return p;
  }

  // ─── BRAIN: CLAUDE (constitutional / nuanced reasoning) ─────────────────
  function buildClaudeBrain(a, depth) {
    var traits = getTraits(a.task);
    var p = 'I will approach "' + a.intent + '" with careful, nuanced reasoning.\n\n';
    p += '=== Analytical Framework ===\n' + traits.requirements.map(function (r, i) { return (i + 1) + '. ' + r; }).join('\n') + '\n\n';
    p += '=== Core Analysis ===\n' + traits.considerations.map(function (c) { return '- ' + c; }).join('\n') + '\n\n';
    p += '=== Balanced Perspective ===\n- Strengths? Limitations or risks? Alternatives? Confidence levels?\n\n';
    if (depth >= 4) {
      p += '=== Deeper Insight ===\n- Subtle nuances? Practitioner knowledge? Common mistakes? Underlying principle?\n\n';
    }
    p += '---\n\nHere is my complete response:\n\n';
    var ctx = buildContextBlock(a);
    if (ctx) p += ctx + '\n\n';
    return p;
  }

  // ─── BRAIN SELECTOR ──────────────────────────────────────────────────────
  function selectBrain(a, depth) {
    if (a.complexity === 'high' || depth >= 5) return buildDeepSeekBrain(a, depth);
    if ((a.task === 'code' || a.task === 'strategy') && depth >= 3) return buildChatGPTO1Brain(a, depth);
    if ((a.task === 'research' || a.task === 'analysis') && depth >= 3) return buildClaudeBrain(a, depth);
    var brains = [buildDeepSeekBrain, buildChatGPTO1Brain, buildClaudeBrain];
    return brains[Math.abs(parseInt(a.fp, 36) || 0) % 3](a, depth);
  }

  // ─── ROLES ───────────────────────────────────────────────────────────────
  var ROLES = {
    code: [
      'You are a Principal Engineer with DeepSeek-V3 reasoning who ships production systems at scale.',
      'You are a Staff Software Engineer with ChatGPT o1 problem-solving who has reviewed thousands of PRs.',
      'You are a senior backend architect with Claude-level code analysis who thinks in systems, not functions.'
    ],
    research: [
      'You are a research scientist with DeepSeek-V3 analytical depth who separates signal from noise.',
      'You are an expert synthesizer with ChatGPT o1 reasoning who produces clear maps of actual knowledge.',
      'You are a domain expert with Claude-level comprehension who knows where students always get confused.'
    ],
    strategy: [
      'You are a Chief Strategy Officer with DeepSeek-V3 strategic reasoning and high-stakes decision experience.',
      'You are a management consultant with ChatGPT o1 problem-solving who has seen the same mistakes at a hundred companies.',
      'You are a founder with Claude-level strategic thinking who has navigated pivots and competitive pressure.'
    ],
    analysis: [
      'You are a senior analyst with DeepSeek-V3 capabilities who distrusts the obvious interpretation.',
      'You are a data scientist with ChatGPT o1 reasoning who knows the difference between a finding and a story.',
      'You are an investigative researcher with Claude-level analysis who follows evidence wherever it leads.'
    ],
    creative: [
      'You are a creative director with DeepSeek-V3 generative capabilities who kills mediocre ideas to find the one that lands.',
      'You are a writer with ChatGPT o1 creative reasoning who believes the first draft is always wrong.',
      'You are a storyteller with Claude-level narrative understanding who knows specificity drives resonance.'
    ],
    general: [
      'You are a generalist expert with DeepSeek-V3 reasoning who thinks clearly about hard problems across domains.',
      'You are a rigorous thinker with ChatGPT o1 problem-solving who never mistakes confidence for correctness.',
      'You are a trusted advisor with Claude-level comprehension who gives the honest answer, not the comfortable one.'
    ]
  };

  function pickRole(a) {
    var pool = ROLES[a.task] || ROLES.general;
    var idx = Math.abs(parseInt(a.fp, 36) || 0) % pool.length;
    var role = pool[idx];
    var domainPhrases = { tech: ' with deep production software experience', business: ' with a track record of building real businesses', science: ' with rigorous scientific methodology training', finance: ' with institutional investment experience', health: ' with clinical practice understanding', legal: ' with regulatory compliance expertise' };
    if (a.domains.length > 0 && domainPhrases[a.domains[0]]) role += domainPhrases[a.domains[0]];
    return role;
  }

  // ─── CONTEXT & FORMAT ────────────────────────────────────────────────────
  function buildContextBlock(a) {
    var parts = [];
    if (a.context.length > 0) parts.push('Context: ' + a.context.join(' '));
    if (a.constraints.length > 0) parts.push('Requirements: ' + a.constraints.join('; '));
    if (a.negations.length > 0) parts.push('Avoid: ' + a.negations.join('; '));
    if (a.audience) {
      var ad = { beginner: 'Audience: beginner — define terms, use analogies, first principles', expert: 'Audience: expert — skip basics, precise terminology, go deep', developer: 'Audience: developer — precise, working code', executive: 'Audience: executive — lead with impact and decisions' };
      parts.push(ad[a.audience] || 'Audience: ' + a.audience);
    }
    return parts.join('\n');
  }

  function buildFormatDirective(a) {
    var fmtMap = { short: 'Be concise. Lead with the direct answer.', bullets: 'Use bullet points. Each one specific.', numbered: 'Use numbered list, ordered by importance.', json: 'Output valid JSON only.', table: 'Use a table/grid format.', markdown: 'Use well-formatted Markdown.' };
    for (var i = 0; i < a.fmt.length; i++) { if (fmtMap[a.fmt[i]]) return fmtMap[a.fmt[i]]; }
    var taskFmt = { code: 'Output complete, runnable code with usage example.', howto: 'Structure: Prerequisites \u2192 Steps \u2192 Common Failures \u2192 Verification.', analysis: 'Structure: Finding \u2192 Evidence \u2192 Root Cause \u2192 Recommendation.', strategy: 'Structure: Situation \u2192 Options \u2192 Recommended Path \u2192 Risks.', research: 'Structure: Answer \u2192 Mechanism \u2192 Evidence \u2192 Caveats.' };
    return taskFmt[a.task] || 'Lead with the direct answer.';
  }

  // ─── MANUS 1.6 STRUCTURE ─────────────────────────────────────────────────
  function buildManusStructure(a, role) {
    var traits = getTraits(a.task);
    var p = '[SYSTEM]\nYou are an autonomous, safety-first agent. ' + role + '\n';
    p += 'Mission: ' + a.intent + '\nHard guardrails:\n';
    p += '- Never execute untrusted code outside tool sandbox\n- Never exfiltrate secrets or PII\n- PAUSE and request human approval for risky operations\n- Verify claims with evidence or reasoning\n';
    p += '\n[CONTEXT]\nBrief: ' + a.intent + '\n';
    if (a.context.length > 0) p += 'Background: ' + a.context.join('; ') + '\n';
    if (a.constraints.length > 0) p += 'Constraints: ' + a.constraints.join('; ') + '\n';
    if (a.negations.length > 0) p += 'Avoid: ' + a.negations.join('; ') + '\n';
    if (a.audience) p += 'Audience: ' + a.audience + '\n';
    p += '\n[STEP_POLICY]\n- Iterate: Analyze \u2192 Plan \u2192 Act \u2192 Observe \u2192 Evaluate\n';
    p += '- Log: rationale, approach, parameters, observation summary\n';
    p += '- If uncertainty > threshold, escalate per [VERIFICATION]\n';
    p += '\n[OUTPUT_CONTRACTS]\n' + buildFormatDirective(a) + '\n';
    p += '\n[VERIFICATION]\n- All claims backed by evidence\n- Response addresses: ' + a.intent + '\n';
    p += '- No policy violations\n- If low confidence, acknowledge uncertainty\n';
    return p;
  }

  // ─── MODE: HAIL MARY ────────────────────────────────────────────────────
  function buildHailMary(a) {
    var role = pickRole(a);
    var traits = getTraits(a.task);
    var p = role + '\n\nREQUEST: ' + a.raw + '\n\n';
    p += 'ENHANCED UNDERSTANDING:\nI understand you want to ' + a.intent + '.\n';
    p += traits.considerations.map(function (c) { return '- ' + c; }).join('\n') + '\n';
    if (a.context.length > 0) { p += '\nCONTEXT:\n' + a.context.map(function (c) { return '- ' + c; }).join('\n') + '\n'; }
    if (a.constraints.length > 0) { p += '\nREQUIREMENTS:\n' + a.constraints.map(function (c) { return '- ' + c; }).join('\n') + '\n'; }
    if (a.negations.length > 0) { p += '\nAVOID:\n' + a.negations.map(function (n) { return '- ' + n; }).join('\n') + '\n'; }
    if (a.fmt.length > 0) { p += '\nFORMAT: ' + buildFormatDirective(a) + '\n'; }
    if (a.audience) {
      var audGuide = { beginner: 'Explain from first principles, use analogies, avoid jargon.', expert: 'Skip basics, use precise terminology, go deep on nuances.', developer: 'Provide working code examples, be precise on technical details.', executive: 'Lead with impact and decisions, be concise.' };
      p += '\nAUDIENCE: ' + (audGuide[a.audience] || a.audience) + '\n';
    }
    p += '\nCOMPLEXITY: ' + a.complexity.toUpperCase() + '\n';
    p += '\nQUALITY STANDARDS:\n- Accuracy and completeness\n- Specific, actionable information\n- Logical structure\n- Examples where helpful\n';
    return p;
  }

  // ─── MODE: MANUS ─────────────────────────────────────────────────────────
  function buildManus(a) {
    var role = pickRole(a);
    var traits = getTraits(a.task);
    var p = buildManusStructure(a, role) + '\n\n';
    p += 'ORCHESTRATION PHASES:\n';
    traits.phases.forEach(function (ph, i) { p += 'Phase ' + (i + 1) + ': ' + ph + '\n'; });
    p += '\nComplete each phase fully before proceeding. Show your work.';
    return p;
  }

  // ─── MODE: JUMA ──────────────────────────────────────────────────────────
  function buildJuma(a) {
    var role = pickRole(a);
    var p = buildManusStructure(a, role) + '\n\n';
    p += 'MULTI-PERSPECTIVE REASONING:\n';
    p += 'OPTIMIST: Strengths, opportunities, positive outcomes\n';
    p += 'SKEPTIC: Flaws, risks, potential failures\n';
    p += 'PRAGMATIST: Practical implementation and constraints\n';
    p += 'INNOVATOR: Unconventional approaches and creative solutions\n\n';
    p += 'SYNTHESIS: Analyze through each lens, find common themes and contradictions, synthesize into balanced response with clear recommendations.\n';
    return p;
  }

  // ─── MODE: OPENMANUS ─────────────────────────────────────────────────────
  function buildOpenManus(a) {
    var role = pickRole(a);
    var p = '[SYSTEM]\nYou are OpenManus, an autonomous ReAct agent with MCP tool integration. ' + role + '\n';
    p += 'Mission: ' + a.intent + '\n\n';
    p += '[MCP TOOLS FRAMEWORK]\nOperate in continuous Think \u2192 Act \u2192 Observe loop.\n\n';
    p += 'AVAILABLE MCP SERVERS:\n';
    p += '- FileSystem (read_file, write_file, search_dir)\n- Web (browser_navigate, extract_dom, search_web)\n';
    p += '- Code (execute_python, run_bash)\n- API (fetch_rest, query_graphql)\n\n';
    p += 'REACT PROTOCOL:\n1. THOUGHT: Break down goal. What is needed next?\n';
    p += '2. ACTION: Call MCP tool — { "tool": "name", "parameters": { ... } }\n';
    p += '3. OBSERVATION: Process output. Self-correct on errors.\n4. REPEAT until mission accomplished.\n\n';
    if (a.context.length > 0) p += 'Background: ' + a.context.join('; ') + '\n';
    if (a.constraints.length > 0) p += 'Constraints: ' + a.constraints.join('; ') + '\n';
    p += '\nOutline your complete plan before first action. Begin the ReAct loop.\n';
    return p;
  }

  // ─── VAGUE PROMPT ENHANCER ───────────────────────────────────────────────
  function enhanceVaguePrompt(a) {
    var role = pickRole(a);
    var traits = getTraits(a.task);
    var p = role + '\n\nI need to help with: "' + a.raw + '"\n\n';
    p += 'Since this is a brief request, let me clarify:\n';
    p += '- What specific outcome are you looking for?\n- What context should I know?\n- Any constraints or requirements?\n- What format would be most helpful?\n\n';
    if (a.task !== 'general') {
      p += 'For ' + a.task + ' requests, specify:\n' + traits.requirements.map(function (r) { return '- ' + r; }).join('\n') + '\n';
    }
    p += '\nOnce you provide details, I can give a comprehensive response.';
    return p;
  }

  // ─── PROMPT BUILDER ──────────────────────────────────────────────────────
  function buildPrompt(a, depth, mode, k) {
    var result;

    if (a.wc < 5 || a.amb >= 2) {
      result = enhanceVaguePrompt(a);
    } else if (depth >= 3) {
      result = selectBrain(a, depth);
    } else {
      var builders = { manus: buildManus, juma: buildJuma, openmanus: buildOpenManus };
      result = (builders[mode] || buildHailMary)(a);
    }

    if (depth >= 3 && k && k.techniques && k.techniques.length > 0) {
      var contextualTechs = selectContextualTechniques(a, k);
      contextualTechs.slice(0, 3).forEach(function (ct) {
        if (ct.technique.instruction && ct.technique.instruction.length > 20) {
          result += '\n\nAdaptive technique (' + ct.score.toFixed(2) + '): ' + ct.technique.instruction.slice(0, 150).trim();
        }
      });
    }

    if (depth >= 4) {
      var agents = simulateMultiAgent(a).slice(0, 2);
      result += '\n\n[MULTI-AGENT PERSPECTIVES]\n';
      agents.forEach(function (agent) { result += '\n' + agent.agent + ': ' + agent.prompt + '\n'; });
    }

    if (depth >= 3) result += generateSelfReflection(a);

    a.qualityScore = scorePromptQuality(a);
    return result;
  }

  // ─── AUTO ROUTER ─────────────────────────────────────────────────────────
  var AUTO_ROUTES = { code: 'manus', math: 'manus', howto: 'manus', summarize: 'manus', research: 'juma', analysis: 'juma', creative: 'juma', brainstorm: 'juma', strategy: 'hailmary', persuade: 'hailmary', general: 'hailmary' };

  function autoRoute(a) { return AUTO_ROUTES[a.task] || 'hailmary'; }

  // ─── MAIN ENHANCE ───────────────────────────────────────────────────────
  function run(raw, mode, opts, k) {
    if (!raw || !raw.trim()) throw new Error('Prompt cannot be empty');
    var depth = Math.max(1, Math.min(5, parseInt(opts.depth, 10) || 4));
    var t0 = Date.now();
    var a = analyze(raw);
    if (!session.firstFP) session.firstFP = a.fp;
    boost(a.task);
    var resolvedMode = mode === 'auto' ? autoRoute(a) : mode;
    var enhanced = buildPrompt(a, depth, resolvedMode, k);

    var techCount = enhanced.split('\n\n').filter(function (p) { return p.trim().length > 0; }).length;
    var origW = raw.trim().split(/\s+/).length;
    var enhW = enhanced.trim().split(/\s+/).length;
    var qualityScore = a.qualityScore || scorePromptQuality(a);
    var techniquesUsed = ['role', 'taskDecl', 'reasoning', 'domainStd', 'depthEsc', 'audienceCal', 'qualityBar', 'specificity', 'format', 'multiAgent', 'selfReflection', 'adaptiveTech'].slice(0, techCount);
    updateMetaLearning(a.signature, techniquesUsed, qualityScore);

    return buildResult(raw, enhanced, resolvedMode, mode === 'auto', techniquesUsed, a, qualityScore, origW, enhW, techCount, depth, t0, k);
  }

  function buildResult(raw, enhanced, resolvedMode, autoRouted, techniques, a, qualityScore, origW, enhW, techCount, depth, t0, k) {
    return {
      original: raw,
      enhanced: enhanced,
      mode: resolvedMode,
      autoRouted: autoRouted,
      techniques: techniques,
      analysis: { task: a.task, domains: a.domains, complexity: a.complexity, intent: a.intent, isVague: a.amb >= 3, qualityScore: qualityScore, signature: a.signature },
      stats: {
        originalTokens: Math.ceil(origW * 1.3),
        enhancedTokens: Math.ceil(enhW * 1.3),
        powerMultiplier: (enhW / Math.max(origW, 1)).toFixed(1),
        techniqueCount: techCount,
        duration: Date.now() - t0,
        depth: depth,
        knowledgeUsed: k && k.techniques ? k.techniques.length : 0,
        intelligenceLevel: session.current.toFixed(2),
        metaLearningActive: Object.keys(metaLearn.techniqueWeights).length > 0,
        adaptiveTechniquesUsed: depth >= 3
      }
    };
  }

  // ─── PUTER.JS ENHANCE ───────────────────────────────────────────────────
  function enhanceWithPuter(raw, a, depth, mode, opts, k, t0) {
    var structuralTemplate = buildPrompt(a, depth, mode, k);
    var enhancementPrompt = 'You are an expert prompt engineer. Enhance this prompt for better AI results.\n\n';
    enhancementPrompt += 'Original: "' + raw + '"\nTask: ' + a.task + ' | Intent: ' + a.intent + ' | Complexity: ' + a.complexity + '\n';
    if (a.domains.length > 0) enhancementPrompt += 'Domains: ' + a.domains.join(', ') + '\n';
    enhancementPrompt += '\n=== BASE FRAMEWORK ===\n' + structuralTemplate + '\n\n';
    enhancementPrompt += '=== INSTRUCTIONS ===\n1. Do NOT just repeat the framework — use it as structural guide.\n2. Expand with specific, deep details.\n3. Ensure enhanced prompt is actionable, complete, and advanced.\n\nOutput ONLY the final enhanced prompt text.';

    return new Promise(function (resolve) {
      puter.ai.chat(enhancementPrompt, { model: 'gpt-5.2', max_tokens: 4000, temperature: 0.7 })
        .then(function (response) {
          var enhanced = (response.message && response.message.content) || response.toString() || raw;
          var origW = raw.trim().split(/\s+/).length;
          var enhW = enhanced.trim().split(/\s+/).length;
          var techCount = enhanced.split('\n\n').filter(function (p) { return p.trim().length > 0; }).length;
          var qualityScore = a.qualityScore || scorePromptQuality(a);
          var techniques = ['ai-enhanced', 'role', 'task', 'context', 'format', 'quality'].slice(0, Math.min(techCount, 6));
          updateMetaLearning(a.signature, techniques, qualityScore);
          resolve(buildResult(raw, enhanced, mode, mode === 'auto', techniques, a, qualityScore, origW, enhW, techCount, depth, t0, k));
        })
        .catch(function () {
          resolve(run(raw, mode, opts || {}, k));
        });
    });
  }

  // ─── TURNS GENERATOR ─────────────────────────────────────────────────────
  function buildTurns(raw, numTurns) {
    var a = analyze(raw);
    var h = Math.abs(parseInt(a.fp, 36) || 0);
    var turns = [];

    var arcPhases = numTurns === 6
      ? ['establish', 'deepen', 'apply', 'challenge', 'synthesize', 'close']
      : numTurns === 8
        ? ['establish', 'foundation', 'deepen', 'apply', 'problems', 'challenge', 'advanced', 'close']
        : ['establish', 'foundation', 'context', 'deepen', 'apply', 'problems', 'challenge', 'advanced', 'synthesize', 'close'];

    var stakes = { code: 'I am building a production system', research: 'I am building genuine understanding', strategy: 'I am making real decisions', analysis: 'I am working with actual data' };

    var codeQs = [
      'Show me the actual implementation with error handling and edge cases.',
      'What are the performance implications and how do you optimize?',
      'How do you test this? What are the critical test cases?'
    ];
    var researchQs = [
      'What is the evidence base? Cite specific studies, mechanisms, effect sizes.',
      'Where is there consensus versus ongoing debate?',
      'What are the known limitations and gaps?'
    ];
    var strategyQs = [
      'Walk me through a real example. What were the key decisions?',
      'What are the tradeoffs with this approach?',
      'How do you know if this is working? Leading indicators?'
    ];

    for (var i = 0; i < numTurns; i++) {
      var phase = arcPhases[i] || 'deepen';
      var text = '';

      if (i === 0) {
        text = (stakes[a.task] || 'I need to understand this properly') + '. I will ask ' + numTurns + ' questions.\n\nStart by explaining ' + a.intent + ' from first principles.';
      } else if (i === 1) {
        text = a.task === 'code' ? 'Explain the architecture. How do components interact? Data flows, state management, key interfaces?' : 'Break down how ' + a.intent + ' actually works — the mechanics, not just what it is.';
      } else if (i === 2 && numTurns >= 8) {
        text = 'Context: ' + (a.context.length > 0 ? a.context[0] : 'I am working in a real environment with constraints') + '. How does this change the approach?';
      } else if (phase === 'deepen' || phase === 'apply') {
        var qs = a.task === 'code' ? codeQs : a.task === 'research' ? researchQs : a.task === 'strategy' ? strategyQs : ['Go deeper on ' + a.intent + '. What separates expert from beginner understanding?'];
        text = qs[(h + i) % qs.length];
      } else if (phase === 'problems' || phase === 'challenge') {
        text = a.task === 'code' ? 'What breaks in production? Failure modes, race conditions, security issues, edge cases.' : a.task === 'research' ? 'Devil\'s advocate. What is the strongest counterargument?' : 'What are the failure modes? Where does this approach break down?';
      } else if (phase === 'advanced') {
        text = 'What do practitioners with years of experience know about ' + a.intent + ' that docs don\'t cover?';
      } else if (phase === 'synthesize') {
        text = 'Synthesize everything. 5-7 most important takeaways. What mental model should I internalize?';
      } else if (i === numTurns - 1) {
        text = 'Final: Based on everything, give me a concrete action plan. Exact next steps, in order.';
      } else {
        var deepQs = ['What nuance am I missing? What do most people get wrong?', 'How does this connect to related concepts? The bigger picture?', 'What would you do differently starting from scratch today?'];
        text = deepQs[(h + i) % deepQs.length];
      }

      turns.push({ number: i + 1, phase: phase, text: text });
    }
    return turns;
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────────────
  return {
    enhance: function (raw, mode, persona, opts) {
      return new Promise(function (resolve, reject) {
        loadKnowledge(function (k) {
          try {
            var depth = Math.max(1, Math.min(5, parseInt((opts || {}).depth, 10) || 4));
            var t0 = Date.now();
            var a = analyze(raw);
            if (!session.firstFP) session.firstFP = a.fp;
            boost(a.task);
            var resolvedMode = mode === 'auto' ? autoRoute(a) : mode;

            if (typeof puter !== 'undefined' && puter.ai) {
              enhanceWithPuter(raw, a, depth, resolvedMode, opts || {}, k, t0)
                .then(function (result) { record({ task: result.analysis.task, domains: result.analysis.domains, techniques: result.techniques }); resolve(result); })
                .catch(function () { var result = run(raw, mode, opts || {}, k); record({ task: result.analysis.task, domains: result.analysis.domains, techniques: result.techniques }); resolve(result); });
            } else {
              var result = run(raw, mode, opts || {}, k);
              record({ task: result.analysis.task, domains: result.analysis.domains, techniques: result.techniques });
              resolve(result);
            }
          } catch (e) { reject(e); }
        });
      });
    },
    generateTurns: function (raw, numTurns) {
      return new Promise(function (resolve, reject) {
        try {
          var n = [6, 8, 10].includes(numTurns) ? numTurns : 8;
          var turns = buildTurns(raw, n);
          var a = analyze(raw);
          resolve({ turns: turns, count: turns.length, topic: a.intent, task: a.task, domains: a.domains });
        } catch (e) { reject(e); }
      });
    },
    getModeLabel: function (mode) {
      return { hailmary: '\u2604\ufe0f Hail Mary', manus: '\u{1f9e0} Manus', juma: '\u26a1 Juma', openmanus: '\u{1f6e0}\ufe0f OpenManus', auto: '\u{1f916} Auto', turns: '\u{1f504} Turns' }[mode] || mode;
    },
    getKnowledgeStatus: function () {
      return { sessionIntelligence: session.current, enhancementCount: session.count, knowledgeCached: kCache ? kCache.techniques.length : 0, metaLearningPatterns: Object.keys(metaLearn.techniqueWeights).length, qualityHistorySize: metaLearn.qualityHistory.length, adaptiveThreshold: metaLearn.adaptiveThreshold };
    },
    recordFeedback: function (signature, techniques, successRating) {
      updateMetaLearning(signature, techniques, successRating);
    }
  };
}());
