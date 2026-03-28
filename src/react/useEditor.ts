import { useState, useEffect, useRef } from 'react';
import { InkflowEditor, EditorOptions } from '../index';

/**
 * Hook to initialize and manage an InkflowEditor instance.
 * Optimized for React 18/19 and SSR.
 */
export function useEditor(options: EditorOptions = {}) {
  const [editor, setEditor] = useState<InkflowEditor | null>(null);
  const optionsRef = useRef(options);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only initialize on the client
    if (typeof window === 'undefined') return;
    if (isInitialized.current) return;

    // Create the editor instance WITHOUT a container (deferred mount)
    const instance = new InkflowEditor(null, optionsRef.current);
    
    setEditor(instance);
    isInitialized.current = true;

    return () => {
      if (instance) {
        instance.destroy();
      }
      isInitialized.current = false;
    };
  }, []);

  return editor;
}
