const vscode = require('vscode');

const SECRET_KEY_NAME = 'codeAssistant.apiKey';

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

  context.subscriptions.push(generateDisposable, setKeyDisposable, output);
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
    timeoutMs: cfg.get('timeoutMs', 60000)
  };
}

async function generateCode(task, language, context) {
  const config = await getConfig(context);

  if (!config.apiKey) {
    throw new Error('Missing API key. Run "Code Assistant: Set API Key" or set codeAssistant.apiKey in Settings.');
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

  const payload = {
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userParts.join('\n') }
    ]
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
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

  const parsed = safeParseJson(content);

  if (!parsed.code || typeof parsed.code !== 'string') {
    throw new Error('The model response did not include a valid code field.');
  }

  const instructions = Array.isArray(parsed.instructions)
    ? parsed.instructions.map((item) => String(item))
    : [];

  return {
    code: parsed.code.trimEnd() + '\n',
    instructions
  };
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

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
