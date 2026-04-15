# Prompting Pro — Lucario Trinity (Chrome + Core Engine)

This repo now contains a **full Prompting Pro core engine** and a **Chrome Extension (Manifest V3)** implementation that fuses:

- **PromptCraft** (structured prompt contracts)
- **Juma** (conversational planning/decomposition)
- **OpenManus** (agentic plan-act-reflect loops)

into one adaptive prompting workflow.

---

## What was upgraded

### 1) `extension.js` is now a full Prompting Pro runtime engine

`extension.js` was fully rewritten into a runtime-agnostic prompt engine with:
- tri-model profile blending (Lucario, Trinity, solo modes)
- training pipeline with category/token weighting
- blueprint scoring and selection
- example retrieval from local dataset
- output contract generation and validation gates
- export/import state + memory tracking
- payload compilation for OpenAI-compatible chat APIs

### 2) Chrome extension scaffolding (production-ready base)

A full extension has been added under `chrome_extension/`:

- `manifest.json` (MV3)
- `src/background.js` (service worker + context menu + storage + message bus)
- `src/content.js` (in-page panel + keyboard shortcut + copy)
- `src/popup.html|css|js` (prompt enhancement UI)
- `src/options.html|css|js` (settings + training controls)
- `src/engine.js` (browser-side enhancement engine)
- `data/*.chrome.json` (training + blueprint datasets)

### 3) Local training + blueprint datasets

- `data/prompt_training_data.json`
- `data/lucario_prompt_blueprints.json`
- mirrored to `chrome_extension/data/*.chrome.json`
- plus `chrome_extension/data/prompt_playbooks.json` mega playbook pack (800 templates)

---

## Chrome extension install (dev mode)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select folder: `chrome_extension/`

Then use popup, options page, or right-click selected text with:
**Enhance selected prompt with Prompting Pro**.

---

## Main usage flows

### Popup flow
1. Paste rough prompt
2. Choose profile + output type
3. Click **Enhance Prompt**
4. Copy enhanced output

### Context menu flow
1. Highlight text on a webpage
2. Right click → Enhance with Prompting Pro
3. Get in-page result panel

### Keyboard flow
- `Ctrl/Cmd + Shift + P` (when text is selected on page)

---

## Profiles

- **Lucario OP Fusion**: strongest adaptive blend
- **Trinity Fusion**: balanced blend
- **PromptCraft**: strict structure
- **Juma**: planning/decomposition
- **OpenManus**: agentic looping

---

## Development notes

- Core engine entry: `extension.js`
- Browser engine entry: `chrome_extension/src/engine.js`
- Background orchestration: `chrome_extension/src/background.js`

Basic syntax check:

```bash
npm run lint
```

---

## Next recommended step

Wire the enhanced prompt directly to your preferred model endpoint (OpenAI-compatible) from popup/options using secure key handling (Chrome storage + optional native host).
