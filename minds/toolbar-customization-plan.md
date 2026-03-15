# Toolbar Customization Plan

This plan outlines the technical approach for allowing users to customize the toolbar's position (Top, Bottom, or Floating) in the InkFlow Editor.

## 1. Options Extension

Add a new `toolbarPosition` property to the `EditorOptions` interface in `src/core/Editor.ts`:

```typescript
export type ToolbarPosition = 'top' | 'bottom' | 'floating';

export interface EditorOptions {
  // ... existing options
  toolbarPosition?: ToolbarPosition; // default: 'top'
}
```

## 2. Structural Changes

### InkFlowEditor (`src/index.ts`)
The `InkFlowEditor` constructor will handle the DOM placement of the toolbar based on the `toolbarPosition` option.

- **Top (Default)**: `this.container.insertBefore(this.toolbar.el, this.editableElement);`
- **Bottom**: `this.container.appendChild(this.toolbar.el);` (Toolbar element will appear after `editableElement`)
- **Floating**: 
    - The main toolbar is NOT attached to the container.
    - The existing `FloatingToolbar.ts` logic is used (or expanded) to show the full set of tools only when text is selected or the editor is clicked.

## 3. CSS Enhancements (`src/styles/editor.css`)

New classes to handle different states:

- `.te-toolbar-bottom`:
    - `border-bottom: none;`
    - `border-top: 1px solid var(--te-border-color);`
    - `order: 2;` (if using flex layout)
    - `position: sticky; bottom: 0;`

- `.te-container.toolbar-bottom`: 
    - Adjust internal layout to move the toolbar to the bottom.

## 4. Floating Mode Implementation

The floating mode requires more careful design:
- It should likely replace the fixed toolbar entirely.
- Need a toggle or trigger to show the full toolbar if nothing is selected (e.g., a "bubble" button).
- Ensure consistency with the existing selection-based floating toolbar.

## 5. Proposed Implementation Sequence

1.  **Phase 1: Top/Bottom Toggle**: Implement the static repositioning logic in `index.ts` and CSS.
2.  **Phase 2: Floating Strategy**: Refactor `Toolbar.ts` and `FloatingToolbar.ts` to share logic and allow for a fully floating main toolbar.
3.  **Phase 3: Integration**: Update the demo `index.html` with a selector to test different positions.
