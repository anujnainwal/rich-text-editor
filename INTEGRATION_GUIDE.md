# Inkflow Editor: The Ultimate Integration Guide

Inkflow is a high-performance, **28kB (packed)** rich-text editor designed for developers who demand premium aesthetics and robust security without the weight of traditional editors.

---

## 1. Installation & Environment Setup

### Install via NPM
```bash
npm install inkflow
```

### Import Assets
Inkflow is exported as an ES Module. You must import both the logic and the styles.

```typescript
// Main Editor Class
import { InkflowEditor } from 'inkflow';

// Essential Styles (includes Slate & Indigo design)
import 'inkflow/style';
```

---

## 2. Step-by-Step Initialization

### Step A: Prepare the Container
Create a `div` in your HTML. Inkflow will automatically handle responsive sizing.

```html
<div id="editor-container" style="max-width: 800px; margin: 20px auto;"></div>
```

### Step B: Basic Setup
Initialize with a simple configuration.

```typescript
const editor = new InkflowEditor(document.getElementById('editor-container'), {
  placeholder: 'Type something amazing...',
  autofocus: true
});
```

---

## 3. Comprehensive Feature List

### Core Formatting
Inner logic supports all standard formatting out-of-the-box:
- **Typography:** Bold, Italic, Underline, Strikethrough, Font Size (px), Font Family.
- **Lists:** Ordered and Bulleted lists with intelligent nesting cleanup.
- **Blocks:** Quotes, Code blocks, and Heading levels (H1-H6).
- **Alignment:** Left, Center, Right, and Justified.

### Advanced Modules
1.  **Interactive Tables:** Dynamic row/column addition and deletion.
2.  **Emoji Picker:** A curated set of high-use emojis optimized for bundle size.
3.  **Floating Toolbar:** Appears on text selection for quick formatting (Mobile-friendly).
4.  **Auto-Save System:** Built-in debounce logic with visual status indicators.

---

## 4. Deep-Dive Configuration (API)

The `EditorOptions` object allows for granular control.

### Behavior Configuration
```typescript
const options = {
  autoSave: true,           // Enables auto-save logic
  autoSaveInterval: 2000,    // Saves every 2 seconds of inactivity
  showStatus: true,         // Displays "Saved at..." in the toolbar
  onChange: (html) => {      // Fires on every keystroke
    console.log("Current HTML:", html);
  }
};
```

### UI Customization (Toolbar Filtering)
You can choose exactly which tools to show by passing their IDs:
```typescript
toolbarItems: ['bold', 'italic', 'heading', 'divider', 'link', 'image', 'table']
```

---

## 5. Visual Excellence: The Theme Engine

Inkflow uses a CSS-variable-based theme engine. You can pass a `theme` object to match your brand.

```typescript
const editor = new InkflowEditor(container, {
  dark: true, // Enable built-in Dark Mode
  theme: {
    primaryColor: '#6366f1',    // Brand identity color
    primaryHover: '#4f46e5',    
    radiusLg: '16px',           // Rounded corners for the container
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    bgEditor: '#1e1e2e'         // Custom background color
  }
});
```

---

## 6. Advanced Image Handling

Inkflow treats images as interactive objects. It supports **Image Resizing**, **Captions**, and **Automatic Pre-upload Compression**.

### Implementation Example:
```typescript
const editor = new InkflowEditor(container, {
  imageEndpoints: {
    upload: 'https://your-api.com/upload',
    delete: 'https://your-api.com/delete'
  },
  maxImageSizeMB: 2, // Larger images are auto-compressed client-side
  onImageDelete: (id, url) => {
    console.log(`Image ${id} was removed from the document`);
  }
});
```

---

## 7. Security & Sanitization

Security is handled automatically at every step (`handlePaste`, `setHTML`, `normalize`).

-   **XSS Protection:** Powered by a hard-coded strict whitelist in `DOMPurify`.
-   **Malicious Schemes:** Strictly blocks `javascript:`, `data:`, and `vbscript:` URIs.
-   **Link Security:** Every link inserted is automatically forced to have `rel="noopener noreferrer"`.

---

## 8. Programmatic Control (Public Methods)

Use these methods to interact with the editor via your own buttons or external logic.

```typescript
// 1. Get the content
const content = editor.getHTML(); 

// 2. Set the content (automatically sanitized)
editor.setHTML('<h1>Hello World</h1><p>Secure content.</p>');

// 3. Command Execution
editor.execute('bold'); // Bolds selection
editor.execute('fontSize', '24px');

// 4. Cleanup
editor.destroy(); // Removes all listeners and DOM elements
```
