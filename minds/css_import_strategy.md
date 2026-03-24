# CSS Import Strategy for NPM Consumers

When publishing a UI library like `@inkflow/rich-text-editor`, handling CSS imports is a critical part of the developer experience (DX). By default, Vite extracts CSS into a separate file (`dist/rich-text-editor.css`), which requires manual importing by the user.

## 1. Current Manual Approach

Users currently need to import the CSS manually in their main entry file:

```javascript
import { TestEditor } from '@inkflow/rich-text-editor';
// Manual import required
import '@inkflow/rich-text-editor/dist/rich-text-editor.css';
```

### Pros
- **Performance**: CSS can be loaded in parallel with JS.
- **Customization**: Users can choose not to import our CSS if they want to style the editor from scratch.

### Cons
- **Friction**: It's an extra step that new users often miss.
- **Maintenance**: If the CSS filename changes, it breaks the user's build.

---

## 2. Strategy: Automatic Style Injection (Zero-Config)

To provide a "premium" experience, we can automate this. When the user imports `TestEditor`, the styles are automatically injected into the document head.

### Proposed Implementation
We can modify the entry point to include a style injector:

```typescript
import styles from './styles/editor.css?inline';

function injectStyles() {
  if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.id = 'rich-text-editor-styles';
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
  }
}

// Call injection on load or initialization
injectStyles();
```

### Why this is better
- **Plug-and-Play**: The editor works immediately after `npm install`.
- **Reliability**: No more "missing styles" bug reports.

---

## 3. Strategy: Improved Package Exports

We can also simplify the manual import path using the `exports` field in `package.json`.

### Proposed Change
Add a `./style` export:

```json
"exports": {
  ".": { ... },
  "./style": "./dist/rich-text-editor.css"
}
```

### Usage
Users can then simply do:
```javascript
import '@inkflow/rich-text-editor/style';
```

---

## Recommendation for Phase 2

We should implement **Automatic Style Injection** as the primary method to ensure the best possible "out-of-the-box" experience. We will continue to export the raw CSS for advanced users who need to customize or minimize their CSS bundles.
