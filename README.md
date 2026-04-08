# Code Assistant Pro for VS Code

Code Assistant Pro is a Visual Studio Code extension that generates practical, runnable code from natural-language tasks and then gives follow-up implementation steps.

## What it does

- Generates real code for your requested feature or component.
- Returns implementation/setup steps separately in the Output panel.
- Lets you insert code at cursor, open in a new file, or copy to clipboard.
- Supports secure API key storage via VS Code Secret Storage.
- Uses selected editor text as optional context when generating code.
- Includes **Hail Mary AI Build** mode for autonomous multi-file implementation bundles with plans, runbooks, and risks.

## Setup

1. Open this folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. Optional: run command **Code Assistant: Set API Key** if your endpoint requires bearer auth.
4. Optional: tune `codeAssistant.endpoint`, `codeAssistant.model`, `codeAssistant.temperature`, `codeAssistant.maxTokens`, `codeAssistant.timeoutMs`.

## Usage

### Generate single code output

1. Run command: **Code Assistant: Generate Working Code**.
2. Describe what you want built.
3. Choose language/stack.
4. Pick one of the model profiles:
   - **Codex 5.3 (Coding)**
   - **Codex 5.3 + Manus (Research/Tools)**
   - **Opus 4.5 (Coder/Prompter)**
5. Choose destination for generated code.
6. Review implementation steps in **Output → Code Assistant Pro**.

### Hail Mary AI Build (full bundle mode)

1. Run command: **Code Assistant: Hail Mary AI Build**.
2. Describe the full objective (for example, app + auth + tests + deploy assets).
3. Choose your language/stack.
4. Pick a model profile.
5. Choose delivery mode:
   - **Workspace files** writes each generated file into your open project.
   - **Clipboard only** copies the full JSON bundle.
6. Review summary, plan, runbook, and risks in **Output → Code Assistant Pro**.

## Extension settings

- `codeAssistant.endpoint`: Chat completions endpoint.
- `codeAssistant.apiKey`: Optional key (only needed if your endpoint requires bearer auth).
- `codeAssistant.model`: Model name (default: `gpt-5.1`).
- `codeAssistant.temperature`: Creativity level.
- `codeAssistant.maxTokens`: Completion token limit.
- `codeAssistant.timeoutMs`: API request timeout in milliseconds.
- `codeAssistant.hailMaryMaxAttempts`: Maximum retries for structured Hail Mary bundle validation.
- `codeAssistant.mcpTools`: Optional list of MCP/tool names included in Hail Mary prompting context.
- `codeAssistant.enableCodeCheck`: Enables local JS/TS syntax checks before returning generated code.

## Notes

- The extension requests JSON output from the model and validates the shape before inserting code.
- If there is no active editor, it creates a new untitled file automatically.
- Hail Mary mode validates the returned bundle schema and retries generation if validation fails.
- When code check is enabled, JavaScript/TypeScript output is validated with a local `node --check` pass and warnings are injected into implementation steps if issues are found.
