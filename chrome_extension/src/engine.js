export const ENGINE_VERSION = '3.0.0';

const PROFILE_MAP = {
  lucario: { blend: { promptcraft: 0.36, juma: 0.28, openmanus: 0.36 }, label: 'Lucario OP Fusion' },
  trinity: { blend: { promptcraft: 0.34, juma: 0.33, openmanus: 0.33 }, label: 'Trinity Fusion' },
  promptcraft: { blend: { promptcraft: 1, juma: 0, openmanus: 0 }, label: 'PromptCraft' },
  juma: { blend: { promptcraft: 0, juma: 1, openmanus: 0 }, label: 'Juma' },
  openmanus: { blend: { promptcraft: 0, juma: 0, openmanus: 1 }, label: 'OpenManus' }
};

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function top(arr, n) {
  return arr.slice(0, n);
}

function normalizeWorkspace(workspace = {}) {
  return {
    summary: workspace.summary || 'No workspace summary available.',
    url: workspace.url || location.href,
    title: workspace.title || document.title,
    selectedText: workspace.selectedText || '',
    constraints: Array.isArray(workspace.constraints) ? workspace.constraints : []
  };
}

function scoreExamples(rawPrompt, examples = []) {
  const tokens = tokenize(rawPrompt);
  return examples
    .map((x) => {
      const overlap = tokenize(`${x.prompt} ${x.strategy}`).reduce((acc, t) => acc + (tokens.includes(t) ? 1 : 0), 0);
      const quality = (x.quality_markers || []).length * 0.5;
      return { ...x, score: overlap + quality };
    })
    .sort((a, b) => b.score - a.score);
}

function scoreBlueprints(rawPrompt, blueprints = [], weights = {}) {
  const tokens = tokenize(rawPrompt);
  return blueprints
    .map((x) => {
      const keywordScore = (x.keywords || []).reduce((acc, k) => acc + (tokens.includes(String(k).toLowerCase()) ? 1 : 0), 0);
      const weightBoost = (weights[x.focusCategory] || 0) * 0.15;
      return { ...x, score: keywordScore * 2 + weightBoost };
    })
    .sort((a, b) => b.score - a.score);
}

function profilePicks(scoredBlueprints, profile) {
  const cfg = PROFILE_MAP[profile] || PROFILE_MAP.lucario;
  const quotas = {
    promptcraft: Math.max(1, Math.round(cfg.blend.promptcraft * 4)),
    juma: Math.max(1, Math.round(cfg.blend.juma * 4)),
    openmanus: Math.max(1, Math.round(cfg.blend.openmanus * 4))
  };

  const picks = [];
  for (const [model, quota] of Object.entries(quotas)) {
    picks.push(
      ...scoredBlueprints
        .filter((x) => String(x.model).toLowerCase() === model)
        .slice(0, quota)
    );
  }
  return picks;
}

function buildPrompt({ rawPrompt, profile, outputType, workspace, examples, blueprints }) {
  const sections = [];
  const profileCfg = PROFILE_MAP[profile] || PROFILE_MAP.lucario;

  sections.push('# Prompting Pro Chrome Enhancement');
  sections.push(`Version: ${ENGINE_VERSION}`);
  sections.push(`Profile: ${profileCfg.label}`);
  sections.push('');

  sections.push('## Objective');
  sections.push(rawPrompt);
  sections.push('');

  sections.push('## Profile Blend');
  sections.push(`PromptCraft: ${profileCfg.blend.promptcraft}`);
  sections.push(`Juma: ${profileCfg.blend.juma}`);
  sections.push(`OpenManus: ${profileCfg.blend.openmanus}`);
  sections.push('');

  sections.push('## Workspace');
  sections.push(`URL: ${workspace.url}`);
  sections.push(`Title: ${workspace.title}`);
  sections.push(`Summary: ${workspace.summary}`);
  sections.push(`Selection: ${workspace.selectedText || 'none'}`);
  sections.push('');

  sections.push('## Tri-Model Directives');
  blueprints.forEach((bp, i) => {
    sections.push(`${i + 1}. [${bp.model}] ${bp.directive} (score: ${bp.score.toFixed(2)})`);
  });
  sections.push('');

  sections.push('## Training Exemplars');
  examples.forEach((ex, i) => {
    sections.push(`${i + 1}. (${ex.category}) ${ex.prompt}`);
    sections.push(`   Strategy: ${ex.strategy}`);
    sections.push(`   Markers: ${(ex.quality_markers || []).join(', ')}`);
  });
  sections.push('');

  sections.push('## Constraints');
  sections.push('- Give implementation-ready output with explicit assumptions.');
  sections.push('- Include validation and edge-case handling.');
  sections.push('- Use concise language and deterministic formatting.');
  workspace.constraints.forEach((c) => sections.push(`- User constraint: ${c}`));
  sections.push('');

  sections.push('## Output Contract');
  if (outputType === 'code') {
    sections.push('Return JSON {"code":"string","instructions":"string[]","tests":"string[]"}.');
  } else if (outputType === 'agent') {
    sections.push('Return JSON {"workflow":"object","gates":"string[]"}.');
  } else if (outputType === 'strategy') {
    sections.push('Return JSON {"summary":"string","plan":"object[]"}.');
  } else {
    sections.push('Return JSON {"enhanced_prompt":"string"}.');
  }
  sections.push('');

  sections.push('## Validation Gates');
  sections.push('1. Requirement coverage check.');
  sections.push('2. Safety/performance check.');
  sections.push('3. Schema compliance check.');
  sections.push('4. Actionability check.');

  return sections.join('\n');
}

export function trainModel(trainingData = { examples: [] }) {
  const weights = {};
  for (const ex of trainingData.examples || []) {
    const score = 1 + (ex.tags || []).length * 0.5 + (ex.quality_markers || []).length * 0.7;
    weights[ex.category] = (weights[ex.category] || 0) + Number(score.toFixed(2));
  }
  return {
    trainedAt: new Date().toISOString(),
    categoryWeights: weights
  };
}

function scorePlaybooks(rawPrompt, playbooks = []) {
  const tokens = tokenize(rawPrompt);
  return playbooks
    .map((entry) => {
      const overlap = (entry.tags || []).reduce((acc, tag) => acc + (tokens.includes(String(tag).toLowerCase()) ? 1 : 0), 0);
      return { ...entry, score: overlap + (entry.quality_gates || []).length * 0.4 };
    })
    .sort((a, b) => b.score - a.score);
}

export function enhancePrompt({
  rawPrompt,
  profile = 'lucario',
  outputType = 'prompt',
  workspace,
  trainingData,
  blueprintData,
  playbookData,
  trained
}) {
  if (!rawPrompt || !String(rawPrompt).trim()) {
    throw new Error('rawPrompt is required');
  }

  const ws = normalizeWorkspace(workspace);
  const state = trained || trainModel(trainingData);
  const examples = top(scoreExamples(rawPrompt, trainingData.examples), 6);
  const blueprintScores = scoreBlueprints(rawPrompt, blueprintData.blueprints, state.categoryWeights);
  const picks = profilePicks(blueprintScores, profile);
  const playbooks = top(scorePlaybooks(rawPrompt, playbookData?.entries || []), 5);
  const enhancedPrompt = buildPrompt({
    rawPrompt,
    profile,
    outputType,
    workspace: ws,
    examples,
    blueprints: picks
  });
  const finalPrompt = `${enhancedPrompt}\n\n## Mega Playbook Hints\n${playbooks.map((p, i) => `${i + 1}. ${p.title} [${p.model}/${p.category}]`).join('\n')}`;

  return {
    version: ENGINE_VERSION,
    profile,
    outputType,
    trainedAt: state.trainedAt,
    enhancedPrompt: finalPrompt,
    examplesUsed: examples.length,
    directivesUsed: picks.length,
    playbooksUsed: playbooks.length,
    categoryWeights: state.categoryWeights
  };
}
