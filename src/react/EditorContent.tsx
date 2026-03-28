import { useEffect, useRef } from 'react';
import { InkflowEditor } from '../index';

export interface EditorContentProps {
  editor: InkflowEditor | null;
  className?: string;
}

/**
 * Component to mount and display an InkflowEditor instance.
 * Automatically ties the editor instance to a DOM container.
 */
export const EditorContent = ({ editor, className }: EditorContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editor && containerRef.current) {
      // Mount the editor instance to this container
      editor.mount(containerRef.current);
    }
  }, [editor]);

  return (
    <div 
      ref={containerRef} 
      className={className || 'inkflow-editor-wrapper'} 
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    />
  );
};
