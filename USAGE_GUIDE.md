# Inkflow Editor - Usage Guide

Inkflow is a premium, lightweight (~28kB packed), and framework-agnostic WYSIWYG rich text editor. 

## Installation

```bash
npm install inkflow-editor
```

## Quick Start

Import the editor and its styles to get started.

```typescript
import { InkflowEditor } from 'inkflow-editor';
import 'inkflow-editor/style';

const container = document.getElementById('editor-container');
const editor = new InkflowEditor(container, {
  placeholder: 'Start writing...',
  autofocus: true,
  autoSave: true,
  onSave: (html) => console.log('Saved Content:', html)
});
```

## Configuration Interface

The `EditorOptions` interface allows you to customize the behavior and look of the editor.

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `placeholder` | `string` | `undefined` | Placeholder text for empty editor. |
| `autofocus` | `boolean` | `false` | Focus editor immediately on load. |
| `dark` | `boolean` | `false` | Enable/Disable Dark Mode styling. |
| `autoSave` | `boolean` | `false` | Whether to trigger `onSave` automatically. |
| `autoSaveInterval`| `number` | `1000` | Delay (ms) before auto-saving. |
| `showStatus` | `boolean` | `true` | Show/Hide the "Saved at..." status in toolbar. |
| `toolbarItems` | `string[]` | `undefined` | Filter tools by ID (e.g. `['bold', 'italic', 'link']`). |

### Custom Theme (Styling)
You can deeply customize the design via the `theme` object:

```typescript
new InkflowEditor(container, {
  theme: {
    primaryColor: '#6366f1', // Indigo
    radiusLg: '12px',
    bgEditor: '#ffffff',
  }
});
```

## Advanced Features

### 1. Image Uploads
Configure endpoints to handle images beyond the default Base64 fallback.

```typescript
options: {
  imageEndpoints: { 
    upload: '/api/upload', 
    delete: '/api/delete' 
  },
  maxImageSizeMB: 5 // Auto-compresses images to fit
}
```

### 2. Security
The editor strictly sanitizes all input and output using `DOMPurify`.
- Malicious `<script>` tags and event handlers are automatically stripped.
- All links are auto-hardened with `rel="noopener noreferrer"`.

### 3. API Methods
- `editor.getHTML()`: Returns sanitized HTML.
- `editor.setHTML(html)`: Safely updates editor content.
- `editor.undo() / editor.redo()`: Control history programmatically.
- `editor.destroy()`: Cleanup and remove from DOM.
