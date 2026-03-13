# Server-Side Rendering (SSR) Strategy for Next.js

When using `@meenainwal/rich-text-editor` in a Next.js environment (especially with the App Router), you must account for the fact that the editor relies heavily on browser-only APIs (`window`, `document`, `HTMLElement`).

## 1. Why direct instantiation fails
If you try to initialize the editor in the body of a React component that runs on the server, Next.js will throw an error like `ReferenceError: document is not defined`.

```javascript
// ❌ This will fail during SSR
const editor = new TestEditor(container);
```

---

## 2. Bullet-Proof Implementation Strategies

### Strategy A: The `useEffect` Hook (Recommended for React)
The safest way to initialize the editor is inside a `useEffect` hook. This ensures the code only runs on the client after the component has mounted and the DOM is available.

```tsx
'use client'; // Required for Next.js App Router

import { useEffect, useRef } from 'react';
import { TestEditor } from '@meenainwal/rich-text-editor';
import '@meenainwal/rich-text-editor/style';

export default function EditorComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<TestEditor | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorInstance.current) {
      editorInstance.current = new TestEditor(containerRef.current, {
        placeholder: 'Start typing...',
        autofocus: true
      });
    }
    
    // Cleanup if necessary
    return () => {
      // Future: editorInstance.current?.destroy();
    };
  }, []);

  return <div ref={containerRef} className="editor-wrapper" />;
}
```

### Strategy B: Next.js Dynamic Import
If your component is large or you want to ensure no part of the editor library is even loaded on the server, use `next/dynamic`.

```tsx
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('../components/EditorComponent'), {
  ssr: false,
  loading: () => <p>Loading Editor...</p>
});

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <Editor />
    </div>
  );
}
```

---

## 3. Library-Level Improvements (Roadmap)

To make the library even more "bullet-proof", we plan to:
1.  **Global Guards**: Add `if (typeof window !== 'undefined')` checks inside the constructor and methods to prevent crashes during accidental server-side execution.
2.  **No-op Mode**: Allow the class to be instantiated on the server without errors, simply doing nothing until a `.mount(HTMLElement)` method is called on the client.
3.  **Modular CSS**: Ensure CSS injection (if implemented) is SSR-safe by wrapping it in `window` checks.

---

## 4. Troubleshooting Next.js Config
If you encounter "Module not found" errors for `@meenainwal/rich-text-editor/style`, ensure you are using at least Next.js 13+ which supports the `exports` field in `package.json` natively.
