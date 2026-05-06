import { enhancePrompt } from './engine.js';

const DEFAULT_AGENT_CONFIG = {
  maxIterations: 3,
  minScoreDelta: 0.05,
  profile: 'lucario',
  outputType: 'prompt'
};

function evaluate(result, previousScore = 0) {
  const score = (result.directivesUsed * 0.12) + (result.examplesUsed * 0.08) + (result.playbooksUsed * 0.05);
  const normalized = Math.max(0, Math.min(1, score));
  return {
    score: Number(normalized.toFixed(4)),
    scoreDelta: Number((normalized - previousScore).toFixed(4)),
    keepGoing: normalized - previousScore > 0.01
  };
}

function makeRefinementPrompt(basePrompt, iteration, feedback) {
  return [
    basePrompt,
    '',
    `Refinement iteration: ${iteration}`,
    'Autonomous improvement goals:',
    `- Increase actionability and execution quality by at least ${feedback.minScoreDelta}.`,
    '- Strengthen constraints, validation gates, and edge-case handling.',
    '- Reduce ambiguity while preserving user intent.'
  ].join('\n');
}

export function runAutonomousAgent({
  rawPrompt,
  workspace,
  trainingData,
  blueprintData,
  playbookData,
  trained,
  config = {}
}) {
  const settings = { ...DEFAULT_AGENT_CONFIG, ...(config || {}) };

  const trace = [];
  let best = null;
  let currentPrompt = rawPrompt;
  let previousScore = 0;

  for (let i = 1; i <= settings.maxIterations; i += 1) {
    const result = enhancePrompt({
      rawPrompt: currentPrompt,
      profile: settings.profile,
      outputType: settings.outputType,
      workspace,
      trainingData,
      blueprintData,
      playbookData,
      trained
    });

    const metrics = evaluate(result, previousScore);
    trace.push({
      iteration: i,
      score: metrics.score,
      scoreDelta: metrics.scoreDelta,
      examplesUsed: result.examplesUsed,
      directivesUsed: result.directivesUsed,
      playbooksUsed: result.playbooksUsed
    });

    if (!best || metrics.score > best.metrics.score) {
      best = { result, metrics, iteration: i };
    }

    if (metrics.scoreDelta < settings.minScoreDelta || !metrics.keepGoing) {
      break;
    }

    previousScore = metrics.score;
    currentPrompt = makeRefinementPrompt(rawPrompt, i + 1, settings);
  }

  return {
    mode: 'autonomous-agent',
    config: settings,
    bestIteration: best?.iteration || 1,
    trace,
    final: best?.result,
    finalMetrics: best?.metrics || { score: 0, scoreDelta: 0, keepGoing: false }
  };
}
