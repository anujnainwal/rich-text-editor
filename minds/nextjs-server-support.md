# Next.js Server-Side Support Plan (`/server`)

This document outlines the strategy for providing a dedicated server-side entry point for the editor, specifically optimized for Next.js environments (Server Components, Server Actions, and Route Handlers).

## 🎯 Objectives
- Provide a `@meenainwal/rich-text-editor/server` entry point.
- Enable high-performance HTML sanitization and normalization on the server.
- Support metadata extraction for SEO and pre-filling social tags.
- prevent client-side bloat by isolating server-only dependencies.

---

## 🏗 Proposed Architecture

### 1. File Structure
```text
src/
├── server/
│   ├── index.ts        # Main server entry point
│   ├── sanitizer.ts    # Server-side DOMPurify logic
│   ├── extractor.ts    # SEO & Metadata utilities
│   └── normalizer.ts   # Structural HTML cleanup
```

### 2. Export Configuration (`package.json`)
We will add a dedicated export for the server module:
```json
"exports": {
  "./server": {
    "types": "./dist/server.d.ts",
    "import": "./dist/server.mjs",
    "default": "./dist/server.mjs"
  }
}
```

---

## 🛠 Server-Side Capabilities

### 🛡 Server Sanitizer (`purifyHTML`)
Uses `DOMPurify` paired with `jsdom` to provide the same level of security as the client-side editor, but on the server.
- **Use Case**: Sanitize user input in a Server Action before saving to the database.
- **Implementation**: Uses `JSDOM` to mock the DOM required by purify.

### 🔍 Content Extractor (`extractMetadata`)
A fast utility to scan the editor's output HTML for:
- **Primary Image**: First `<img>` tag for `og:image`.
- **First Paragraph**: For `og:description` meta tags.
- **Reading Time**: Calculate based on word count of sanitized text.

### 🧹 Structural Normalizer (`normalizeOnServer`)
Runs the same normalization logic as the editor (e.g., wrapping lone text in `<p>`) to ensure data consistency between client and DB.

---

## 🚀 Next.js Best Practices
1. **`server-only` Package**: We will import `server-only` in `src/server/index.ts` to ensure these utilities never leak into the client bundle.
2. **Zero Client Dependencies**: The server entry point will NOT import `src/core/Editor.ts` or any UI-related code to keep the server build light.
3. **Optimized JSDOM**: Use a lightweight window mock where possible to minimize memory overhead in serverless functions (e.g., Vercel Lambda).

---

## 📅 Implementation Roadmap

### Phase 1: Infrastructure
- [ ] Create `src/server/` directory.
- [ ] Install `server-only` dependency.
- [ ] Setup `src/server/index.ts`.

### Phase 2: Core Utilities
- [ ] Implement `sanitizeHTML` using `jsdom`.
- [ ] Implement `extractMetadata` (images, text snippets).
- [ ] Implement `normalizeHTML` (ported from `Editor.ts`).

### Phase 3: Build & Publish
- [ ] Update `vite.config.ts` to build multiple bundles (Core + Server).
- [ ] Update `package.json` exports.
- [ ] Add integration examples for Server Actions and Route Handlers.
