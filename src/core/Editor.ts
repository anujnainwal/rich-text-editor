import { SelectionManager } from './SelectionManager';

export interface EditorOptions {
  placeholder?: string;
  autofocus?: boolean;
}

export class CoreEditor {
  protected container: HTMLElement;
  protected editableElement: HTMLElement;
  public selection: SelectionManager;
  protected options: EditorOptions;
  private pendingStyles: Record<string, string> = {};

  constructor(container: HTMLElement, options: EditorOptions = {}) {
    this.container = container;
    this.container.classList.add('te-container');
    this.options = options;
    this.selection = new SelectionManager();
    
    // Create the contenteditable area
    this.editableElement = this.createEditableElement();
    this.setupInputHandlers();
    
    // Default structure: append editable area
    this.container.appendChild(this.editableElement);

    if (this.options.autofocus) {
      this.focus();
    }

    // Set default paragraph separator to <p>
    document.execCommand('defaultParagraphSeparator', false, 'p');
  }

  protected setupInputHandlers(): void {
    this.editableElement.addEventListener('beforeinput', (e: InputEvent) => {
      if (e.inputType === 'insertText' && Object.keys(this.pendingStyles).length > 0) {
        const text = e.data;
        if (!text) return;

        e.preventDefault();
        
        const span = document.createElement('span');
        for (const [prop, val] of Object.entries(this.pendingStyles)) {
          span.style.setProperty(prop, val);
          if (prop === 'font-size') {
            // span.style.lineHeight = '1.2'; // Removed as per user request
          }
        }
        span.textContent = text;

        const range = this.selection.getRange();
        if (range) {
          range.deleteContents();
          range.insertNode(span);
          
          // Move cursor to the end of the newly inserted text
          const newRange = document.createRange();
          newRange.setStart(span.firstChild!, text.length);
          newRange.setEnd(span.firstChild!, text.length);
          this.selection.restoreSelection(newRange);
          
          // Clear pending styles as they've been applied
          this.pendingStyles = {};
          this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    // Clear pending styles on selection change if the selection is no longer collapsed
    // or if the user clicks elsewhere.
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          this.pendingStyles = {};
        }
      }
    });
  }

  protected createEditableElement(): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('role', 'textbox');
    el.setAttribute('spellcheck', 'true');
    el.classList.add('te-content');

    if (this.options.placeholder) {
      el.setAttribute('data-placeholder', this.options.placeholder);
    }

    // Default styling setup
    el.style.minHeight = '150px';
    el.style.outline = 'none';
    el.style.padding = '1rem';

    // Handle initial empty state
    if (el.innerHTML === '') {
      el.innerHTML = '<p><br></p>';
    }

    return el;
  }

  /**
   * Focuses the editor.
   */
  focus(): void {
    this.editableElement.focus();
  }

  /**
   * Executes a command on the current selection.
   */
  execute(command: string, value: string | null = null): void {
    this.focus();
    
    // For font size and family, we might want custom logic in the future.
    // However, for standard commands, execCommand is still the easiest path for undo/redo.
    document.execCommand(command, false, value ?? undefined);
    
    // Dispatch an input event to notify listeners of changes
    this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Recursively removes a style property from all elements in a fragment.
   */
  private clearStyleRecursive(fragment: Node, property: string): void {
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode() as HTMLElement | null;
    while (node) {
      if (node.style.getPropertyValue(property)) {
        node.style.removeProperty(property);
        // If the span is now empty, we could potentially remove it, 
        // but for now, we'll let it be to preserve other styles (bold, etc).
      }
      node = walker.nextNode() as HTMLElement | null;
    }
  }

  /**
   * Applies an inline style to the selection.
   * This is used for properties like font-size (px) and font-family
   * where execCommand is outdated or limited.
   */
  setStyle(property: string, value: string, range?: Range): Range | null {
    if (property === 'font-size') {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        const clampedValue = Math.max(1, Math.min(100, numValue));
        value = `${clampedValue}px`;
      }
    }

    if (!range) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      range = selection.getRangeAt(0);
    }

    if (range.collapsed) {
      this.pendingStyles[property] = value;
      return range;
    }

    // Check if the current selection is already inside a span with this property
    let parent = range.commonAncestorContainer as HTMLElement;
    if (parent.nodeType === Node.TEXT_NODE) {
      parent = parent.parentElement!;
    }

    let resultRange: Range | null = null;

    // Modern approach: apply style and then clean up/merge
    // For now, we'll try to find if the selection is exactly a span and update it
    if (parent.tagName === 'SPAN' && parent.children.length === 0 && parent.textContent === range.toString()) {
      parent.style.setProperty(property, value);
      resultRange = range.cloneRange();
    } else {
      const span = document.createElement('span');
      span.style.setProperty(property, value);
      
      try {
        const parentSpan = parent.tagName === 'SPAN' ? parent : null;
        
        // NEW: Extract content and clean it up to prevent nesting issues
        const fragment = range.extractContents();
        this.clearStyleRecursive(fragment, property);
        
        span.appendChild(fragment);
        range.insertNode(span);
        
        // Cleanup: if the parent was a span and is now empty, remove it
        if (parentSpan && parentSpan.innerHTML === '') {
          parentSpan.remove();
        }
        
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        resultRange = newRange;

        // Update the selection if we are working on the active selection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } catch (e) {
        console.warn('Failed to apply style:', e);
      }
    }

    this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
    return resultRange;
  }

  /**
   * Returns the clean HTML content of the editor.
   */
  getHTML(): string {
    return this.editableElement.innerHTML;
  }

  /**
   * Sets the HTML content of the editor.
   */
  setHTML(html: string): void {
    this.editableElement.innerHTML = html;
  }

  /**
   * Internal access to the editable element.
   */
  get el(): HTMLElement {
    return this.editableElement;
  }
}
