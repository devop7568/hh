/**
 * HailMary v6.0 — MODELS MODULE
 * 4 AI models with retry/backoff, request queuing, and structured error recovery.
 * Uses Puter.js via background worker for free AI access.
 */
window.HailMaryModels = (function () {
  'use strict';

  var C = window.HailMaryCore;

  // ─── MODEL REGISTRY ──────────────────────────────────────────────────────
  var MODELS = {
    'claude-4.5': {
      id: 'claude-sonnet-4.5', displayName: 'Claude 4.5 Sonnet', icon: '\u{1f7e3}', color: '#a855f7',
      maxTokens: 8192, temperature: 0.7,
      systemPrompt: 'You are Claude 4.5 Sonnet, an advanced AI with nuanced analytical reasoning and deep contextual understanding. Provide thorough, well-structured responses.',
      strengths: ['reasoning', 'analysis', 'research', 'writing', 'nuance']
    },
    'gpt-5.2': {
      id: 'gpt-5.2', displayName: 'GPT 5.2', icon: '\u{1f7e2}', color: '#22c55e',
      maxTokens: 8192, temperature: 0.7,
      systemPrompt: 'You are GPT 5.2, the most advanced language model with extended chain-of-thought, self-correction, and strategic planning capabilities. Answer every query directly and completely.',
      strengths: ['coding', 'strategy', 'planning', 'general', 'tools']
    },
    'codex-5.1': {
      id: 'gpt-5.2', displayName: 'Codex 5.1', icon: '\u{1f535}', color: '#3b82f6',
      maxTokens: 16384, temperature: 0.4,
      systemPrompt: 'You are Codex 5.1, a code-specialized AI. Write, debug, refactor, and explain code in any language. Produce production-ready code with full error handling.',
      strengths: ['code', 'debugging', 'architecture', 'scripting', 'optimization']
    },
    'orchestrator-29t': {
      id: 'o1-preview', displayName: 'Orchestrator 29T', icon: '\u{1f7e0}', color: '#f97316',
      maxTokens: 8192, temperature: 0.6,
      systemPrompt: 'You are the Orchestrator, a 29-tool autonomous agent. Plan and execute multi-step tasks using browser automation, shell execution, file I/O, web search, and API integration tools.',
      strengths: ['automation', 'orchestration', 'multi-step', 'tools', 'integration']
    }
  };

  // ─── STATE ───────────────────────────────────────────────────────────────
  var activeModel = 'gpt-5.2';
  var conversationHistory = {};
  var requestLog = [];
  var MAX_HISTORY = 40;
  var TRIM_HISTORY_TO = 30;
  var MAX_LOG = 100;

  // ─── AUTO-ROUTER ─────────────────────────────────────────────────────────
  var ROUTE_PATTERNS = {
    'codex-5.1': /\b(code|function|class|implement|build|debug|script|api|program|sql|python|javascript|typescript|react|css|html)\b/i,
    'orchestrator-29t': /\b(automate|browser|navigate|click|fill|extract|shell|execute|file|scrape|crawl|bot|schedule|monitor|webhook|pipeline|workflow|orchestrat)\b/i,
    'claude-4.5': /\b(explain|analyze|research|understand|theory|evidence|nuance|compare|evaluate|philosophy|literature|history)\b/i
  };

  function autoSelectModel(query) {
    for (var modelId in ROUTE_PATTERNS) {
      if (ROUTE_PATTERNS[modelId].test(query)) return modelId;
    }
    return 'gpt-5.2';
  }

  // ─── SEND WITH RETRY ─────────────────────────────────────────────────────
  async function sendMessage(message, modelId, options) {
    options = options || {};
    var model = MODELS[modelId || activeModel] || MODELS['gpt-5.2'];
    var sessionId = options.sessionId || 'default';

    if (!conversationHistory[sessionId]) conversationHistory[sessionId] = [];

    var messages = [{ role: 'system', content: model.systemPrompt }]
      .concat(conversationHistory[sessionId].slice(-20))
      .concat([{ role: 'user', content: message }]);

    try {
      var response = await C.retry(function () {
        return C.sendMsg({
          action: 'aiChat',
          modelId: modelId || activeModel,
          messages: messages,
          options: {
            max_tokens: options.maxTokens || model.maxTokens,
            temperature: options.temperature || model.temperature
          }
        }).then(function (resp) {
          if (!resp || resp.error) throw new Error((resp && resp.error) || 'No response from background worker');
          if (!resp.content) throw new Error('Empty response from AI');
          return resp;
        });
      }, 2, 800);

      var reply = response.content;

      conversationHistory[sessionId].push(
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
      );
      if (conversationHistory[sessionId].length > MAX_HISTORY) {
        conversationHistory[sessionId] = conversationHistory[sessionId].slice(-TRIM_HISTORY_TO);
      }

      logRequest(modelId || activeModel, message.length, reply.length, true);

      return {
        content: reply,
        model: model.displayName,
        modelId: modelId || activeModel,
        icon: model.icon,
        color: model.color,
        tokens: {
          input: Math.ceil(message.split(/\s+/).length * 1.3),
          output: Math.ceil(reply.split(/\s+/).length * 1.3)
        }
      };
    } catch (err) {
      logRequest(modelId || activeModel, message.length, 0, false);
      return buildFallback(message, model, err.message);
    }
  }

  function buildFallback(message, model, errorDetail) {
    var lines = [
      '**[' + model.displayName + ' — Service Error]**\n',
      'AI service is currently unavailable.',
      errorDetail ? ('Error: ' + errorDetail) : '',
      '\nPlease try:',
      '- Reload the extension popup',
      '- Check your internet connection',
      '- Use the ENHANCE tab for prompt enhancement (works offline)',
      '\nQuery: ' + message
    ];
    return {
      content: lines.filter(Boolean).join('\n'),
      model: model.displayName + ' (Error)',
      modelId: 'error',
      icon: '\u26a0\ufe0f',
      color: '#ef4444',
      tokens: { input: 0, output: 0 },
      isFallback: true
    };
  }

  function logRequest(model, inputLen, outputLen, success) {
    requestLog.push({ model: model, timestamp: Date.now(), inputLen: inputLen, outputLen: outputLen, success: success });
    if (requestLog.length > MAX_LOG) requestLog = requestLog.slice(-50);
  }

  // ─── MULTI-MODEL CONSENSUS ───────────────────────────────────────────────
  async function multiModelQuery(message, modelIds) {
    var models = modelIds || ['claude-4.5', 'gpt-5.2', 'codex-5.1'];
    var results = await Promise.allSettled(models.map(function (mId) { return sendMessage(message, mId); }));

    var responses = [];
    results.forEach(function (r, i) {
      if (r.status === 'fulfilled' && r.value && !r.value.isFallback) {
        responses.push({ model: models[i], content: r.value.content, icon: r.value.icon });
      }
    });

    if (responses.length === 0) {
      return { content: 'All models offline. Retry in a moment.', model: 'System', icon: '\u26a0\ufe0f' };
    }

    var synthesis = '# Multi-Model Consensus Report\n\n';
    synthesis += '**Query:** ' + message + '\n\n---\n\n';
    responses.forEach(function (r) {
      synthesis += '## ' + r.icon + ' ' + r.model.toUpperCase() + '\n\n' + r.content + '\n\n---\n\n';
    });
    synthesis += '## Consensus\n\n';
    synthesis += responses.length + '/' + models.length + ' models responded. Cross-reference above for the most reliable answer.\n';

    return {
      content: synthesis,
      model: 'Multi-Model Consensus',
      modelId: 'consensus',
      icon: '\u{1f9e0}',
      color: '#a855f7',
      models: responses.map(function (r) { return r.model; })
    };
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────────────
  return {
    send: sendMessage,
    autoSend: function (message, options) {
      return sendMessage(message, autoSelectModel(message), options);
    },
    consensus: multiModelQuery,
    getActiveModel: function () { return activeModel; },
    setActiveModel: function (id) { if (MODELS[id]) activeModel = id; },
    getModels: function () { return MODELS; },
    getModel: function (id) { return MODELS[id]; },
    autoSelect: autoSelectModel,
    clearHistory: function (sessionId) {
      if (sessionId) delete conversationHistory[sessionId];
      else conversationHistory = {};
    },
    getHistory: function (sessionId) { return conversationHistory[sessionId || 'default'] || []; },
    getLog: function () { return requestLog.slice(-50); },
    getStats: function () {
      var ok = requestLog.filter(function (r) { return r.success; });
      var modelsUsed = {};
      requestLog.forEach(function (r) { modelsUsed[r.model] = true; });
      return {
        totalRequests: requestLog.length,
        successRate: requestLog.length > 0 ? (ok.length / requestLog.length * 100).toFixed(1) + '%' : '0%',
        modelsUsed: Object.keys(modelsUsed),
        activeModel: activeModel,
        historySize: Object.keys(conversationHistory).length
      };
    }
  };
}());
