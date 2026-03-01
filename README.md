# Code Assistant Pro for VS Code

Code Assistant Pro is a Visual Studio Code extension that generates practical, runnable code from natural-language tasks and then gives follow-up implementation steps.

## What it does

- Generates real code for your requested feature or component.
- Returns implementation/setup steps separately in the Output panel.
- Lets you insert code at cursor, open in a new file, or copy to clipboard.
- Supports secure API key storage via VS Code Secret Storage.
- Uses selected editor text as optional context when generating code.

## Setup

1. Open this folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. Run command: **Code Assistant: Set API Key**.
4. Optional: tune `codeAssistant.endpoint`, `codeAssistant.model`, `codeAssistant.temperature`, `codeAssistant.maxTokens`, `codeAssistant.timeoutMs`.

## Usage

1. Run command: **Code Assistant: Generate Working Code**.
2. Describe what you want built.
3. Choose language/stack.
4. Choose destination for generated code.
5. Review implementation steps in **Output → Code Assistant Pro**.

## Extension settings

- `codeAssistant.endpoint`: Chat completions endpoint.
- `codeAssistant.apiKey`: Optional fallback key in plaintext settings (Secret Storage is preferred).
- `codeAssistant.model`: Model name (default: `gpt-5.1`).
- `codeAssistant.temperature`: Creativity level.
- `codeAssistant.maxTokens`: Completion token limit.
- `codeAssistant.timeoutMs`: API request timeout in milliseconds.

## Notes

- The extension requests JSON output from the model and validates the shape before inserting code.
- If there is no active editor, it creates a new untitled file automatically.
