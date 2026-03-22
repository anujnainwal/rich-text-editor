# inkflow ✍️ | Premium WYSIWYG Rich Text Editor

[![NPM Version](https://img.shields.io/npm/v/inkflow.svg)](https://www.npmjs.com/package/inkflow)
[![NPM Downloads](https://img.shields.io/npm/dw/inkflow.svg)](https://www.npmjs.com/package/inkflow)
[![Status](https://img.shields.io/badge/status-early%20experiment-yellow.svg)](https://www.npmjs.com/package/inkflow)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-green.svg)](https://www.npmjs.com/package/inkflow)

> A premium, ultra-lightweight, and framework-agnostic **WYSIWYG rich text editor** built entirely with Vanilla TypeScript — featuring a polished **Slate & Indigo** design, XSS protection, dynamic toolbar positions, and first-class support for **React**, **Next.js**, and modern web apps.

> [!NOTE]
> **v0.1.0 — Early Experiment**: This is the initial public release of Inkflow. The core API is functional and actively being refined. Community feedback is warmly welcomed! 🚀

---

## 🖼 Editor Preview

![Inkflow Editor Preview](https://raw.githubusercontent.com/anujnainwal/rich-text-editor/master/images/editor-preview.png)

---

## 💡 What is WYSIWYG?

**WYSIWYG** stands for **"What You See Is What You Get"**.
Unlike markdown or code editors, what you type in Inkflow — bold text, centered headings, interactive tables — is exactly how it appears when published. It bridges the gap between editing and the final result, making rich-text creation intuitive and predictable.

---

## 🎮 Live Demo

Try the **Interactive React Demo** on StackBlitz:
[**▶ Run Demo on StackBlitz**](https://stackblitz.com/edit/vitejs-vite-e8u5yntq?embed=1&view=preview)

---

## ✨ Features

| Feature                   | Description                                               |
| :------------------------ | :-------------------------------------------------------- |
| 🪶 **~28kB packed**       | Microscopic footprint — incredibly fast initial load      |
| 🔒 **Security 9.8/10**    | Hard-coded XSS sanitization via DOMPurify                 |
| ⚡ **Pure ESM**           | Zero CJS bloat, optimized for Vite, Webpack 5+            |
| 🎯 **Framework Agnostic** | React, Next.js, Vue, Angular, Svelte                      |
| 🌑 **Dark Mode**          | Sophisticated built-in dark theme                         |
| 📐 **Toolbar Positions**  | Top, Bottom, Left, Right, Floating                        |
| 📊 **Table Editor**       | Native insert & style interactive HTML tables             |
| 😊 **Emoji Picker**       | Searchable emoji library (lazy-loaded on demand)          |
| 🖼 **Image Pipeline**     | Drag-and-drop, WebP compression, resize handles, captions |
| 🧙 **Magic Format**       | Typography & Accent themes with one-click reset           |
| 📋 **Smart Paste**        | Auto-formats pasted HTML into clean rich text             |
| 🧹 **Auto-Save**          | Configurable auto-save with visual "Saved at..." status   |

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

### v0.1.0 — Initial Experiment _(current)_

- 🎉 First public release of **Inkflow Editor** under the `inkflow` package name
- Toolbar positions: `top`, `bottom`, `left`, `right`, `floating`
- Premium Table UI with rounded corners, zebra stripes, and interactive states
- Magic Format 2.0: Typography & Accents themes with a dedicated Reset button
- Refined vertical sidebar toolbars (76px) with pill-shaped controls
- Hardened paste sanitization to prevent character limit bypasses
- ~28kB packed weight, Pure ESM architecture

---

## 📄 License

MIT © [Anuj Nainwal](https://github.com/anujnainwal)
