# 🔍 Rich Text Editor Competitor Analysis
*Research Date: March 2025 | For: inkflow upgrade planning*

---

## 1. Market Overview

The RTE market in 2025 is divided into two tiers:
- **Enterprise** (TinyMCE, CKEditor, Froala) — feature-rich, paid, heavy
- **Developer-Focused** (TipTap, Lexical, Editor.js, Quill) — modular, open-core, flexible

**inkflow's position:** Lightweight, pure Vanilla TS, framework-agnostic, MIT — a unique gap in the market that none of the above fill cleanly at ~28kB.

---

## 2. Competitor Profiles

### 🥇 TipTap
- **Model:** Open-source core (MIT) + paid Platform ($49–$999/mo)
- **Architecture:** Extension-based, built on ProseMirror
- **Bundle:** ~100kB+ for full stack
- **Key Strengths:**
  - Real-time collaboration (Yjs-based)
  - AI content creation & suggestions
  - DOCX/ODT/Markdown import-export
  - Slash commands, @mentions built-in
  - UI component library
- **Weakness:** Heavy when fully loaded, ProseMirror schema complexity, paid collab tier
- **GitHub Stars:** ~30k+
- **inkflow Gap:** Plugin system, slash commands, @mentions, markdown shortcuts, AI hooks

---

### 🥈 Lexical (Meta)
- **Model:** 100% Open Source (MIT)
- **Architecture:** Node-centric, plugin functions, React-first (but framework-agnostic)
- **Bundle:** ~30kB core (similar to inkflow!)
- **Key Strengths:**
  - Ultra-performant, minimal re-renders
  - Accessibility-first (ARIA, screen readers)
  - Input rules (regex triggers)
  - Decorator nodes for custom UI
  - Active Meta engineering team
- **Weakness:** Still pre-v1 (as of early 2025), React-centric in practice, steep learning curve, limited docs
- **inkflow Gap:** Accessibility (ARIA), decorator/node system, input rules engine

---

### 🥉 CKEditor 5
- **Model:** Open-source GPL + paid commercial license
- **Architecture:** Fully plugin-based, its own MVC data model
- **Bundle:** 200kB+ (very heavy)
- **Key Strengths:**
  - Track changes & comments
  - Real-time collaboration
  - Import/export DOCX, PDF
  - Mature enterprise ecosystem (20+ years)
- **Weakness:** Very heavy, complex setup, paid for most useful features, GPL license conflicts for proprietary use
- **inkflow Gap:** Track changes, comments/annotations system

---

### 📦 Quill.js
- **Model:** Open Source (BSD)
- **Architecture:** Delta format, modular  
- **Bundle:** ~43kB gzipped
- **Key Strengths:** Simple, easy integration, Delta format for undo/redo
- **Weakness:** **Last major release: September 2019** (maintenance-only), limited customization, struggles with large docs, no real-time collab
- **inkflow Advantage:** inkflow is already more modern and actively maintained ✅

---

### 🧱 Editor.js
- **Model:** Open Source (Apache 2.0)
- **Architecture:** Block-based, JSON output (not HTML)
- **Bundle:** ~30kB core + per-plugin
- **Key Strengths:**
  - Clean structured JSON output
  - Block-level plugin system (image, code, table each a block)
  - Headless CMS-friendly
  - Modern clean UI
- **Weakness:** Does NOT output HTML — incompatible with traditional WYSIWYG use cases, no real-time collab, limited formatting options
- **inkflow Advantage:** inkflow outputs clean HTML — more universally compatible ✅

---

### 🔧 TinyMCE
- **Model:** Open Source core + paid commercial (usage-based pricing)
- **Architecture:** Monolithic with 100+ plugins
- **Bundle:** 400kB+ (extremely heavy)
- **Key Strengths:**
  - Widest plugin ecosystem (~100+ official)
  - Accessibility compliance (WCAG 2.1 AA)
  - Multi-language support (38 languages)
  - Math/formula editing
  - All major framework SDKs
- **Weakness:** Enormous bundle, outdated UI/UX (feels like 2010), expensive at scale, complex setup
- **inkflow Advantage:** 14x smaller bundle, modern design ✅

---

### 💰 Froala
- **Model:** Paid commercial license (~$249/yr/dev)
- **Architecture:** Modular, 30+ plugins, pure JS
- **Bundle:** ~490kB full, modular reduces this
- **Key Strengths:**
  - Fast initialization (<40ms)
  - Markdown support with live preview
  - Server-side SDKs (Node, PHP, Java, .NET)
  - Math editing, syntax highlighting
  - 30+ plugins, responsive/mobile optimized
- **Weakness:** **Proprietary/paid**, no MIT license — users can't use freely
- **inkflow Advantage:** 100% free MIT, no cost to users ✅

---

## 3. Feature Gap Matrix

| Feature | inkflow | TipTap | Lexical | CKEditor | Editor.js | TinyMCE | Froala |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Free/MIT | ✅ | ✅ core | ✅ | ⚠️ GPL | ✅ | ⚠️ | ❌ |
| Bundle <30kB | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Framework Agnostic | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| Dark Mode | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Toolbar Positions | ✅ | ⚠️ | ❌ | ❌ | N/A | ⚠️ | ✅ |
| Image Pipeline | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| Table Editor | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **Plugin System** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **@Mentions** | ❌ | ✅ | ⚠️ | ✅ | ❌ | ✅ | ✅ |
| **Slash Commands** | ❌ | ✅ | ⚠️ | ❌ | ✅ | ❌ | ❌ |
| **Markdown Shortcuts** | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **AI Integration** | ❌ | ✅ | ❌ | ⚠️ | ❌ | ✅ | ❌ |
| **Track Changes** | ❌ | ✅ paid | ❌ | ✅ paid | ❌ | ✅ paid | ✅ paid |
| **Collab/Yjs** | ❌ | ✅ paid | ⚠️ | ✅ paid | ❌ | ✅ paid | ❌ |
| **ARIA/Accessibility** | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| **Code Highlighting** | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **Export (DOCX/MD)** | ❌ | ✅ paid | ❌ | ✅ paid | ❌ | ✅ paid | ✅ |
| XSS Security | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. inkflow Unique Advantages

1. **Smallest bundle** at ~28kB — tied only with Lexical core
2. **Best-in-class dark mode** — none of the competitors have dark mode built-in
3. **5 toolbar positions** — unique in the market (only Froala matches)
4. **Magic Format** — no competitor has aesthetic theme cycling
5. **Pure MIT, fully free** — no usage-based pricing ever
6. **Vanilla TypeScript** — zero framework dependency at runtime

---

## 5. Key Gaps to Close (Priority Order)

1. **Plugin System** — the single biggest architectural gap
2. **Markdown Shortcuts** — (`#` → H1, `**` → bold, `- ` → list)
3. **Slash Commands** (`/` menu) — users expect this from Notion-style apps
4. **@Mentions** — critical for team/collaborative apps
5. **ARIA Accessibility** — needed for enterprise adoption
6. **Syntax Highlighting in Code Blocks** — via Prism/Highlight.js
7. **AI Writing Hooks** — future-proofing against TipTap's AI moat
8. **Export** — Markdown and plain text export at minimum
