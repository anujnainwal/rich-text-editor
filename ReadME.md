# Premium Rich Text Editor

A lightweight, framework-agnostic, and beautifully designed rich text editor built with TypeScript. Featuring a sophisticated **Slate & Indigo** design system, it provides a premium writing experience with modern interactive states and smooth transitions.

![Editor Preview](file:///home/nainwal/.gemini/antigravity/brain/3f0400ba-f085-44cc-ad19-5a06d9e21eb0/media__1772819009508.png)

## ✨ Features

- 💅 **Premium UI**: Modern aesthetic with a curated color palette and refined geometry.
- 🚀 **Zero Dependencies**: Pure Vanilla JS/TypeScript implementation.
- 🛠 **Framework Agnostic**: Works perfectly with React, Vue, Svelte, or Next.js.
- 🏗 **Clean HTML**: Produces semantic and sanitized HTML output.
- 🔗 **Smart Links**: Automatically adds `target="_blank"` and security attributes.
- 🔡 **Advanced Formatting**: Headings (H1-H6), dynamic font sizes, font families, and more.

## 📦 Installation

```bash
npm install @meenainwal/rich-text-editor
```

## 🚀 Quick Start

### Basic Usage

```javascript
import { CoreEditor } from '@meenainwal/rich-text-editor';
import '@meenainwal/rich-text-editor/dist/test-editor.css';

const container = document.getElementById('editor');
const editor = new CoreEditor(container, {
  placeholder: 'Type something beautiful...',
  autofocus: true
});

// Get content
const content = editor.getHTML();
```

### In React

```tsx
import { useEffect, useRef } from 'react';
import { CoreEditor } from '@meenainwal/rich-text-editor';
import '@meenainwal/rich-text-editor/dist/test-editor.css';

export const EditorComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
        new CoreEditor(containerRef.current);
    }
  }, []);

  return <div ref={containerRef} />;
};
```

## ⚙️ Configuration

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `placeholder` | `string` | `undefined` | The placeholder text when the editor is empty. |
| `autofocus` | `boolean` | `false` | Whether to focus the editor on initialization. |

## 🛠 API Methods

- `getHTML()`: Returns the content as a sanitized HTML string.
- `setHTML(html)`: Sets the editor content.
- `focus()`: Programmatically focus the editor.
- `execute(command, value)`: Execute standard editor commands.

## 📄 License

MIT © [Anuj Nainwal](https://github.com/anujnainwal)
