const vscode = require('vscode');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const { execFile } = require('child_process');
const { promisify } = require('util');

const SECRET_KEY_NAME = 'codeAssistant.apiKey';
const execFileAsync = promisify(execFile);

function activate(context) {
  const output = vscode.window.createOutputChannel('Code Assistant Pro');

  const generateDisposable = vscode.commands.registerCommand('codeAssistant.generateCode', async () => {
    try {
      const task = await vscode.window.showInputBox({
        title: 'Code Assistant',
        prompt: 'Describe exactly what you want to build',
        placeHolder: 'Example: Build an Express route with JWT auth and validation',
        ignoreFocusOut: true
      });

      if (!task) {
        return;
      }

      const language = await vscode.window.showInputBox({
        title: 'Code Assistant',
        prompt: 'Target language or stack',
        placeHolder: 'TypeScript, Python/FastAPI, Rust/Axum, etc.',
        ignoreFocusOut: true
      });

      if (!language) {
        return;
      }

      const destination = await vscode.window.showQuickPick(
        [
          { label: 'Insert at cursor', value: 'insert' },
          { label: 'Create new untitled file', value: 'new-file' },
          { label: 'Copy to clipboard', value: 'clipboard' }
        ],
        { title: 'Where should generated code go?' }
      );

      if (!destination) {
        return;
      }

      output.clear();
      output.show(true);
      output.appendLine('Generating code...');

      const result = await generateCode(task, language, context);
      await deliverCode(result.code, destination.value);
      displayImplementationSteps(result.instructions, output);

      vscode.window.showInformationMessage('Code generation complete. Review implementation steps in Output → Code Assistant Pro.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Code Assistant failed: ${message}`);
    }
  });

  const hailMaryDisposable = vscode.commands.registerCommand('codeAssistant.hailMaryBuild', async () => {
    try {
      const objective = await vscode.window.showInputBox({
        title: 'Hail Mary AI Build',
        prompt: 'Describe the full outcome you need (feature, app, or workflow)',
        placeHolder: 'Example: Build a FastAPI service with JWT auth, SQLite storage, tests, and Dockerfile',
        ignoreFocusOut: true
      });

      if (!objective) {
        return;
      }

      const language = await vscode.window.showInputBox({
        title: 'Hail Mary AI Build',
        prompt: 'Primary language/stack',
        placeHolder: 'TypeScript/Node, Python/FastAPI, etc.',
        ignoreFocusOut: true
      });

      if (!language) {
        return;
      }

      const toolMode = await vscode.window.showQuickPick(
        [
          { label: 'Workspace files (recommended)', value: 'workspace' },
          { label: 'Clipboard only', value: 'clipboard' }
        ],
        { title: 'How should generated artifacts be delivered?' }
      );

      if (!toolMode) {
        return;
      }

      output.clear();
      output.show(true);
      output.appendLine('Running Hail Mary mode...');

      const result = await generateHailMaryBundle(objective, language, context, output);
      await deliverHailMaryResult(result, toolMode.value, output);
      displayHailMarySummary(result, output);

      vscode.window.showInformationMessage('Hail Mary build complete. Review Output → Code Assistant Pro.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Hail Mary build failed: ${message}`);
    }
  });

  const setKeyDisposable = vscode.commands.registerCommand('codeAssistant.setApiKey', async () => {
    const key = await vscode.window.showInputBox({
      title: 'Code Assistant API Key',
      prompt: 'Paste your API key. It will be stored in VS Code Secret Storage.',
      password: true,
      ignoreFocusOut: true
    });

    if (!key) {
      return;
    }

    await context.secrets.store(SECRET_KEY_NAME, key.trim());
    vscode.window.showInformationMessage('Code Assistant API key saved securely.');
  });

  context.subscriptions.push(generateDisposable, hailMaryDisposable, setKeyDisposable, output);
}

async function getConfig(context) {
  const cfg = vscode.workspace.getConfiguration('codeAssistant');
  const secretKey = await context.secrets.get(SECRET_KEY_NAME);

  return {
    endpoint: cfg.get('endpoint', 'https://api.openai.com/v1/chat/completions'),
    apiKey: secretKey || cfg.get('apiKey', ''),
    model: cfg.get('model', 'gpt-5.1'),
    temperature: cfg.get('temperature', 0.2),
    maxTokens: cfg.get('maxTokens', 1800),
    timeoutMs: cfg.get('timeoutMs', 60000),
    hailMaryMaxAttempts: cfg.get('hailMaryMaxAttempts', 3),
    mcpTools: cfg.get('mcpTools', []),
    enableCodeCheck: cfg.get('enableCodeCheck', true)
  };
}

async function callProvider({ system, user, config, responseFormat, modelOverride }) {
  const payload = {
    model: modelOverride || config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
    },
    body: JSON.stringify(payload),
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Provider error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No completion content returned by provider.');
  }

  return content;
}

async function generateCode(task, language, context) {
  const config = await getConfig(context);
  const profile = await pickModelProfile(config.model);
  if (!profile) {
    throw new Error('Model profile selection was cancelled.');
  }
  const editor = vscode.window.activeTextEditor;
  const selectedCode = editor ? editor.document.getText(editor.selection).trim() : '';

  const system = [
    'You are a senior software engineer producing production-grade code.',
    'Always return valid JSON with this exact schema:',
    '{"code":"<full code>","instructions":["step 1","step 2"]}',
    'The code must be complete, practical, and directly runnable.',
    'Never mention AI, language models, or assistant disclaimers in generated content.',
    'Put only code in the code field and only actionable implementation steps in instructions.'
  ].join(' ');

  const userParts = [
    `Build this: ${task}`,
    `Language/stack: ${language}`,
    'Prefer robust error handling, validation, and clear structure.',
    'If config or environment variables are needed, include them in code comments and mention setup steps in instructions.'
  ];

  if (selectedCode) {
    userParts.push(`Use this selected code as context:\n${selectedCode}`);
  }

  const content = await callProvider({
    system,
    user: userParts.join('\n'),
    config,
    modelOverride: profile.model,
    responseFormat: { type: 'json_object' }
  });

  const parsed = safeParseJson(content);

  if (!parsed.code || typeof parsed.code !== 'string') {
    throw new Error('The model response did not include a valid code field.');
  }

  const instructions = Array.isArray(parsed.instructions)
    ? parsed.instructions.map((item) => String(item))
    : [];

  const validation = config.enableCodeCheck
    ? await runCodeQualityCheck(parsed.code, language)
    : { ok: true, message: 'Code check disabled by settings.' };

  return {
    code: parsed.code.trimEnd() + '\n',
    instructions: validation.ok
      ? instructions
      : [`Code check warning: ${validation.message}`, ...instructions]
  };
}

async function generateHailMaryBundle(objective, language, context, output) {
  const config = await getConfig(context);
  const profile = await pickModelProfile(config.model);
  if (!profile) {
    throw new Error('Model profile selection was cancelled.');
  }
  const workspaceContext = await readWorkspaceContext();

  const system = [
    'You are Hail Mary AI, an autonomous software delivery agent.',
    'Return strict JSON only.',
    'Schema: {"summary":"string","plan":["..."],"files":[{"path":"relative/path","content":"full file"}],"runbook":["..."],"risks":["..."]}.',
    'Generate a cohesive multi-file implementation that can be executed by a developer immediately.',
    'Include tests when appropriate.'
  ].join(' ');

  let latestPrompt = [
    `Objective: ${objective}`,
    `Primary stack: ${language}`,
    `Model profile: ${profile.name} (${profile.model})`,
    `Available MCP-like tools: ${JSON.stringify(config.mcpTools)}`,
    'Design for high autonomy with clear recovery steps.',
    'When uncertain, choose practical defaults and document them in runbook.',
    workspaceContext ? `Workspace context:\n${workspaceContext}` : 'Workspace context: (none)'
  ].join('\n\n');

  let lastError = '';

  for (let attempt = 1; attempt <= config.hailMaryMaxAttempts; attempt += 1) {
    output.appendLine(`Hail Mary attempt ${attempt}/${config.hailMaryMaxAttempts}...`);

    if (lastError) {
      latestPrompt += `\n\nPrevious attempt failed validation: ${lastError}\nFix schema and retry.`;
    }

    const content = await callProvider({
      system,
      user: latestPrompt,
      config,
      modelOverride: profile.model,
      responseFormat: { type: 'json_object' }
    });

    try {
      const parsed = safeParseJson(content);
      validateHailMaryBundle(parsed);
      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(`Hail Mary generation failed after ${config.hailMaryMaxAttempts} attempts. Last error: ${lastError}`);
}

function validateHailMaryBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('Bundle is not an object.');
  }

  if (!bundle.summary || typeof bundle.summary !== 'string') {
    throw new Error('Bundle is missing a valid summary field.');
  }

  if (!Array.isArray(bundle.plan)) {
    throw new Error('Bundle plan must be an array.');
  }

  if (!Array.isArray(bundle.files)) {
    throw new Error('Bundle files must be an array.');
  }

  for (const file of bundle.files) {
    if (!file || typeof file.path !== 'string' || typeof file.content !== 'string') {
      throw new Error('Each file must include string path and content fields.');
    }
  }

  if (!Array.isArray(bundle.runbook)) {
    throw new Error('Bundle runbook must be an array.');
  }

  if (!Array.isArray(bundle.risks)) {
    throw new Error('Bundle risks must be an array.');
  }
}

async function readWorkspaceContext() {
  const files = await vscode.workspace.findFiles('**/*', '**/{node_modules,.git,dist,build}/**', 10);
  if (!files.length) {
    return '';
  }

  const snippets = [];

  for (const uri of files.slice(0, 5)) {
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      const text = doc.getText().slice(0, 900);
      snippets.push(`File: ${vscode.workspace.asRelativePath(uri)}\n${text}`);
    } catch {
      // Ignore unreadable files.
    }
  }

  return snippets.join('\n\n---\n\n');
}

async function deliverHailMaryResult(result, deliveryMode, output) {
  const pretty = JSON.stringify(result, null, 2) + '\n';

  if (deliveryMode === 'clipboard') {
    await vscode.env.clipboard.writeText(pretty);
    output.appendLine('Copied Hail Mary bundle JSON to clipboard.');
    return;
  }

  const workspace = vscode.workspace.workspaceFolders?.[0];
  if (!workspace) {
    const document = await vscode.workspace.openTextDocument({ content: pretty });
    await vscode.window.showTextDocument(document, { preview: false });
    output.appendLine('No workspace folder open; showing JSON result in new file.');
    return;
  }

  const root = workspace.uri;

  for (const file of result.files) {
    const target = vscode.Uri.joinPath(root, file.path);
    const folderSegments = file.path.split('/').slice(0, -1).filter(Boolean);
    if (folderSegments.length) {
      await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(root, ...folderSegments));
    }
    await vscode.workspace.fs.writeFile(target, Buffer.from(file.content, 'utf8'));
    output.appendLine(`Wrote ${file.path}`);
  }
}

function getModelProfiles(defaultModel) {
  return [
    {
      name: 'Codex 5.3 (Coding)',
      model: defaultModel || 'gpt-5.3-codex',
      detail: 'Balanced production coding profile.'
    },
    {
      name: 'Codex 5.3 + Manus (Research/Tools)',
      model: 'gpt-5.3-codex-manus',
      detail: 'Tool-heavy profile for MCP + internet-search prompting.'
    },
    {
      name: 'Opus 4.5 (Coder/Prompter)',
      model: 'opus-4.5-mod',
      detail: 'Alternative profile for coding or prompt-engineering workflows.'
    }
  ];
}

async function pickModelProfile(defaultModel) {
  const profiles = getModelProfiles(defaultModel);
  const picked = await vscode.window.showQuickPick(
    profiles.map((profile) => ({
      label: profile.name,
      description: profile.model,
      detail: profile.detail,
      profile
    })),
    { title: 'Choose a model profile' }
  );

  return picked?.profile;
}

async function runCodeQualityCheck(code, language) {
  const normalized = (language || '').toLowerCase();
  const isJsLike =
    normalized.includes('javascript') ||
    normalized.includes('typescript') ||
    normalized.includes('node') ||
    normalized.includes('js') ||
    normalized.includes('ts');

  if (!isJsLike) {
    return {
      ok: true,
      message: 'No checker configured for this language; skipped.'
    };
  }

  const tempFile = path.join(os.tmpdir(), `code-assistant-check-${Date.now()}.js`);
  await fs.writeFile(tempFile, code, 'utf8');

  try {
    await execFileAsync('node', ['--check', tempFile], { timeout: 120000 });
    return { ok: true, message: 'Syntax check passed.' };
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr).trim() : '';
    const stdout = error?.stdout ? String(error.stdout).trim() : '';
    const detail = stderr || stdout || 'Unknown syntax check failure.';
    return { ok: false, message: detail };
  } finally {
    await fs.rm(tempFile, { force: true });
  }
}

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const jsonBlock = raw.match(/\{[\s\S]*\}/);
    if (!jsonBlock) {
      throw new Error('Could not parse JSON response from provider.');
    }
    return JSON.parse(jsonBlock[0]);
  }
}

async function deliverCode(code, destination) {
  if (destination === 'clipboard') {
    await vscode.env.clipboard.writeText(code);
    return;
  }

  if (destination === 'new-file') {
    const document = await vscode.workspace.openTextDocument({ content: code });
    await vscode.window.showTextDocument(document, { preview: false });
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    const document = await vscode.workspace.openTextDocument({ content: code });
    await vscode.window.showTextDocument(document, { preview: false });
    return;
  }

  await editor.edit((builder) => {
    builder.insert(editor.selection.active, code);
  });
}

function displayImplementationSteps(instructions, output) {
  output.appendLine('');

  if (!instructions.length) {
    output.appendLine('No additional setup steps were returned.');
    return;
  }

  output.appendLine('Implementation steps:');
  instructions.forEach((step, index) => {
    output.appendLine(`${index + 1}. ${step}`);
  });
}

function displayHailMarySummary(result, output) {
  output.appendLine('');
  output.appendLine(`Summary: ${result.summary}`);

  output.appendLine('');
  output.appendLine('Plan:');
  result.plan.forEach((item, index) => {
    output.appendLine(`${index + 1}. ${item}`);
  });

  output.appendLine('');
  output.appendLine('Runbook:');
  result.runbook.forEach((item, index) => {
    output.appendLine(`${index + 1}. ${item}`);
  });

  output.appendLine('');
  output.appendLine('Risks:');
  result.risks.forEach((item, index) => {
    output.appendLine(`- ${item}`);
  });
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
