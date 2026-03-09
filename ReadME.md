# @meenainwal/rich-text-editor 🚀 | Premium WYSIWYG Editor

[![NPM Downloads](https://img.shields.io/npm/dw/@meenainwal/rich-text-editor.svg)](https://www.npmjs.com/package/@meenainwal/rich-text-editor)
[![NPM Version](https://img.shields.io/npm/v/@meenainwal/rich-text-editor.svg)](https://www.npmjs.com/package/@meenainwal/rich-text-editor)

A premium, ultra-lightweight, and framework-agnostic **WYSIWYG rich text editor** built entirely with Vanilla TypeScript. Featuring a sophisticated **Slate & Indigo** design system, it provides a flawless writing experience for React, Next.js, and modern web applications.

![Editor Preview](./images/editor-preview.png)

## 🎮 Live React Preview
Wanna see it in action? Try the **Interactive React Demo** on StackBlitz:
[**Run Demo on StackBlitz**](https://stackblitz.com/edit/vitejs-vite-e8u5yntq?embed=1&view=preview)

## ✨ Premium Features & Why Choose This Editor?

### 👍 Key Pros & Capabilities
- **Microscopic Footprint**: Only **~11kB** (Initial gzipped JS) + **2.3kB** (CSS). Total initial load is **~13kB gzipped**.
- **Performance Optimized**: Heavy components like the Emoji Picker (~19kB) are **lazy-loaded** only when clicked, ensuring your app stays fast.
- **Framework Agnostic**: Native support for **React**, **Next.js**, **Vue**, **Angular**, and **Svelte**.
- **Auto-Formatting Magic**: Intelligently parses pasted HTML strings into clean, formatted rich text.
- **Professional UI/UX**: Modern aesthetics curated with a polished Slate & Indigo color palette.
- **Table Support**: Natively insert and style interactive HTML tables.
- **Emoji Picker**: Integrated searchable emoji library for expressive content.
- **Dark Mode**: Sophisticated dark theme for premium developer experiences.
- **Customizable Toolbar**: Granular control over tool visibility and layout.

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

### 📦 Bundle Size Breakdown
Transparency matters. Here's a breakdown of what your users download:

| Asset | Minified | Gzipped (Download) |
| :--- | :--- | :--- |
| **Core Bundle (JS)** | ~45 kB | **~11 kB** |
| **Styles (CSS)** | ~9 kB | **~2 kB** |
| **Total Initial Load** | **~54 kB** | **~13 kB** |
| Emoji Picker (Lazy-loaded) | +19 kB | +3 kB |

> [!TIP]
> The editor is optimized for performance. Features like the **Emoji Picker** are only loaded when needed, keeping your initial page load lightning fast.

### 👎 Cons (Current Limitations)
- Base64 image storage can increase the raw output string size for very large images (Backend S3 uploading adapter coming soon).
- Markdown shortcut typing (e.g., typing `#` for H1) is not natively supported yet.

---

## 📦 Installation

```bash
npm install @meenainwal/rich-text-editor
```

## 🚀 Quick Start

### Basic Usage (Vanilla JS)

```javascript
import { TestEditor } from '@meenainwal/rich-text-editor';
import '@meenainwal/rich-text-editor/style'; // Simple style import

const container = document.getElementById('editor');
const editor = new TestEditor(container, {
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
import { TestEditor } from '@meenainwal/rich-text-editor';
import '@meenainwal/rich-text-editor/style';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<TestEditor | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = new TestEditor(containerRef.current, {
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
import { TestEditor } from '@meenainwal/rich-text-editor';
import '@meenainwal/rich-text-editor/style';

export default function MyEditor() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const editor = new TestEditor(containerRef.current, {
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

## 🛠 API Methods

- `destroy()`: **Crucial** - Cleans up DOM, event listeners, and memory leaks.
- `getHTML()`: Returns the content as a sanitized HTML string.
- `setHTML(html)`: Programmatically sets the editor content.
- `focus()`: Forces focus onto the editor.
- `setDarkMode(boolean)`: Dynamically toggle dark mode.
- `insertTable(rows, cols)`: Programmatically insert a table.

## 💡 Troubleshooting: Duplicate Editors?
If you see multiple toolbars or editors, it's likely because:
1. **React Strict Mode**: Ensure you call `editor.destroy()` in the `useEffect` cleanup.
2. **Missing Cleanup**: The editor injects elements into the DOM; if you don't destroy it when the component unmounts, those elements remain.

## 📝 Patch Notes (v1.1.1)

### 🐛 Bug Fixes
- **Fixed Missing `destroy()` Export**: Resolved TypeScript error where the `destroy()` method was missing from the generated type declarations.
- **Image Resizer Cleanup**: Fixed a memory leak where window-level event listeners for image resizing were not being removed on editor destruction.
- **Double Initializing Failsafe**: Added an internal check to clear the container before initialization, preventing duplicate editors in React Strict Mode.
- **Lazy-Loaded Emojis**: Moved the Emoji List to a separate chunk (~19kB) that only loads when the picker is opened, reducing the initial bundle size.

### ✨ Improvements
- **Optimized Initial Load**: Critical path JS is now only **~11kB gzipped**.
- **Robust Documentation**: Added detailed React and Next.js implementation guides with proper lifecycle cleanup examples.
- **Troubleshooting Guide**: New section for common pitfalls like duplicate editors and SSR issues.
- **Live Demo**: Added StackBlitz interactive demo for instant preview.

---

## 📄 License

MIT © [Anuj Nainwal](https://github.com/anujnainwal)
