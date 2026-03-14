# CodeBlock Implementation Plan

This document outlines the strategy for adding a CodeBlock feature to the InkFlow Editor.

## Goals
- Allow users to wrap text in a monospaced code block.
- Use standard `<pre>` and `<code>` tags for semantic correctness and compatibility.
- Provide a clean, premium styling for code blocks.
- Ensure smooth interaction (e.g., handling Enter key transitions).

## Proposed Changes

### 1. Toolbar Item (`src/ui/toolbar/items/CodeBlock.ts`)
- **Type**: `button`
- **Icon**: Lucide `code` (`<svg viewBox="0 0 24 24" ...><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`)
- **Command**: `formatBlock` with value `PRE`.

### 2. Editor Core (`src/core/Editor.ts`)
- **Command Handling**: `execute('formatBlock', 'PRE')` is natively supported by `execCommand`, but we may need to wrap it in a custom logic if we want to ensure a `<code>` tag is also present inside the `<pre>`.
- **Normalization**: Ensure `normalizeHTML` preserves `<pre>` and `<code>` tags and fixes any invalid nesting (e.g., `<p>` inside `<pre>`).
- **Enter Key Handling**: If the user is inside a `pre` tag and presses `Enter`, they should stay inside it, but `Shift+Enter` or a specific logic might be needed to "break out" of the code block.

### 3. Styling (`src/styles/editor.css`)
- **Background**: Subtle slate/indigo tinted contrast.
- **Font**: Monospace (JetBrains Mono, Fira Code, etc.).
- **Padding**: Premium spacing with rounded corners.
- **Overflow**: Horizontal scrolling for long lines.

## Implementation Steps
1. Create the `CodeBlock.ts` toolbar item.
2. Register it in `registry.ts`.
3. Add CSS rules for `.te-content pre` and `.te-content code`.
4. Update `Editor.ts` normalization logic if necessary.
5. Verify behavior with complex selections.

## References
- [Envato Tuts+: Create a WYSIWYG Editor](https://code.tutsplus.com/articles/create-a-wysiwyg-editor-with-the-contenteditable-attribute--cms-25657)
- [Dev.to: Build a Rich Text Editor](https://dev.to/ismailmussaliev/how-to-build-a-rich-text-editor-with-javascript-142f)
- [TinyCloud: Guide to Code Blocks](https://www.tiny.cloud/blog/rich-text-editor-code-block/)
- [MDN: execCommand formatBlock](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#formatblock)
