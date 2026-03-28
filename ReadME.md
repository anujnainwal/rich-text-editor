<p align="center">
  <img src="https://res.cloudinary.com/dsk6tf2jb/image/upload/v1774675782/inkflow%20editor/inkflow-logo.png" width="150" alt="Inkflow Logo">
</p>

# Inkflow: The Premium WYSIWYG Rich Text Editor for Modern Web Apps ✍️

[![NPM Version](https://img.shields.io/npm/v/inkflow.svg)](https://www.npmjs.com/package/inkflow)
[![CI Status](https://github.com/anujnainwal/rich-text-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/anujnainwal/rich-text-editor/actions)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/anujnainwal/rich-text-editor/graphs/commit-activity)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Security Policy](https://img.shields.io/badge/security-policy-green.svg)](./SECURITY.md)

> A premium, ultra-lightweight, and framework-agnostic **WYSIWYG rich text editor** built entirely with Vanilla TypeScript — featuring a polished **Slate & Indigo** design, XSS protection, dynamic toolbar positions, and first-class support for **React**, **Next.js**, and modern web apps.

> **v0.1.5 — Stable Release**: This is the current stable release of Inkflow.

---

## 🖼 Editor Preview

![Inkflow Editor Preview](https://res.cloudinary.com/dsk6tf2jb/image/upload/v1774157808/inkflow%20editor/editor-preview_vti5wi.png)

---

## 💡 What is WYSIWYG?

**WYSIWYG** stands for **"What You See Is What You Get"**.
Unlike markdown or code editors, what you type in Inkflow — bold text, centered headings, interactive tables — is exactly how it appears when published. It bridges the gap between editing and the final result, making rich-text creation intuitive and predictable.

---

## 🎮 Live Demo

Try the **Interactive React Demo** on StackBlitz:
[**▶ Run Demo on StackBlitz**](https://stackblitz.com/edit/vitejs-vite-e8u5yntq?embed=1&view=preview)

---

## 🚀 Why Choose Inkflow?

Inkflow is designed for developers who need a **high-performance, secure, and beautiful editor** without the complexity of traditional rich-text frameworks.

- **🎨 Sophisticated Design**: Built with a native **Slate & Indigo** theme, Inkflow feels premium out-of-the-box.
- **🔒 Security-First**: Every keystroke path is hardened with **DOMPurify**, making it one of the most secure editors available.
- **⚛️ Framework Ready**: Seamlessly integrates with **React**, **Next.js (SSR-safe)**, and **TypeScript**.
- **📏 Ultra-Lightweight**: At just **~30kB**, it won't bloat your bundle size.

---

## ✨ Features

| Feature                    | Description                                               |
| :------------------------- | :-------------------------------------------------------- |
| 🪶 **~30kB packed**        | Microscopic footprint — incredibly fast initial load      |
| 🔒 **Security 9.8/10**     | Hard-coded XSS sanitization via DOMPurify                 |
| ⚡ **Pure ESM & CJS**      | Optimized for Vite, Node.js, and Legacy Bundlers          |
| 🎯 **Framework Agnostic**  | React, Next.js, Vue, Angular, Svelte                      |
| ♿ **A11y Ready**          | Full ARIA support for screen readers and keyboards        |
| 🌑 **Dark Mode**           | Sophisticated built-in dark theme                         |
| 📐 **Toolbar Positions**   | Top, Bottom, Left, Right, Floating                        |
| 📊 **Table Editor**        | Native insert & style interactive HTML tables             |
| 😊 **Emoji Picker**        | Searchable emoji library (lazy-loaded on demand)          |
| 🖼 **Image Pipeline**      | Drag-and-drop, WebP compression, resize handles, captions |
| 🧙 **Magic Format**        | Typography & Accent themes with one-click reset           |
| 📋 **Smart Paste**         | Auto-formats pasted HTML into clean rich text             |
| 🧹 **Auto-Save**           | Configurable auto-save with visual "Saved at..." status   |
| 💻 **Premium Code Blocks** | 4-directional resize, 5 themes, and custom color picker   |

---

## 🏗 Architecture

Inkflow is built with **Vanilla TypeScript** and zero runtime dependencies (only `dompurify` for security). Key internals:

- **`CoreEditor`** — manages the `contenteditable` element, selection, history, and auto-save
- **`Toolbar`** — dynamic toolbar with granular item control and 5 position modes
- **`SelectionManager`** — cross-browser selection and range utilities
- **`HistoryManager`** — undo/redo with snapshot diffing
- **`ImageManager`** — client-side WebP compression, upload adapters, and resize handles

---

## 🛡 Security & XSS Protection

Inkflow takes security seriously with a **9.8/10 internal audit score**:

- **Auto-sanitizes** all pasted content and API inputs via DOMPurify
- **Blocks** `javascript:`, `data:`, and `vbscript:` URI schemes
- **Forces** `rel="noopener noreferrer"` on every link
- **Eliminates** `innerHTML` usage in all UI rendering (zero-trust approach)
- **Normalizes** content after every structural change with a final sanitization pass

---

## 📦 Installation

```bash
npm install inkflow
```

---

## 🚀 Quick Start

### Vanilla JS / TypeScript

```javascript
import { InkflowEditor } from "inkflow";
import "inkflow/style";

const container = document.getElementById("editor");
const editor = new InkflowEditor(container, {
  placeholder: "Type something beautiful...",
  autofocus: true,
  showStatus: true,
  toolbarItems: ["bold", "italic", "heading", "table", "link"],
});
```

---

### React

In React **Strict Mode**, components mount twice in development. Always call `destroy()` in the cleanup function.

```tsx
import { useEffect, useRef } from "react";
import { InkflowEditor } from "inkflow";
import "inkflow/style";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<InkflowEditor | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = new InkflowEditor(containerRef.current, {
        placeholder: "Start writing...",
      });
    }
    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  return <div ref={containerRef} />;
}
```

---

### Next.js

```tsx
"use client";
import { useEffect, useRef } from "react";
import { InkflowEditor } from "inkflow";
import "inkflow/style";

export default function MyEditor() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = new InkflowEditor(containerRef.current, {
      onSave: (html) => console.log(html),
    });
    return () => editor.destroy(); // Crucial for HMR and Strict Mode
  }, []);

  return <div ref={containerRef} className="editor-shell" />;
}
```

---

### CDN / Legacy Usage (UMD)

For projects without a bundler, you can include Inkflow directly via Unpkg or jsDelivr. The global `InkflowEditor` class will be available on the `window` object.

```html
<!-- Include Styles -->
<link rel="stylesheet" href="https://unpkg.com/inkflow/dist/inkflow.css">

<!-- Include Library -->
<script src="https://unpkg.com/inkflow"></script>

<div id="editor"></div>

<script>
  const container = document.getElementById('editor');
  const editor = new InkflowEditor(container, {
    placeholder: 'Hello from CDN!',
  });
</script>
```

---

## ⚙️ Configuration Options

| Option               | Type       | Default     | Description                                                    |
| :------------------- | :--------- | :---------- | :------------------------------------------------------------- |
| `placeholder`        | `string`   | `undefined` | Placeholder text when the editor is empty                      |
| `autofocus`          | `boolean`  | `false`     | Auto-focus the editor on init                                  |
| `dark`               | `boolean`  | `false`     | Enable dark mode theme                                         |
| `showStatus`         | `boolean`  | `true`      | Show/hide the "Saved at..." status bar                         |
| `showCharCount`      | `boolean`  | `false`     | Show character/word count metrics                              |
| `toolbarItems`       | `string[]` | all         | Array of tool IDs to display                                   |
| `toolbarPosition`    | `string`   | `'top'`     | Toolbar position: `top`, `bottom`, `left`, `right`, `floating` |
| `onSave`             | `function` | `undefined` | Callback when content is saved (`(html: string) => void`)      |
| `onSaving`           | `function` | `undefined` | Callback when auto-save is triggered                           |
| `autoSaveInterval`   | `number`   | `1000`      | Debounce delay in ms before auto-save fires                    |
| `imageEndpoints`     | `object`   | `undefined` | Custom upload endpoint: `{ upload: string }`                   |
| `cloudinaryFallback` | `object`   | `undefined` | Cloudinary fallback: `{ cloudName, uploadPreset }`             |
| `maxImageSizeMB`     | `number`   | `5`         | Max image size in MB (enforced pre and post compression)       |

---

## 🛠 API Methods

| Method                            | Description                                                   |
| :-------------------------------- | :------------------------------------------------------------ |
| `destroy()`                       | **Required on unmount.** Cleans up DOM, listeners, and memory |
| `getHTML()`                       | Returns sanitized HTML string of the editor content           |
| `setHTML(html)`                   | Programmatically sets editor content                          |
| `focus()`                         | Forces focus onto the editor                                  |
| `setDarkMode(boolean)`            | Dynamically toggle dark mode                                  |
| `insertTable(rows, cols)`         | Programmatically insert a table                               |
| `insertImage(url, id, isLoading)` | Insert an image with optional loading state                   |
| `getToolbar()`                    | Returns the `Toolbar` instance                                |

---

## 🔧 Toolbar Positions

Inkflow supports **5 toolbar layout modes**:

```ts
new InkflowEditor(container, {
  toolbarPosition: 'top'      // Default — above the editor
  toolbarPosition: 'bottom'   // Below the editor
  toolbarPosition: 'left'     // Vertical sidebar, left
  toolbarPosition: 'right'    // Vertical sidebar, right
  toolbarPosition: 'floating' // Context-aware floating toolbar
});
```

---

## 💡 Troubleshooting

**Seeing duplicate editors or toolbars?**

1. **React Strict Mode**: Ensure `editor.destroy()` is called in the `useEffect` cleanup.
2. **Missing cleanup**: The editor injects elements into the DOM — always destroy on unmount.

**Editor not initializing in Next.js?**

- Make sure the component has `"use client"` and wraps initialization inside `useEffect`.

## 📝 Changelog

### v0.1.5 — Structural & Synchronization Patch _(current)_

- 🧱 **Structural Integrity**: Implemented high-frequency normalization (200ms) to prevent loss of paragraph tags during typing and forced focus redirection to ensure all content remains properly wrapped in `<p>` blocks.

- 💻 **Premium Code Blocks**:
  - **8-Handle Resizing**: Full 4-directional resizing (Top, Bottom, Left, Right) with corner handles and intuitive position-shifting.
  - **Unified Control Hub**: Grouped "Copy" and "Remove" buttons in a sleek top-right glassmorphism container.
  - **Visual Themes**: 5 premium themes (Terminal, Slate, Forest, Crimson, Ocean) and custom color picker with automatic YIQ text contrast.
  - **Sychronized Outline**: Fixed resizing decoupling; the interactive focus border now perfectly follows the code area.
- ⚡ **Performance & UX**: Moved removal logic to `mousedown` for instant response. Improved structural normalization to ensure code blocks and their content are fully deleted cleanly.
- 🔄 **Toolbar Precision**:
  - Fixed case-sensitivity mismatch for heading tags in the style dropdown.
  - Improved line-height detection with fuzzy ratio matching to handle browser rounding differences.
  - Resolved font-size input failures by implementing capture-phase selection preservation.
- 🔡 **Typography & Fonts**: Added Google Fonts `@import` layer to the core CSS to support premium font families like Inter, Playfair Display, and Merriweather out-of-the-box.
- 😊 **Emoji Placement**: Fixed a bug where emojis were misplaced at the start of the editor; implemented selection restoration before insertion.
- 📐 **Default Styling**: Updated default line-height to `1.5` for a more readable, professional editing experience.

### v0.1.4 — UI Alignment Patch

### v0.1.3 — Style & Stability Patch

- 🎨 **Fixed Styling Issue**: Resolved a critical issue where the editor would appear unstyled due to incorrect CSS export paths in `package.json`. Corrected the path to `inkflow/dist/inkflow.css`.

### v0.1.0 — Initial Experiment

- 🎉 First public release of **Inkflow Editor** under the `inkflow` package name
- Toolbar positions: `top`, `bottom`, `left`, `right`, `floating`
- Premium Table UI with rounded corners, zebra stripes, and interactive states
- Magic Format 2.0: Typography & Accents themes with a dedicated Reset button
- Refined vertical sidebar toolbars (76px) with pill-shaped controls
- Hardened paste sanitization to prevent character limit bypasses
- ~30kB packed weight, Pure ESM architecture

---

## 🤝 Community & Support

We strive to build a welcoming and inclusive community. Please refer to our support documents:

- 🌟 **[Contributing Guide](./CONTRIBUTING.md)**: How to get started and submit changes.
- 📜 **[Code of Conduct](./CODE_OF_CONDUCT.md)**: Our commitment to a welcoming community.
- 🛡️ **[Security Policy](./SECURITY.md)**: How to report vulnerabilities.
- 💖 **[Funding & Support](./.github/FUNDING.yml)**: Help sustain the project.

---

## 📄 License

MIT © [Anuj Nainwal](https://github.com/anujnainwal)
