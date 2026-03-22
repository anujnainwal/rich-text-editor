# 🚀 inkflow Upgrade Roadmap
*Based on Competitor Analysis — March 2025*

> **Goal:** Make inkflow the best free, lightweight, framework-agnostic WYSIWYG editor by closing the critical feature gaps identified against TipTap, Lexical, and Froala — while staying under **50kB** packed.

---

## 🎯 North Star

> **"The Notion-quality editing experience in a 28kB MIT-licensed package."**

No competitor delivers:
- Plugin architecture + ~28kB + MIT + Dark Mode + 5 toolbar positions + Zero framework dependency

inkflow can own this position entirely.

---

## Phase 1 — Foundation: Plugin System (`v0.2.0`)
*Priority: CRITICAL | Estimated: 2–3 weeks*

This is the single most important upgrade. Every other feature depends on it.

### What to Build
Implement the `InkFlowPlugin` interface from `minds/plugin-system-architecture.md`:

```typescript
export interface InkFlowPlugin {
  name: string;
  init?(editor: CoreEditor): void;
  destroy?(): void;
  inputRules?(): Array<{ find: RegExp; handler: (match: RegExpExecArray) => void }>;
  onSelectionChange?(selection: Selection, coords: { x: number; y: number }): void;
  registerCommands?(): Record<string, () => void>;
  onPaste?(event: ClipboardEvent): boolean | void;
}
```

### Changes Required
- Add `registerPlugin(plugin: InkFlowPlugin)` to `CoreEditor`
- Add `plugins?: InkFlowPlugin[]` to `EditorOptions`
- Add input rules engine (regex scanner on every keyup)
- Add coordinate mapping helper (`getCursorCoords()`)
- Export `InkFlowPlugin` type from `src/index.ts`

### Deliverable
Users can write:
```typescript
const editor = new InkflowEditor(container, {
  plugins: [MyMentionPlugin, MySlashPlugin]
});
```

---

## Phase 2 — Developer Experience (`v0.3.0`)
*Priority: HIGH | Estimated: 1–2 weeks*

### 2A. Markdown Shortcuts
Keyboard shortcuts that auto-format as you type — a feature in every major editor:

| Typed | Result |
|:---|:---|
| `# ` (space) | H1 heading |
| `## ` | H2 heading |
| `### ` | H3 heading |
| `** **` or `__ __` | Bold |
| `* * ` or `- ` | Bullet list |
| `1. ` | Ordered list |
| `> ` | Blockquote |
| `` ``` `` | Code block |
| `---` | Horizontal rule |

**Implementation:** Input rules engine (Phase 1) + regex handlers per shortcut.

### 2B. Slash Commands (`/` menu)
Typed `/` opens a floating command palette — standard in Notion, Linear, Coda:

| Command | Action |
|:---|:---|
| `/h1`, `/h2`, `/h3` | Insert heading |
| `/table` | Insert table |
| `/image` | Open image picker |
| `/code` | Insert code block |
| `/quote` | Insert blockquote |
| `/divider` | Insert horizontal rule |
| `/emoji` | Open emoji picker |

**Implementation:** Plugin using `inputRules` + `onSelectionChange` for positioning.

---

## Phase 3 — Collaboration-Ready Features (`v0.4.0`)
*Priority: HIGH | Estimated: 2–3 weeks*

### 3A. @Mentions Plugin
```typescript
import { MentionsPlugin } from 'inkflow/plugins/mentions';

const editor = new InkflowEditor(container, {
  plugins: [
    MentionsPlugin({
      fetchUsers: async (query) => fetch(`/api/users?q=${query}`).then(r => r.json()),
      onMention: (user) => console.log('Mentioned:', user)
    })
  ]
});
```

**What it renders:** `<span class="inkflow-mention" data-id="123">@John</span>`

### 3B. Word Count & Reading Time
- Live character/word/sentence count in status bar
- Estimated reading time (`words / 200`)
- Toggle via `showWordCount: true` option

---

## Phase 4 — Content Power-Ups (`v0.5.0`)
*Priority: MEDIUM | Estimated: 2 weeks*

### 4A. Syntax Highlighting in Code Blocks
- Integrate **Prism.js** (lightweight, modular, 2kB core)
- Auto-detect or allow user to specify language
- Language selector dropdown in code block toolbar
- Supports: JS, TS, Python, Bash, JSON, CSS, HTML, SQL

### 4B. Export Engine
| Format | Method |
|:---|:---|
| **Markdown** | `editor.exportMarkdown()` — converts HTML to MD |
| **Plain Text** | `editor.exportText()` — strip all HTML |
| **JSON** | `editor.exportJSON()` — structured block array |
| **HTML** | `editor.getHTML()` — already exists ✅ |

### 4C. Find & Replace
- `Ctrl+F` opens an overlay panel
- Highlight all matches
- Replace one / Replace all
- Case-sensitive toggle

---

## Phase 5 — AI & Future (`v1.0.0`)
*Priority: FUTURE | Estimated: 3–4 weeks*

### 5A. AI Writing Hooks
Framework-agnostic AI hooks — users bring their own API key/model:

```typescript
new InkflowEditor(container, {
  ai: {
    complete: async (prompt) => await callOpenAI(prompt),  // user's own handler
    improve: async (selectedText) => await callOpenAI(`Improve: ${selectedText}`),
  }
});
```

### 5B. ARIA / Accessibility
- Full ARIA role annotations (`role="textbox"`, `aria-label`, `aria-multiline`)
- Keyboard trap management for modals/dropdowns
- Screen reader announcements for toolbar actions
- WCAG 2.1 AA compliance target

### 5C. Track Changes (Optional/Plugin)
- Record insertions and deletions as decorations
- Accept/reject UI per change
- Useful for editorial workflows

---

## 📐 Architecture Constraints

| Constraint | Target |
|:---|:---|
| Core bundle size | Stay < **50kB** packed |
| Plugins (lazy) | Each plugin < **5kB** |
| Zero mandatory deps | Only `dompurify` at core |
| Pure ESM | No CJS |
| Framework-agnostic | Vanilla JS API only |

---

## 🗓 Summary Timeline

| Phase | Version | Focus | ETA |
|:---|:---|:---|:---|
| 1 | `v0.2.0` | Plugin system + input rules | ~3 weeks |
| 2 | `v0.3.0` | Markdown shortcuts + slash commands | ~2 weeks |
| 3 | `v0.4.0` | @Mentions + word count | ~3 weeks |
| 4 | `v0.5.0` | Syntax highlighting + export + find/replace | ~2 weeks |
| 5 | `v1.0.0` | AI hooks + ARIA + track changes | ~4 weeks |

---

## 🏆 Competitive Positioning After Roadmap

| Editor | Bundle | Free | Plugin | AI | Collab | Dark Mode |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **inkflow v1.0** | ~45kB | ✅ | ✅ | ✅ hooks | ❌ | ✅ |
| TipTap | 100kB+ | ✅ core | ✅ | ✅ paid | ✅ paid | ❌ |
| Lexical | 30kB | ✅ | ✅ | ❌ | ⚠️ | ❌ |
| TinyMCE | 400kB | ⚠️ | ✅ | ✅ paid | ✅ paid | ❌ |
| Quill | 43kB | ✅ | ⚠️ | ❌ | ❌ | ❌ |

**inkflow's unique position: Smallest fully-featured free editor with dark mode, plugin system, and AI hooks.**
