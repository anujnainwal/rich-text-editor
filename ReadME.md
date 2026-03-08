# @meenainwal/rich-text-editor 🚀 | Premium WYSIWYG Editor

[![NPM Downloads](https://img.shields.io/npm/dw/@meenainwal/rich-text-editor.svg)](https://www.npmjs.com/package/@meenainwal/rich-text-editor)
[![NPM Version](https://img.shields.io/npm/v/@meenainwal/rich-text-editor.svg)](https://www.npmjs.com/package/@meenainwal/rich-text-editor)

A premium, ultra-lightweight, and framework-agnostic **WYSIWYG rich text editor** built entirely with Vanilla TypeScript. Featuring a sophisticated **Slate & Indigo** design system, it provides a flawless writing experience for React, Next.js, and modern web applications.

![Editor Preview](./images/editor-preview.png)

## ✨ Premium Features & Why Choose This Editor?

### 👍 Key Pros & Capabilities
- **Zero Dependencies**: Pure Vanilla JS/TypeScript. No bloated third-party libraries.
- **Microscopic Footprint**: Only **~25kB** gzipped, making it one of the most lightweight editors available.
- **Framework Agnostic**: Native support for **React**, **Next.js**, **Vue**, **Angular**, and **Svelte**.
- **Auto-Formatting Magic**: Intelligently parses pasted HTML strings into clean, formatted rich text.
- **Professional UI/UX**: Modern aesthetics curated with a polished Slate & Indigo color palette.
- **Table Support**: Natively insert and style interactive HTML tables.
- **Emoji Picker**: Integrated searchable emoji library for expressive content.
- **Dark Mode**: Sophisticated dark theme for premium developer experiences.
- **Customizable Toolbar**: Granular control over tool visibility and layout.

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

### In React / Next.js (SSR Safe)

```tsx
"use client";
import { useEffect, useRef } from 'react';
import { TestEditor } from '@meenainwal/rich-text-editor';
import '@meenainwal/rich-text-editor/style';

export default function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      new TestEditor(containerRef.current, {
        onSave: (html) => console.log("Saved:", html)
      });
    }
  }, []);

  return <div ref={containerRef} />;
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

- `getHTML()`: Returns the content as a sanitized HTML string.
- `setHTML(html)`: Programmatically sets the editor content.
- `focus()`: Forces focus onto the editor.
- `setDarkMode(boolean)`: Dynamically toggle dark mode.
- `insertTable(rows, cols)`: Programmatically insert a table.

---

## 📄 License

MIT © [Anuj Nainwal](https://github.com/anujnainwal)
