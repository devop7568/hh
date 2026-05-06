/*
 * Prompting Pro Core Engine
 * -----------------------------------------------------------------------------
 * This file now provides a runtime-agnostic prompting system designed for
 * Chrome extension usage (popup/options/background/content), while still being
 * usable in Node-based tooling.
 */

const fs = require('fs');
const path = require('path');

const ENGINE_VERSION = '3.0.0';

const MODEL_BLUEPRINTS = {
  promptcraft: {
    id: 'promptcraft',
    title: 'PromptCraft Structured Kernel',
    principles: [
      'Explicit structure before generation',
      'Hard constraints with measurable acceptance tests',
      'Output schema guarantees'
    ],
    sequence: ['context', 'role', 'mission', 'constraints', 'format', 'quality_gates'],
    defaultWeight: 0.34
  },
  juma: {
    id: 'juma',
    title: 'Juma Conversational Planner',
    principles: [
      'Planner-first conversational decomposition',
      'Alternatives and trade-off tables',
      'Human-like flow with execution checkpoints'
    ],
    sequence: ['goal', 'clarifications', 'approach_options', 'selected_path', 'execution_steps'],
    defaultWeight: 0.33
  },
  openmanus: {
    id: 'openmanus',
    title: 'OpenManus Agentic Loop',
    principles: [
      'Plan -> Act -> Reflect loops',
      'Tool-aware execution traces',
      'Self-critique and verification before finalization'
    ],
    sequence: ['plan', 'act', 'observe', 'reflect', 'verify', 'finalize'],
    defaultWeight: 0.33
  }
};

const DEFAULT_PROFILE_MAP = {
  lucario: {
    title: 'Lucario OP Fusion',
    blend: { promptcraft: 0.36, juma: 0.28, openmanus: 0.36 },
    qualityTargets: ['factual precision', 'execution speed', 'production readiness']
  },
  trinity: {
    title: 'Trinity Balanced Fusion',
    blend: { promptcraft: 0.34, juma: 0.33, openmanus: 0.33 },
    qualityTargets: ['balanced planning', 'clarity', 'verification coverage']
  },
  promptcraft: {
    title: 'PromptCraft Solo',
    blend: { promptcraft: 1, juma: 0, openmanus: 0 },
    qualityTargets: ['strict formatting', 'explicit constraints', 'determinism']
  },
  juma: {
    title: 'Juma Solo',
    blend: { promptcraft: 0, juma: 1, openmanus: 0 },
    qualityTargets: ['decomposition', 'communicative flow', 'optionality']
  },
  openmanus: {
    title: 'OpenManus Solo',
    blend: { promptcraft: 0, juma: 0, openmanus: 1 },
    qualityTargets: ['agentic reliability', 'iterative verification', 'tooling checkpoints']
  }
};

const DEFAULT_OUTPUT_SPECS = {
  code: {
    name: 'Production Code',
    sections: ['architecture', 'implementation', 'tests', 'ops_notes'],
    schemaHint: '{"code":"string","instructions":"string[]","tests":"string[]"}'
  },
  prompt: {
    name: 'Enhanced Prompt',
    sections: ['executive_intent', 'constraints', 'plan', 'validation', 'delivery_format'],
    schemaHint: '{"enhanced_prompt":"string"}'
  },
  strategy: {
    name: 'Strategy Document',
    sections: ['goal', 'discovery', 'execution', 'metrics', 'risks'],
    schemaHint: '{"summary":"string","plan":"array"}'
  },
  agent: {
    name: 'Agent Workflow',
    sections: ['roles', 'state_machine', 'checkpoints', 'fallbacks'],
    schemaHint: '{"workflow":"object","gates":"array"}'
  }
};

const KEYWORD_TAXONOMY = {
  backend_api: ['api', 'endpoint', 'service', 'auth', 'schema', 'rest', 'graphql', 'validation'],
  frontend_ui: ['ui', 'component', 'ux', 'accessibility', 'dashboard', 'state', 'react', 'view'],
  automation_agent: ['agent', 'automation', 'workflow', 'orchestration', 'task', 'planner', 'executor'],
  product_strategy: ['strategy', 'roadmap', 'market', 'launch', 'kpi', 'persona', 'experiment'],
  mlops: ['mlops', 'model', 'drift', 'evaluation', 'rollback', 'feature', 'monitoring'],
  devops: ['ci', 'cd', 'pipeline', 'deploy', 'infra', 'kubernetes', 'docker', 'observability'],
  growth: ['seo', 'campaign', 'retention', 'conversion', 'funnel', 'activation'],
  docs: ['documentation', 'spec', 'guide', 'runbook', 'onboarding', 'playbook']
};

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function unique(arr) {
  return [...new Set(arr)];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function nowIso() {
  return new Date().toISOString();
}

class PromptMemoryStore {
  constructor(seed) {
    this.entries = Array.isArray(seed) ? seed.slice(0, 500) : [];
  }

  add(entry) {
    this.entries.push({ ...entry, at: entry.at || nowIso() });
    if (this.entries.length > 500) {
      this.entries.shift();
    }
  }

  findRecent(limit = 10) {
    return this.entries.slice(-limit).reverse();
  }

  summarize() {
    const types = {};
    for (const item of this.entries) {
      const key = item.type || 'unknown';
      types[key] = (types[key] || 0) + 1;
    }
    return { count: this.entries.length, types };
  }
}

class PromptDataset {
  constructor(trainingData, blueprintData) {
    this.training = trainingData || { version: 'unknown', examples: [] };
    this.blueprints = blueprintData || { version: 'unknown', blueprints: [] };
  }

  static fromFiles(trainingPath, blueprintPath) {
    const trainingData = JSON.parse(fs.readFileSync(trainingPath, 'utf8'));
    const blueprintData = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
    return new PromptDataset(trainingData, blueprintData);
  }

  validate() {
    if (!Array.isArray(this.training.examples)) {
      throw new Error('Invalid training data: examples array missing.');
    }
    if (!Array.isArray(this.blueprints.blueprints)) {
      throw new Error('Invalid blueprint data: blueprints array missing.');
    }
  }

  stats() {
    const categories = unique(this.training.examples.map((x) => x.category));
    const tags = unique(this.training.examples.flatMap((x) => x.tags || []));
    const blueprintModels = unique(this.blueprints.blueprints.map((x) => x.model));
    return {
      trainingVersion: this.training.version,
      trainingExamples: this.training.examples.length,
      categoryCount: categories.length,
      categories,
      tags,
      blueprintVersion: this.blueprints.version,
      blueprintCount: this.blueprints.blueprints.length,
      blueprintModels
    };
  }
}

class PromptTrainer {
  constructor(dataset) {
    this.dataset = dataset;
  }

  train() {
    const categoryWeights = {};
    const tokenWeights = {};
    const blueprintBias = { promptcraft: 1, juma: 1, openmanus: 1 };

    for (const ex of this.dataset.training.examples) {
      const tokenList = tokenize(`${ex.prompt} ${ex.strategy} ${(ex.quality_markers || []).join(' ')}`);
      const tagStrength = (ex.tags || []).length * 0.5;
      const qualityStrength = (ex.quality_markers || []).length * 0.75;
      const base = 1 + tagStrength + qualityStrength + tokenList.length * 0.02;
      categoryWeights[ex.category] = (categoryWeights[ex.category] || 0) + Number(base.toFixed(3));

      for (const token of tokenList) {
        tokenWeights[token] = (tokenWeights[token] || 0) + 1;
      }

      const joined = `${ex.prompt} ${ex.strategy}`.toLowerCase();
      if (joined.includes('plan') || joined.includes('loop') || joined.includes('agent')) {
        blueprintBias.openmanus += 0.05;
      }
      if (joined.includes('constraints') || joined.includes('schema') || joined.includes('format')) {
        blueprintBias.promptcraft += 0.05;
      }
      if (joined.includes('roadmap') || joined.includes('alternatives') || joined.includes('strategy')) {
        blueprintBias.juma += 0.05;
      }
    }

    const hotTokens = Object.entries(tokenWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([token, weight]) => ({ token, weight }));

    return {
      trainedAt: nowIso(),
      modelVersion: ENGINE_VERSION,
      categoryWeights,
      blueprintBias,
      hotTokens
    };
  }
}

class PromptScorer {
  static scoreCategoryFit(tokens, categoryWeights) {
    const result = [];
    for (const [category, keywords] of Object.entries(KEYWORD_TAXONOMY)) {
      const overlap = keywords.reduce((acc, k) => acc + (tokens.includes(k) ? 1 : 0), 0);
      const prior = categoryWeights?.[category] || 0;
      const score = overlap * 2 + prior * 0.1;
      result.push({ category, score });
    }
    return result.sort((a, b) => b.score - a.score);
  }

  static scoreBlueprints(rawPrompt, blueprints, categoryWeights) {
    const tokens = tokenize(rawPrompt);
    return blueprints
      .map((bp) => {
        const keywordHits = (bp.keywords || []).reduce((acc, k) => acc + (tokens.includes(String(k).toLowerCase()) ? 1 : 0), 0);
        const categoryBoost = categoryWeights?.[bp.focusCategory] || 0;
        return {
          ...bp,
          score: keywordHits * 3 + categoryBoost * 0.2
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  static scoreCandidate(candidate) {
    let score = 0;
    score += candidate.sections.includes('constraints') ? 1.5 : 0;
    score += candidate.sections.includes('validation') ? 1.5 : 0;
    score += candidate.sections.includes('execution') ? 1.2 : 0;
    score += candidate.sections.length * 0.1;
    score += Math.min(2, candidate.exampleCount * 0.35);
    return Number(score.toFixed(3));
  }
}

class PromptRenderer {
  static section(title, body) {
    return `## ${title}\n${body}`;
  }

  static bullets(items) {
    return items.map((x) => `- ${x}`).join('\n');
  }

  static numbered(items) {
    return items.map((x, i) => `${i + 1}. ${x}`).join('\n');
  }
}

class PromptingProEngine {
  constructor(options = {}) {
    this.version = ENGINE_VERSION;
    this.profileMap = { ...DEFAULT_PROFILE_MAP, ...(options.profileMap || {}) };
    this.outputSpecs = { ...DEFAULT_OUTPUT_SPECS, ...(options.outputSpecs || {}) };
    this.dataset = options.dataset || new PromptDataset({ version: 'empty', examples: [] }, { version: 'empty', blueprints: [] });
    this.memory = new PromptMemoryStore(options.memorySeed);
    this.trainingState = options.trainingState || {
      trainedAt: null,
      modelVersion: ENGINE_VERSION,
      categoryWeights: {},
      blueprintBias: { promptcraft: 1, juma: 1, openmanus: 1 },
      hotTokens: []
    };

    this.dataset.validate();
  }

  static createDefault(baseDir = __dirname) {
    const trainingPath = path.join(baseDir, 'data', 'prompt_training_data.json');
    const blueprintPath = path.join(baseDir, 'data', 'lucario_prompt_blueprints.json');
    const dataset = PromptDataset.fromFiles(trainingPath, blueprintPath);
    const engine = new PromptingProEngine({ dataset });
    return engine;
  }

  getHealth() {
    const stats = this.dataset.stats();
    return {
      ok: true,
      version: this.version,
      trainedAt: this.trainingState.trainedAt,
      memory: this.memory.summarize(),
      stats
    };
  }

  train() {
    const trainer = new PromptTrainer(this.dataset);
    this.trainingState = trainer.train();
    this.memory.add({ type: 'training', value: { trainedAt: this.trainingState.trainedAt } });
    return this.trainingState;
  }

  setTrainingState(state) {
    this.trainingState = {
      ...this.trainingState,
      ...state,
      categoryWeights: { ...(this.trainingState.categoryWeights || {}), ...(state.categoryWeights || {}) },
      blueprintBias: { ...(this.trainingState.blueprintBias || {}), ...(state.blueprintBias || {}) }
    };
  }

  enhance(input = {}) {
    const startedAt = nowIso();
    const rawPrompt = String(input.rawPrompt || '').trim();
    if (!rawPrompt) {
      throw new Error('rawPrompt is required.');
    }

    const profile = input.profile || 'lucario';
    const outputType = input.outputType || 'prompt';
    const workspace = this.normalizeWorkspace(input.workspace);
    const profileConfig = this.resolveProfile(profile);
    const tokens = tokenize(rawPrompt);

    const categoryScores = PromptScorer.scoreCategoryFit(tokens, this.trainingState.categoryWeights);
    const dominantCategories = categoryScores.slice(0, 3);
    const examples = this.pickExamples(rawPrompt, dominantCategories, input.maxExamples || 6);
    const blueprintPicks = this.pickBlueprints(rawPrompt, profileConfig, dominantCategories);
    const candidatePrompt = this.composePrompt({
      rawPrompt,
      profile,
      outputType,
      workspace,
      dominantCategories,
      examples,
      blueprintPicks,
      profileConfig
    });

    const verification = this.createVerificationSuite({ rawPrompt, outputType, dominantCategories, examples, blueprintPicks });
    const scored = PromptScorer.scoreCandidate({
      sections: candidatePrompt.sectionNames,
      exampleCount: examples.length
    });

    const result = {
      version: this.version,
      generatedAt: startedAt,
      profile,
      outputType,
      score: scored,
      enhancedPrompt: candidatePrompt.text,
      summary: {
        categories: dominantCategories,
        blueprintPicks: blueprintPicks.map((b) => ({ model: b.model, score: Number(b.score.toFixed(2)), directive: b.directive })),
        examplesUsed: examples.map((e) => ({ category: e.category, prompt: e.prompt }))
      },
      verification,
      modelPayload: this.compileModelPayload(candidatePrompt.text, outputType)
    };

    this.memory.add({ type: 'enhancement', value: { profile, outputType, score: result.score } });
    return result;
  }

  normalizeWorkspace(workspace) {
    const safe = workspace || {};
    return {
      summary: safe.summary || 'No workspace summary provided.',
      currentFile: safe.currentFile || 'n/a',
      openFiles: Array.isArray(safe.openFiles) ? safe.openFiles.slice(0, 20) : [],
      selectedCode: safe.selectedCode || '',
      dependencies: Array.isArray(safe.dependencies) ? safe.dependencies.slice(0, 25) : [],
      userConstraints: Array.isArray(safe.userConstraints) ? safe.userConstraints.slice(0, 25) : []
    };
  }

  resolveProfile(profileName) {
    const profile = this.profileMap[profileName] || this.profileMap.lucario;
    const withTrainingBias = { ...profile.blend };
    withTrainingBias.promptcraft *= this.trainingState.blueprintBias?.promptcraft || 1;
    withTrainingBias.juma *= this.trainingState.blueprintBias?.juma || 1;
    withTrainingBias.openmanus *= this.trainingState.blueprintBias?.openmanus || 1;

    const total = withTrainingBias.promptcraft + withTrainingBias.juma + withTrainingBias.openmanus;
    return {
      ...profile,
      blend: {
        promptcraft: Number((withTrainingBias.promptcraft / total).toFixed(4)),
        juma: Number((withTrainingBias.juma / total).toFixed(4)),
        openmanus: Number((withTrainingBias.openmanus / total).toFixed(4))
      }
    };
  }

  pickExamples(rawPrompt, dominantCategories, limit) {
    const tokens = tokenize(rawPrompt);
    const dominant = new Set(dominantCategories.map((x) => x.category));

    const ranked = this.dataset.training.examples
      .map((example) => {
        const promptTokens = tokenize(`${example.prompt} ${example.strategy}`);
        const overlap = promptTokens.reduce((acc, t) => acc + (tokens.includes(t) ? 1 : 0), 0);
        const categoryBoost = dominant.has(example.category) ? 4 : 0;
        const qualityBoost = (example.quality_markers || []).length * 0.5;
        return { ...example, score: overlap + categoryBoost + qualityBoost };
      })
      .sort((a, b) => b.score - a.score);

    return ranked.slice(0, clamp(limit, 1, 12));
  }

  pickBlueprints(rawPrompt, profileConfig, dominantCategories) {
    const ranked = PromptScorer.scoreBlueprints(
      rawPrompt,
      this.dataset.blueprints.blueprints,
      this.trainingState.categoryWeights
    );

    const quota = {
      promptcraft: clamp(Math.round(profileConfig.blend.promptcraft * 6), 1, 4),
      juma: clamp(Math.round(profileConfig.blend.juma * 6), 1, 4),
      openmanus: clamp(Math.round(profileConfig.blend.openmanus * 6), 1, 4)
    };

    const picks = [];
    const categoryNames = new Set(dominantCategories.map((x) => x.category));

    for (const model of ['PromptCraft', 'Juma', 'OpenManus']) {
      const key = model.toLowerCase();
      const max = quota[key] || 1;
      const fromModel = ranked
        .filter((r) => String(r.model).toLowerCase() === key)
        .sort((a, b) => {
          const aDominant = categoryNames.has(a.focusCategory) ? 1 : 0;
          const bDominant = categoryNames.has(b.focusCategory) ? 1 : 0;
          return (bDominant - aDominant) || (b.score - a.score);
        })
        .slice(0, max);
      picks.push(...fromModel);
    }

    return picks;
  }

  composePrompt({ rawPrompt, profile, outputType, workspace, dominantCategories, examples, blueprintPicks, profileConfig }) {
    const spec = this.outputSpecs[outputType] || this.outputSpecs.prompt;
    const sectionNames = [];

    const objective = PromptRenderer.section('Primary Objective', rawPrompt);
    sectionNames.push('objective');

    const profileSection = PromptRenderer.section(
      `Fusion Profile — ${profileConfig.title}`,
      [
        `Blend weights: PromptCraft ${profileConfig.blend.promptcraft}, Juma ${profileConfig.blend.juma}, OpenManus ${profileConfig.blend.openmanus}`,
        'Quality targets:',
        PromptRenderer.bullets(profileConfig.qualityTargets)
      ].join('\n')
    );
    sectionNames.push('profile');

    const workspaceSection = PromptRenderer.section(
      'Workspace Context',
      [
        `Summary: ${workspace.summary}`,
        `Current file: ${workspace.currentFile}`,
        `Open files: ${workspace.openFiles.length ? workspace.openFiles.join(', ') : 'n/a'}`,
        `Dependencies: ${workspace.dependencies.length ? workspace.dependencies.join(', ') : 'n/a'}`,
        `Selected code:\n${workspace.selectedCode || 'none'}`,
        `User constraints:\n${workspace.userConstraints.length ? PromptRenderer.bullets(workspace.userConstraints) : '- none'}`
      ].join('\n\n')
    );
    sectionNames.push('context');

    const categorySection = PromptRenderer.section(
      'Dominant Intent Categories',
      PromptRenderer.numbered(
        dominantCategories.map((c) => `${c.category} (score ${Number(c.score.toFixed(2))})`)
      )
    );
    sectionNames.push('analysis');

    const blueprintSection = PromptRenderer.section(
      'Tri-Model Blueprint Directives',
      PromptRenderer.numbered(
        blueprintPicks.map((b) => `${b.model} [${b.focusCategory}] => ${b.directive} (score ${Number(b.score.toFixed(2))})`)
      )
    );
    sectionNames.push('directives');

    const examplesSection = PromptRenderer.section(
      'Training-Informed Exemplars',
      examples
        .map((e, i) => {
          return [
            `Example ${i + 1} (${e.category})`,
            `Prompt: ${e.prompt}`,
            `Strategy: ${e.strategy}`,
            `Quality markers: ${(e.quality_markers || []).join(', ')}`
          ].join('\n');
        })
        .join('\n\n')
    );
    sectionNames.push('examples');

    const constraintsSection = PromptRenderer.section(
      'Execution Constraints',
      PromptRenderer.bullets([
        'Be explicit, deterministic, and implementation-ready.',
        'Surface assumptions; include fallback and rollback paths.',
        'Handle edge cases, validation, and observability.',
        'Prefer modular architecture with clear interfaces.',
        'Use concise but complete rationale when choosing trade-offs.'
      ])
    );
    sectionNames.push('constraints');

    const outputSpecSection = PromptRenderer.section(
      `Output Contract — ${spec.name}`,
      [
        `Required sections: ${spec.sections.join(', ')}`,
        `Schema hint: ${spec.schemaHint}`,
        'Return high-signal output with zero filler text.'
      ].join('\n')
    );
    sectionNames.push('format');

    const validationSection = PromptRenderer.section(
      'Validation + Acceptance Gates',
      PromptRenderer.numbered([
        'Check requirement coverage against objective and constraints.',
        'Run consistency pass across architecture, implementation, and tests.',
        'Verify security/performance implications are addressed.',
        'Confirm final output strictly follows output contract and schema hint.'
      ])
    );
    sectionNames.push('validation');

    const deliverySection = PromptRenderer.section(
      'Delivery Behavior',
      PromptRenderer.bullets([
        'Prefer practical implementation over abstract theory.',
        'When uncertain, surface assumptions and provide safest default.',
        'If multiple valid options exist, choose one and explain why in one concise paragraph.',
        'Never omit critical setup or verification steps.'
      ])
    );
    sectionNames.push('delivery');

    const text = [
      '# Prompting Pro Engine Output',
      `Version: ${this.version}`,
      `Profile: ${profile}`,
      `Generated at: ${nowIso()}`,
      '',
      objective,
      '',
      profileSection,
      '',
      workspaceSection,
      '',
      categorySection,
      '',
      blueprintSection,
      '',
      examplesSection,
      '',
      constraintsSection,
      '',
      outputSpecSection,
      '',
      validationSection,
      '',
      deliverySection
    ].join('\n');

    return { text, sectionNames };
  }

  createVerificationSuite({ rawPrompt, outputType, dominantCategories, examples, blueprintPicks }) {
    return {
      checklist: [
        `Objective captured: ${rawPrompt.length > 12 ? 'yes' : 'no'}`,
        `Output type configured: ${outputType}`,
        `Dominant categories detected: ${dominantCategories.map((x) => x.category).join(', ') || 'none'}`,
        `Examples injected: ${examples.length}`,
        `Blueprint directives injected: ${blueprintPicks.length}`,
        'Schema hint attached to output contract',
        'Validation gates section included'
      ],
      scoring: {
        requirementCoverageTarget: '>= 0.90',
        safetyTarget: '>= 0.85',
        clarityTarget: '>= 0.90',
        implementationReadinessTarget: '>= 0.90'
      }
    };
  }

  compileModelPayload(enhancedPrompt, outputType) {
    const system = [
      'You are Prompting Pro, a production prompt optimizer and execution planner.',
      'Follow the provided enhanced prompt exactly.',
      'Return structured output only.',
      'Avoid filler and generic statements.'
    ].join(' ');

    const taskMode = outputType === 'code'
      ? 'Return JSON: {"code":"string","instructions":"string[]","tests":"string[]"}'
      : outputType === 'agent'
        ? 'Return JSON: {"workflow":"object","gates":"string[]"}'
        : outputType === 'strategy'
          ? 'Return JSON: {"summary":"string","plan":"object[]"}'
          : 'Return JSON: {"enhanced_prompt":"string"}';

    return {
      model: 'gpt-5.1',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `${enhancedPrompt}\n\n${taskMode}` }
      ]
    };
  }

  exportState() {
    return {
      version: this.version,
      trainingState: this.trainingState,
      memory: this.memory.entries
    };
  }

  importState(state) {
    if (!state || typeof state !== 'object') {
      return;
    }
    if (state.trainingState) {
      this.setTrainingState(state.trainingState);
    }
    if (Array.isArray(state.memory)) {
      this.memory = new PromptMemoryStore(state.memory);
    }
  }
}

const chromeBridge = {
  createEngine(payload = {}) {
    const baseDir = payload.baseDir || __dirname;
    const dataset = payload.dataset
      ? new PromptDataset(payload.dataset.training, payload.dataset.blueprints)
      : PromptDataset.fromFiles(
          path.join(baseDir, 'data', 'prompt_training_data.json'),
          path.join(baseDir, 'data', 'lucario_prompt_blueprints.json')
        );

    const engine = new PromptingProEngine({
      dataset,
      trainingState: payload.trainingState,
      memorySeed: payload.memorySeed
    });

    if (!engine.trainingState?.trainedAt) {
      engine.train();
    }

    return engine;
  }
};

function createEngine(baseDir) {
  const engine = PromptingProEngine.createDefault(baseDir || __dirname);
  if (!engine.trainingState?.trainedAt) {
    engine.train();
  }
  return engine;
}

if (typeof globalThis !== 'undefined') {
  globalThis.PromptingPro = {
    ENGINE_VERSION,
    MODEL_BLUEPRINTS,
    DEFAULT_PROFILE_MAP,
    DEFAULT_OUTPUT_SPECS,
    PromptDataset,
    PromptingProEngine,
    createEngine,
    chromeBridge
  };
}

module.exports = {
  ENGINE_VERSION,
  MODEL_BLUEPRINTS,
  DEFAULT_PROFILE_MAP,
  DEFAULT_OUTPUT_SPECS,
  PromptDataset,
  PromptingProEngine,
  PromptTrainer,
  PromptScorer,
  PromptMemoryStore,
  createEngine,
  chromeBridge
};
