# InkFlow Plugin System Architecture

This document outlines the proposed design for a modular plugin system in the InkFlow Rich Text Editor.

## 1. Research Findings

Based on an analysis of popular editors, we can categorize plugin systems into two main types:

| Editor | Architecture Type | Key Features |
| :--- | :--- | :--- |
| **TipTap** | Extension-based (Headless) | Extensions define new nodes, marks, and commands. Built on ProseMirror schemas. |
| **Lexical** | Node-centric | Minimal core. Plugins are simple functions that register nodes, transforms, and listeners. |
| **CKEditor 5** | Fully modular | Everything is a plugin. Uses an event-based system (`Emitter`/`Observable`) and its own data model. |
| **Quill** | Module-based | Features are added as "modules". Uses "Delta" format for state. |

## 2. Current InkFlow State

InkFlow currently uses a monolithic `CoreEditor` class. Features like Tables, Images, and History are either hardcoded into the core or tightly coupled through specific Manager classes.

**Challenges:**
- `Editor.ts` is growing too large (1400+ lines).
- Adding new features requires modifying core logic.
- Users cannot easily enable/disable specific features.

## 3. Proposed Architecture: `InkFlow-Extension` Pattern

We will adopt a hybrid approach inspired by TipTap (for ease of use) and Lexical (for simplicity), ensuring compatibility for universal plugins like **@mentions**, **slash commands**, and **custom embeds**.

### 3.1 The `Plugin` Interface

```typescript
export interface InkFlowPlugin {
  name: string;
  
  // 1. Lifecycle & Core Hooks
  init?(editor: CoreEditor): void;
  destroy?(): void;
  
  // 2. Node & Schema Extension
  // Allows plugins to define custom HTML tags and how they behave
  nodes?(): Array<{
    tag: string;
    type: 'block' | 'inline' | 'atom';
    render: (props: any) => HTMLElement;
    parse: (element: HTMLElement) => any; // deserialize from HTML
  }>;
  
  // 3. Input Rules (The "@mention" trigger)
  // Automatically triggers logic when a regex matches user input
  inputRules?(): Array<{
    find: RegExp;
    handler: (match: RegExpExecArray) => void;
  }>;
  
  // 4. Floating UI & Decorators
  // For dropdowns, tooltips, and suggest boxes
  onSelectionChange?(selection: Selection, coords: { x: number, y: number }): void;

  // 5. Command & Event hooks
  registerCommands?(): Record<string, CommandFunction>;
  onPaste?(event: ClipboardEvent): boolean | void;
}
```

### 3.2 Key Universal Features

#### A. Node Schema Support
Instead of treating all content as generic HTML, plugins can "own" specific tags. For a **Mention Plugin**, it would register a `<span class="mention">` tag. The editor core will ensure these nodes are protected during normalization.

#### B. Input Rules (Regex Triggers)
To support **@mentions**, the plugin registers a rule: `find: /@(\w+)$/`. As the user types, the editor checks the active text node. If it matches, it triggers the plugin's handler, which can then open a dropdown at the cursor coordinates.

#### C. Coordinate Mapping
The `CoreEditor` will provide a helper to get the precise pixel coordinates of the current selection. This allows any third-party UI (React, Vue, or Vanilla) to position a dropdown exactly where the user is typing.

## 4. Universal Compatibility Strategy

To ensure InkFlow plugins work for "everyone":
1. **Framework Agnostic**: The core interface uses Vanilla JS/DOM. This allows a React Mention plugin or a Svelte Mention plugin to hook into the same core logic.
2. **Standardized Serialization**: Every custom node must provide a `render` and `parse` method, ensuring that `@mentions` are saved cleanly to HTML and restored correctly.
3. **Pluggable UI**: The editor handles the "engine" (input tracking, node insertion), while the plugin handles the "UI" (the suggestion list).

## 6. Verification via Example Plugins

To ensure the plugin system is truly universal and functional, we will implement the following "Test Plugins" as part of the verification process:

| Plugin Name | Purpose | Features Tested |
| :--- | :--- | :--- |
| **Mention Plugin** | Support for `@user` | Input Rules, Floating UI, Custom Nodes. |
| **Slash Commands** | `/` menu for actions | Input Rules, Coordinate Mapping, Commands. |
| **Markdown Shortcuts** | Type `# ` for H1 | Real-time text transformation, Input Rules. |
| **Emoji Plugin** | `:smile:` to 😄 | Text replacement, Selection restoration. |

## 7. Universal Plugin Ecosystem (10 Key Plugins)

We have analyzed 10 industry-standard plugins to verify if the `InkFlow-Extension` architecture is future-proof.

| # | Plugin Name | Logic | Compatibility | InkFlow Hook Used |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **@Mentions** | Intercepts `@` + Floating UI | ✅ Yes | `inputRules`, `onSelectionChange` |
| 2 | **Collaboration (Yjs)** | Real-time state syncing | ✅ Yes | `init`, `onInput` |
| 3 | **Auto-link** | Regex scan for URLs | ✅ Yes | `inputRules`, `onPaste` |
| 4 | **Markdown Shortcuts**| `# ` -> H1, `* ` -> UL | ✅ Yes | `inputRules` |
| 5 | **Code Highlights** | Syntax highlighting via Lowlight| ✅ Yes | `nodes`, `onInput` |
| 6 | **Slash Commands** | `/` menu for blocks | ✅ Yes | `inputRules`, `onSelectionChange` |
| 7 | **Word Count** | Real-time metrics display | ✅ Yes | `onInput`, `init` |
| 8 | **Emoji Picker** | `:smile:` -> 😄 | ✅ Yes | `inputRules` |
| 9 | **Placeholder** | Visual hint on empty line | ✅ Yes | `init`, `onInput` |
| 10| **Table Support** | Grid management & resizing | ✅ Yes | `nodes`, `registerCommands` |

### Detailed Architecture Acceptance Check

- **Input Rules Interceptor**: Tested against #1, #3, #4, #6, #8. The regex engine in `CoreEditor` will successfully trigger these.
- **Node Schema (`nodes()`)**: Tested against #5 and #10. Allows registration of complex `pre/code` and `table` elements without core interference.
- **Coordinate Mapping**: Tested against #1 and #6. Essential for positioning the "User List" or "Command List" next to the cursor.
- **Lifecycle Management**: Tested against #2 and #7. `init` and `destroy` hooks ensure external services (WebSockets, UI counters) are managed cleanly.

## 8. Migration Plan
...

1. **Core Refactoring**: Implement the `registerPlugin` logic in `CoreEditor`.
2. **Feature Extraction**:
   - Extract `Table` logic into `TablePlugin`.
   - Extract `Image` logic into `ImagePlugin`.
   - Extract `History` logic into `HistoryPlugin`.
3. **API Exposure**: Provide a public API for users to add custom plugins via `EditorOptions`.

## 5. Benefits

- **Scalability**: New features can be developed in isolation.
- **Customizability**: Users can opt-out of heavy features like Tables or Images to reduce bundle size.
- **Maintainability**: `Editor.ts` will shrink significantly, focusing only on the core "contenteditable" engine.
