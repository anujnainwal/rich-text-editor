# @meenainwal/rich-text-editor 🚀 | Premium WYSIWYG Editor

[![NPM Downloads](https://img.shields.io/npm/dw/@meenainwal/rich-text-editor.svg)](https://www.npmjs.com/package/@meenainwal/rich-text-editor)
[![NPM Version](https://img.shields.io/npm/v/@meenainwal/rich-text-editor.svg)](https://www.npmjs.com/package/@meenainwal/rich-text-editor)

A premium, ultra-lightweight, and framework-agnostic **WYSIWYG rich text editor** built entirely with Vanilla TypeScript. Featuring a sophisticated **Slate & Indigo** design system, it provides a flawless writing experience for React, Next.js, and modern web applications.

### 💡 What is WYSIWYG?
**WYSIWYG** stands for **"What You See Is What You Get"**. 
Unlike markdown or code editors, what you see while typing in InkFlow—the bold text, centered headings, and interactive tables—is exactly how it will appear when published. It bridges the gap between editing and the final result, making rich-text creation accessible and predictable.

## 🚀 Recent Performance & Security Breakthrough (v1.1.2)
We recently completed an aggressive optimization and security hardening pass:
- **79% Size Reduction:** Packed weight dropped from **132kB to 28kB**.
- **9.8/10 Security Score:** Internal audit confirmed world-class XSS protection.
- **Pure ESM Architecture:** Zero legacy CommonJS bloat for modern bundlers.

---

## 🎮 Live React Preview
Wanna see it in action? Try the **Interactive React Demo** on StackBlitz:
[**Run Demo on StackBlitz**](https://stackblitz.com/edit/vitejs-vite-e8u5yntq?embed=1&view=preview)

## ✨ Premium Features & Why Choose This Editor?

### 👍 Key Pros & Capabilities
- **Microscopic Footprint**: Only **~28kB** packed weight. Total initial load is incredibly light.
- **Secure By Design**: Rated **9.8/10** in security audits with forced XSS sanitization.
- **Pure ESM Build**: Optimized for modern bundlers (Vite, Webpack 5, etc.) with zero CJS bloat.
- **Performance Optimized**: Heavy components like the Emoji Picker are **dynamic-imported** only when clicked.
- **Framework Agnostic**: Native support for **React**, **Next.js**, **Vue**, **Angular**, and **Svelte**.
- **Auto-Formatting Magic**: Intelligently parses pasted HTML strings into clean, formatted rich text.
- **Professional UI/UX**: Modern aesthetics curated with a polished Slate & Indigo color palette.
- **Table Support**: Natively insert and style interactive HTML tables.
- **Emoji Picker**: Integrated searchable emoji library for expressive content.
- **Dark Mode**: Sophisticated dark theme for premium developer experiences.
- **Customizable Toolbar**: Granular control over tool visibility and layout.
- **Smart Image Management**: Built-in client-side compression (WebP), loading states, custom upload adapters, live resizing, and native captions.

---

## 🌐 Documentation Website (Coming Soon!)
We are currently building a dedicated official website to provide the best possible developer experience.

**What to expect:**
- **Interactive Playground**: Test all features live in your browser.
- **Deep-Dive Guides**: Detailed integration steps for React, Next.js, Vue, and more.
- **Full API Reference**: Comprehensive documentation for every method and option.
- **Custom Theme Builder**: Visually design your editor's look and feel.

🚀 **Stay tuned for the official launch!**

---

## 🛡 Security & XSS Protection
InkFlow takes security seriously. It features a hard-coded strict whitelist in `DOMPurify` to ensure:
- **Malicious Scripts:** Automatically stripped from pastes and API inputs.
- **URI Blocking:** Blocks `javascript:`, `data:`, and `vbscript:` schemes.
- **Link Hardening:** Every link is forced to have `rel="noopener noreferrer"`.
- **Normalization:** Every structural cleanup is followed by a final sanitization pass.

---

> [!TIP]
> The editor is optimized for performance. Features like the **Emoji Picker** are only loaded when needed, keeping your initial page load lightning fast.

### 👎 Cons (Current Limitations)
- Markdown shortcut typing (e.g., typing `#` for H1) is not natively supported yet.

---

## 📚 Technical Guides
For deep-dive documentation, check out our local guides:
- [**Usage Guide**](./USAGE_GUIDE.md): Configuration, API methods, and feature customization.
- [**Technical Integration Guide**](./INTEGRATION_GUIDE.md): Step-by-step setup and advanced patterns.
- [**Security Report**](./SECURITY_REPORT.md): Full breakdown of our XSS protection and hardening.

---

## 📦 Installation

```bash
npm install @meenainwal/rich-text-editor
```

## 🚀 Quick Start

### Basic Usage (Vanilla JS)

```javascript
import { InkFlowEditor } from '@meenainwal/rich-text-editor';
import '@meenainwal/rich-text-editor/style'; // Simple style import

const container = document.getElementById('editor');
const editor = new InkFlowEditor(container, {
  placeholder: 'Type something beautiful...',
  autofocus: true,
  showStatus: true,
  toolbarItems: ['bold', 'italic', 'heading', 'table', 'link'] // Customize tools
});
```

### In React (Preventing Duplicates)
In React **Strict Mode**, components mount twice in development. Always use the cleanup function to destroy the editor instance.

```tsx
import { useEffect, useRef } from 'react';
import { InkFlowEditor } from '@meenainwal/rich-text-editor';
import '@meenainwal/rich-text-editor/style';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<InkFlowEditor | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = new InkFlowEditor(containerRef.current, {
        placeholder: 'Start writing...',
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} />;
}
```

### In Next.js (Safe Implementation)
For Next.js, ensure the editor is only initialized on the client side using `useEffect`.

```tsx
"use client";
import { useEffect, useRef } from 'react';
import { InkFlowEditor } from '@meenainwal/rich-text-editor';
import '@meenainwal/rich-text-editor/style';

export default function MyEditor() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const editor = new InkFlowEditor(containerRef.current, {
      onSave: (html) => console.log(html)
    });

    return () => editor.destroy(); // Crucial for HMR and Strict Mode
  }, []);

  return <div ref={containerRef} className="editor-shell" />;
}
```

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `placeholder` | `string` | `undefined` | The placeholder text when the editor is empty. |
| `autofocus` | `boolean` | `false` | Focus the editor automatically on initialization. |
| `dark` | `boolean` | `false` | Enable sophisticated Dark Mode theme. |
| `showStatus` | `boolean` | `true` | Show/hide the "Saved at..." status in the toolbar. |
| `toolbarItems` | `string[]` | `all` | Array of tool IDs to display (e.g., `['bold', 'table']`). |
| `onSave` | `function` | `undefined` | Callback triggered when content is saved. |
| `autoSaveInterval` | `number` | `1000` | Delay in ms before auto-save triggers after typing. |
| `imageEndpoints` | `object` | `undefined` | Custom upload endpoint configuration: `{ upload: string }`. |
| `cloudinaryFallback` | `object` | `undefined` | Cloudinary settings: `{ cloudName: string, uploadPreset: string }`. |
| `maxImageSizeMB` | `number` | `5` | Maximum image size in MB (enforced pre and post compression). |

## 🛠 API Methods

- `destroy()`: **Crucial** - Cleans up DOM, event listeners, and memory leaks.
- `getHTML()`: Returns the content as a sanitized HTML string.
- `setHTML(html)`: Programmatically sets the editor content.
- `focus()`: Forces focus onto the editor.
- `setDarkMode(boolean)`: Dynamically toggle dark mode.
- `insertTable(rows, cols)`: Programmatically insert a table.
- `insertImage(url, id, isLoading)`: Programmatically insert an image with optional loading state.

## 💡 Troubleshooting: Duplicate Editors?
If you see multiple toolbars or editors, it's likely because:
1. **React Strict Mode**: Ensure you call `editor.destroy()` in the `useEffect` cleanup.
2. **Missing Cleanup**: The editor injects elements into the DOM; if you don't destroy it when the component unmounts, those elements remain.

---

## 📝 Patch Notes

### v1.2.0 (Image Management Power-Up)
- **Advanced Image Pipeline**: Added drag-and-drop/paste support with automatic client-side **WebP compression**.
- **Flexible Storage**: Introduced support for custom upload endpoints and **Cloudinary** fallback.
- **Interactive UX**: Added loading state previews, 4-corner resizing handles, and native `<figcaption>` support.
- **Smart Deletion**: Images can now be easily removed with Backspace/Delete when selected.

### v1.1.2 (Security & Performance)
- **Aggressive Size Optimization**: Reduced packed size to **28kB** by moving to ESM-only and pruning datasets.
- **Hardened Sanitization**: Centralized all HTML processing through a unified security layer (Rating 9.8/10).
- **Safe UI Rendering**: Eliminated `innerHTML` usage in all UI components for zero-trust text rendering.
- **CJS Build Deprecation**: Removed CommonJS versions to optimize for modern ESM-based environments.

### v1.1.1 (Quick Fixes)
- Fixed missing `destroy()` export.
- Resolved memory leaks in image resizer.
- Prevented duplicate editors in React Strict Mode.

---

## 📄 License

MIT © [Anuj Nainwal](https://github.com/anujnainwal)
