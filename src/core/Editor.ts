import { SelectionManager } from './SelectionManager';
import { ImageManager } from './ImageManager';
import { HistoryManager } from './HistoryManager';
import { FloatingToolbar } from '../ui/toolbar/FloatingToolbar';
import { ImageUploader } from './plugins/ImageUploader';
import DOMPurify from 'dompurify';

export type ToolbarPosition = 'top' | 'bottom' | 'left' | 'right' | 'floating';

export interface ThemeConfig {
  primaryColor?: string;
  primaryHover?: string;
  bgApp?: string;
  bgEditor?: string;
  toolbarBg?: string;
  borderColor?: string;
  borderFocus?: string;
  textMain?: string;
  textMuted?: string;
  placeholder?: string;
  btnHover?: string;
  btnActive?: string;
  radiusLg?: string;
  radiusMd?: string;
  radiusSm?: string;
  shadowSm?: string;
  shadowMd?: string;
  shadowLg?: string;
}

export interface EditorOptions {
  placeholder?: string;
  autofocus?: boolean;
  theme?: ThemeConfig;
  dark?: boolean;
  onSave?: (html: string) => void;
  onSaving?: () => void;
  onChange?: (html: string) => void;
  autoSaveInterval?: number; // ms, default 1000
  autoSave?: boolean; // default false
  showStatus?: boolean; // default true
  showLoader?: boolean; // default true
  toolbarItems?: string[]; // IDs of tools to show
  imageEndpoints?: {
    upload: string;
    delete: string;
  };
  cloudinaryFallback?: {
    cloudName: string;
    uploadPreset: string;
  };
  maxImageSizeMB?: number; // default 5
  onImageDelete?: (imageId?: string, imageUrl?: string) => void;
  maxCharCount?: number;
  showCharCount?: boolean;
  strictCharLimit?: boolean;
  toolbarPosition?: ToolbarPosition;
}

export class CoreEditor {
  protected container: HTMLElement;
  protected editableElement: HTMLElement;
  public selection: SelectionManager;
  protected imageManager: ImageManager;
  private history: HistoryManager;
  protected options: EditorOptions;
  private saveTimeout: any = null;
  private historyTimeout: any = null;
  private pendingStyles: Record<string, string> = {};
  private observer: MutationObserver | null = null;
  private floatingToolbar: FloatingToolbar | null = null;
  private magicStateMap: Map<HTMLElement, number> = new Map();
  private eventListeners: Array<{ target: EventTarget, type: string, handler: any }> = [];
  private loaderElement: HTMLElement | null = null;
  private isUndoingRedoing: boolean = false;
  private normalizeTimeout: any = null;

  constructor(container: HTMLElement, options: EditorOptions = {}) {
    this.options = options;
    this.container = container;

    // SSR Guard: Return early if called in a non-browser environment
    if (typeof document === 'undefined' || !container) {
      // Initialize minimal safe state
      this.editableElement = {} as HTMLElement;
      this.selection = {} as SelectionManager;
      this.imageManager = {} as ImageManager;
      this.history = {} as HistoryManager;
      return;
    }

    // Clear container initially to prevent duplicates (especially in React Strict Mode)
    this.container.innerHTML = '';
    this.container.classList.add('te-container');
    if (this.options.dark) {
      this.container.classList.add('te-dark');
    }

    // Show loader if requested
    if (this.options.showLoader !== false) {
      this.createLoader();
    }

    // Create the contenteditable area first
    this.editableElement = this.createEditableElement();

    // Now initialize managers that depend on the element
    this.selection = new SelectionManager();
    this.imageManager = new ImageManager(this);
    this.history = new HistoryManager(this.editableElement.innerHTML);

    this.setupInputHandlers();
    this.addEventListener(this.editableElement, 'mousedown', (e: MouseEvent) => {
      // If clicking on the editor padding or background (not directly on an existing block)
      if (e.target === this.editableElement) {
        setTimeout(() => {
          if (this.editableElement.lastElementChild) {
            // Check if last child is a block, it should be due to normalization
            this.selection.setCursorAtEnd(this.editableElement.lastElementChild);
          } else {
            this.normalize();
          }
        }, 0);
      }
    });

    this.addEventListener(this.editableElement, 'focus', () => {
      // Ensure there's always at least one paragraph to type into
      if (this.editableElement.children.length === 0 || 
          (this.editableElement.firstElementChild && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'PRE'].includes(this.editableElement.firstElementChild.tagName))) {
        this.normalize();
      }
      
      // If we have an empty paragraph but cursor is outside, force it in
      const sel = window.getSelection();
      if (sel && sel.anchorNode === this.editableElement) {
         if (this.editableElement.lastElementChild) {
           this.selection.setCursorAtEnd(this.editableElement.lastElementChild);
         }
      }
    });

    this.addEventListener(this.editableElement, 'click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('te-code-copy-btn')) {
        this.handleCodeCopy(target);
      }
      if (target.classList.contains('te-code-remove-btn') || target.closest('.te-code-remove-btn')) {
        // Handle mostly via mousedown for instant response, but catch click if it gets through
        e.preventDefault();
        e.stopPropagation();
      }
    });

    this.addEventListener(this.editableElement, 'mousedown', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('te-resize-corner') || target.classList.contains('te-resize-bar')) {
        this.handleCodeResizeStart(e, target);
      }
      if (target.classList.contains('te-code-remove-btn') || target.closest('.te-code-remove-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const btn = target.classList.contains('te-code-remove-btn') ? target : target.closest('.te-code-remove-btn') as HTMLElement;
        this.handleCodeRemove(btn);
      }
    });

    this.addEventListener(this.editableElement, 'contextmenu', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const wrapper = target.closest('.te-code-wrapper');
      if (wrapper) {
        e.preventDefault();
        this.showCodeContextMenu(e.clientX, e.clientY, wrapper as HTMLElement);
      }
    });

    this.setupLimitEnforcement();
    this.setupLinkClickHandlers();
    this.setupImageObserver();
    this.checkPlaceholder();

    // Default structure: append editable area
    this.container.appendChild(this.editableElement);

    if (this.options.autofocus) {
      this.focus();
    }

    if (this.options.theme) {
      this.applyTheme(this.options.theme);
    }

    // Set default max image size if not provided
    if (this.options.maxImageSizeMB === undefined) {
      this.options.maxImageSizeMB = 5;
    }

    // Set default paragraph separator to <p>
    document.execCommand('defaultParagraphSeparator', false, 'p');

    // Initialize floating toolbar
    this.floatingToolbar = new FloatingToolbar(this);
    if (this.options.dark) {
      this.floatingToolbar.setDarkMode(true);
    }

    // Hide loader after a short delay to ensure initial layout is stable
    if (this.options.showLoader !== false) {
      setTimeout(() => this.hideLoader(), 300);
    }
  }


  /**
   * Applies custom theme variables to the editor container.
   */
  private applyTheme(theme: ThemeConfig): void {
    const root = this.container;
    const mapping: Record<keyof ThemeConfig, string> = {
      primaryColor: '--te-primary-color',
      primaryHover: '--te-primary-hover',
      bgApp: '--te-bg-app',
      bgEditor: '--te-bg-editor',
      toolbarBg: '--te-toolbar-bg',
      borderColor: '--te-border-color',
      borderFocus: '--te-border-focus',
      textMain: '--te-text-main',
      textMuted: '--te-text-muted',
      placeholder: '--te-placeholder',
      btnHover: '--te-btn-hover',
      btnActive: '--te-btn-active',
      radiusLg: '--te-radius-lg',
      radiusMd: '--te-radius-md',
      radiusSm: '--te-radius-sm',
      shadowSm: '--te-shadow-sm',
      shadowMd: '--te-shadow-md',
      shadowLg: '--te-shadow-lg'
    };

    for (const [key, variable] of Object.entries(mapping)) {
      const value = theme[key as keyof ThemeConfig];
      if (value) {
        root.style.setProperty(variable, value);
      }
    }
  }

  /**
   * Toggles dark mode on the editor.
   */
  public setDarkMode(enabled: boolean): void {
    this.options.dark = enabled;
    if (enabled) {
      this.container.classList.add('te-dark');
      this.floatingToolbar?.setDarkMode(true);
    } else {
      this.container.classList.remove('te-dark');
      this.floatingToolbar?.setDarkMode(false);
    }
  }

  /**
   * Destroys the editor instance and cleans up.
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    if (this.historyTimeout) clearTimeout(this.historyTimeout);
    if (this.normalizeTimeout) clearTimeout(this.normalizeTimeout);

    // Clean up managers
    if (this.imageManager && typeof (this.imageManager as any).destroy === 'function') {
      (this.imageManager as any).destroy();
    }

    // Remove event listeners
    this.eventListeners.forEach(({ target, type, handler }) => {
      target.removeEventListener(type, handler);
    });
    this.eventListeners = [];

    // Clear container
    this.container.innerHTML = '';
    this.container.classList.remove('te-container', 'te-dark', 'te-toolbar-bottom', 'te-toolbar-floating');
    this.container.removeAttribute('style');

    if (this.floatingToolbar) {
      this.floatingToolbar.destroy();
      this.floatingToolbar = null;
    }
  }

  protected checkPlaceholder(): void {
    if (!this.editableElement) return;

    // Logically empty if it has no text and no images/other media
    const isEmpty = this.editableElement.textContent?.trim() === '' &&
      !this.editableElement.querySelector('img') &&
      !this.editableElement.querySelector('table') &&
      !this.editableElement.querySelector('ul') &&
      !this.editableElement.querySelector('ol') &&
      !this.editableElement.querySelector('hr') &&
      !this.editableElement.querySelector('figure') &&
      !this.editableElement.querySelector('blockquote') &&
      !this.editableElement.querySelector('pre');

    if (isEmpty) {
      this.editableElement.classList.add('is-empty');

      // Update alignment of placeholder to match current block alignment
      const firstChild = this.editableElement.firstElementChild as HTMLElement;
      if (firstChild) {
        this.editableElement.style.textAlign = firstChild.style.textAlign;
      }
    } else {
      this.editableElement.classList.remove('is-empty');
      this.editableElement.style.textAlign = '';
    }
  }

  private addEventListener(target: EventTarget, type: string, handler: any, options?: any): void {
    target.addEventListener(type, handler, options);
    this.eventListeners.push({ target, type, handler });
  }

  protected setupImageObserver(): void {
    // Automatically wrap any raw <img> tags that get inserted (e.g. via native paste or setHTML)
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;

            // Check if the added node is an img itself
            if (el.tagName === 'IMG' && !el.closest('.te-image-container')) {
              this.wrapImage(el as HTMLImageElement);
            } else {
              // Check if the added node contains raw imgs
              const rawImages = el.querySelectorAll('img:not(.te-image)');
              rawImages.forEach(img => {
                if (!img.closest('.te-image-container')) {
                  this.wrapImage(img as HTMLImageElement);
                }
              });
            }
          }
        });
      });
    });

    this.observer.observe(this.editableElement, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Wraps a raw <img> element in the interactive container
   */
  private wrapImage(img: HTMLImageElement): void {
    // Prevent recursive observer triggers during DOM manipulation
    const parent = img.parentElement;
    if (!parent) return;

    // Create the container structure
    const figure = document.createElement('figure');
    figure.classList.add('te-image-container');
    figure.setAttribute('contenteditable', 'false');

    // Clone the image but add our class
    const newImg = document.createElement('img');
    newImg.src = img.src;
    newImg.alt = img.alt || '';
    if (img.width) newImg.style.width = `${img.width}px`;
    if (img.height) newImg.style.height = `${img.height}px`;
    newImg.classList.add('te-image');

    const caption = document.createElement('figcaption');
    caption.classList.add('te-image-caption');
    caption.setAttribute('contenteditable', 'true');
    caption.setAttribute('data-placeholder', 'Type caption...');

    // Resize handles
    const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    handles.forEach(pos => {
      const handle = document.createElement('div');
      handle.classList.add('te-image-resizer', `te-resizer-${pos}`);
      figure.appendChild(handle);
    });

    figure.appendChild(newImg);
    figure.appendChild(caption);

    // Replace the old raw image with our fancy figure in the DOM
    parent.replaceChild(figure, img);

    // Optionally ensure there's a paragraph after it so the user can keep typing
    if (!figure.nextElementSibling) {
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      figure.after(p);
    }
  }

  protected setupInputHandlers(): void {
    this.addEventListener(this.editableElement, 'beforeinput', (e: InputEvent) => {
      if (e.inputType === 'insertText' && Object.keys(this.pendingStyles).length > 0) {
        const text = e.data;
        if (!text) return;

        e.preventDefault();

        const span = document.createElement('span');
        for (const [prop, val] of Object.entries(this.pendingStyles)) {
          span.style.setProperty(prop, val);
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

    this.addEventListener(this.editableElement, 'input', () => {
      this.checkPlaceholder();
    });

    // Clear pending styles on selection change if the selection is no longer collapsed
    // or if the user clicks elsewhere.
    this.addEventListener(document, 'selectionchange', () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          this.pendingStyles = {};
        }
      }
    });

    // Drag and Drop support for images
    this.addEventListener(this.editableElement, 'dragover', (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
      this.editableElement.classList.add('dragover');
    });

    this.addEventListener(this.editableElement, 'dragleave', () => {
      this.editableElement.classList.remove('dragover');
    });

    this.addEventListener(this.editableElement, 'drop', (e: DragEvent) => {
      e.preventDefault();
      this.editableElement.classList.remove('dragover');

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        this.handleFiles(Array.from(files));
      }
    });

    // Handle paste events to sanitize inherited malware and styles
    this.addEventListener(this.editableElement, 'paste', this.handlePaste.bind(this));

    // Handle input for history and auto-save
    this.addEventListener(this.editableElement, 'input', () => {
      this.handleInput();
    });

    this.addEventListener(this.editableElement, 'keydown', (e: KeyboardEvent) => {
      // 1. Custom List Handling: Prevent item concatenation on Enter
      if (e.key === 'Enter') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const li = (range.startContainer.nodeType === Node.ELEMENT_NODE
            ? range.startContainer as HTMLElement
            : range.startContainer.parentElement)?.closest('li');

          if (li) {
            // Let the browser handle basic Enter if it's working, 
            // but we'll normalize immediately after to ensure structure.
            setTimeout(() => {
              this.normalize();
              this.triggerChange();
            }, 0);
          }
        }
      }

      // 2. Handle "Break-out" from Code Block (PRE)
      if (e.key === 'Enter' && !e.shiftKey) {
        const range = this.selection.getRange();
        if (range && range.collapsed) {
          const container = range.startContainer;
          const pre = (container.nodeType === Node.ELEMENT_NODE
            ? container as HTMLElement
            : container.parentElement)?.closest('pre');

          if (pre) {
            // Get all text before and after the cursor within the PRE
            const preRange = document.createRange();
            preRange.setStart(pre, 0);
            preRange.setEnd(range.startContainer, range.startOffset);
            const textBefore = preRange.toString();

            const postRange = document.createRange();
            postRange.setStart(range.startContainer, range.startOffset);
            postRange.setEnd(pre, pre.childNodes.length);
            const textAfter = postRange.toString();

            // The line is empty if we are between newlines or at the start/end
            // The line is empty if we are between newlines or at the start/end
            // We also trim to handle cases where there might be a trailing space or no real text
            const isAtLineStart = textBefore === '' || textBefore.endsWith('\n');
            const isAtLineEnd = textAfter === '' || textAfter.startsWith('\n');

            if (isAtLineStart && isAtLineEnd) {
              e.preventDefault();

              const fullText = pre.textContent || '';
              const cursorIndex = textBefore.length;

              // Remove the current empty line
              // If we are at a newline, remove it.
              if (fullText.charAt(cursorIndex) === '\n') {
                pre.textContent = fullText.slice(0, cursorIndex) + fullText.slice(cursorIndex + 1);
              } else if (fullText.charAt(cursorIndex - 1) === '\n') {
                pre.textContent = fullText.slice(0, cursorIndex - 1) + fullText.slice(cursorIndex);
              } else if (fullText === '') {
                // Already empty
              }

              const p = document.createElement('p');
              p.innerHTML = '<br>';
              pre.after(p);

              const newRange = document.createRange();
              newRange.setStart(p, 0);
              newRange.setEnd(p, 0);
              this.selection.restoreSelection(newRange);

              this.normalize(); // Ensure structure is clean
              this.triggerChange();
              return;
            }
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.redo();
      }

      // 3. Handle Tab Indentation in Code Block
      if (e.key === 'Tab') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer as HTMLElement;
          const pre = (container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement)?.closest('pre');

          if (pre) {
            e.preventDefault();
            document.execCommand('insertText', false, '    '); // Insert 4 spaces for tab
          }
        }
      }
    });
  }

  /**
   * Sets up strict character limit enforcement.
   */
  private setupLimitEnforcement(): void {
    this.editableElement.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.options.maxCharCount || !this.options.strictCharLimit) return;

      const currentCount = this.getCharCount();
      if (currentCount >= this.options.maxCharCount) {
        // Allow navigation and deletion keys
        const allowedKeys = [
          'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
          'Home', 'End', 'PageUp', 'PageDown', 'Control', 'Meta', 'Alt', 'Shift',
          'a', 'c', 'v', 'x', 'z', 'y' // Allow common shortcuts
        ];

        // If it's a shortcut (Ctrl/Meta + key), check if it's one we allow
        if (e.ctrlKey || e.metaKey) {
          if (allowedKeys.includes(e.key.toLowerCase())) return;
        }

        if (!allowedKeys.includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    });
  }

  /**
   * Immediately records a history state if one is pending.
   */
  private flushHistoryRecord(): void {
    if (this.historyTimeout) {
      clearTimeout(this.historyTimeout);
      this.historyTimeout = null;

      const html = this.editableElement.innerHTML;
      const path = this.selection.getSelectionPath(this.editableElement);
      this.history.record(html, path);
    }
  }

  private handleInput(): void {
    if (this.isUndoingRedoing) return;

    // Immediate check for "loose" text nodes to avoid layout jumps
    const nodes = Array.from(this.editableElement.childNodes);
    const hasLooseNodes = nodes.some(n => 
      (n.nodeType === Node.TEXT_NODE && n.nodeValue?.trim()) || 
      (n.nodeType === Node.ELEMENT_NODE && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'TABLE', 'DIV'].includes((n as HTMLElement).tagName))
    );

    if (hasLooseNodes) {
      this.normalize();
    }

    // Aggressively ensure structure is valid during typing
    // We use a small delay to avoid fighting with the browser's native input too much
    if (this.normalizeTimeout) clearTimeout(this.normalizeTimeout);
    this.normalizeTimeout = setTimeout(() => {
      this.normalize();
    }, 200); // Normalize after 200ms (much faster now)

    this.scheduleHistoryRecord();

    if (this.options.autoSave) {
      if (this.options.onSaving) {
        this.options.onSaving();
      }
      this.scheduleAutoSave();
    }

    if (this.options.onChange) {
      this.options.onChange(this.getHTML());
    }
  }

  private scheduleHistoryRecord(): void {
    if (this.historyTimeout) clearTimeout(this.historyTimeout);
    this.historyTimeout = setTimeout(() => {
      const html = this.editableElement.innerHTML;
      const path = this.selection.getSelectionPath(this.editableElement);
      this.history.record(html, path);
    }, 200); // Record after 200ms of inactivity
  }

  private scheduleAutoSave(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    const interval = this.options.autoSaveInterval || 300;
    this.saveTimeout = setTimeout(() => {
      this.save();
    }, interval);
  }

  public save(): void {
    if (this.options.onSave) {
      this.options.onSave(this.getHTML());
    }
  }

  public undo(): void {
    this.flushHistoryRecord();
    const state = this.history.undo();
    if (state !== null) {
      this.isUndoingRedoing = true;
      this.editableElement.innerHTML = state.html;
      if (state.selection) {
        this.selection.restoreSelectionPath(this.editableElement, state.selection);
      }
      this.triggerChange();
      this.isUndoingRedoing = false;
    }
  }

  public redo(): void {
    this.flushHistoryRecord();
    const state = this.history.redo();
    if (state !== null) {
      this.isUndoingRedoing = true;
      this.editableElement.innerHTML = state.html;
      if (state.selection) {
        this.selection.restoreSelectionPath(this.editableElement, state.selection);
      }
      this.triggerChange();
      this.isUndoingRedoing = false;
    }
  }

  protected triggerChange(): void {
    this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private createLoader(): void {
    this.loaderElement = document.createElement('div');
    this.loaderElement.className = 'te-loader-overlay';

    const spinner = document.createElement('div');
    spinner.className = 'te-loader-spinner';

    const shimmer = document.createElement('div');
    shimmer.className = 'te-loader-shimmer';

    const text = document.createElement('div');
    text.className = 'te-loader-text';
    text.textContent = 'Initializing Editor...';

    this.loaderElement.appendChild(spinner);
    this.loaderElement.appendChild(shimmer);
    this.loaderElement.appendChild(text);

    this.container.appendChild(this.loaderElement);
  }

  private hideLoader(): void {
    if (this.loaderElement) {
      this.loaderElement.classList.add('hidden');
      setTimeout(() => {
        if (this.loaderElement && this.loaderElement.parentNode) {
          this.loaderElement.parentNode.removeChild(this.loaderElement);
        }
        this.loaderElement = null;
      }, 400); // Matches CSS transition duration
    }
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

    // Special handling for clear formatting to also reset block blocks
    if (command === 'removeFormat') {
      document.execCommand('formatBlock', false, 'p');

      // Also clear pending styles
      this.pendingStyles = {};
    }

    if (command === 'magicFormat') {
      this.magicFormat();
      return;
    }

    if (command === 'resetMagicFormat') {
      this.resetMagicFormat();
      return;
    }

    if (command === 'insertCodeBlock') {
      this.insertCodeBlock();
      return;
    }

    // Normalize HTML after execution
    this.normalize();

    // Dispatch an input event to notify listeners of changes
    this.triggerChange();
  }

  /**
   * Special handler for links to open them in a new tab when clicked.
   */
  private setupLinkClickHandlers(): void {
    this.addEventListener(this.editableElement, 'click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && this.editableElement.contains(anchor)) {
        e.preventDefault();
        const url = anchor.getAttribute('href');
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }
    });
  }

  /**
   * Magic Format logic: Cycles through aesthetic presets for the entire document.
   */
  public magicFormat(): void {
    // Get current global state or default to 0
    const globalState = (this.magicStateMap.get(this.editableElement) || 0);
    const nextState = (globalState + 1) % 3;
    this.magicStateMap.set(this.editableElement, nextState);

    // Get all root-level blocks and specific elements
    const blocks = Array.from(this.editableElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, table, blockquote, figure, li')) as HTMLElement[];

    if (blocks.length === 0) return;

    blocks.forEach(block => {
      // Apply emoji enrichment
      this.enrichBlockWithEmojis(block);

      // Apply tag-specific formatting based on the global state
      if (block.tagName === 'TABLE') {
        this.formatMagicTable(block, nextState);
      } else if (block.tagName === 'FIGURE' || block.querySelector('img')) {
        this.formatMagicImage(block, nextState);
      } else if (block.tagName.startsWith('H')) {
        this.formatMagicHeading(block, nextState);
      } else if (block.tagName === 'P' || block.tagName === 'LI' || block.tagName === 'BLOCKQUOTE') {
        this.formatMagicText(block, nextState);
      }
    });

    this.normalize();
    this.history.record(this.editableElement.innerHTML, this.selection.getSelectionPath(this.editableElement));
    this.handleInput();
  }

  /**
   * Resets all magic formatting (inline styles) from the document.
   */
  public resetMagicFormat(): void {
    const blocks = Array.from(this.editableElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, table, blockquote, figure, li')) as HTMLElement[];
    
    blocks.forEach(block => {
      // Clear all inline styles
      block.removeAttribute('style');
      
      // Clear styles from children (cells, images, etc.)
      block.querySelectorAll('*').forEach((child: any) => {
        child.removeAttribute('style');
      });

      // Reset emoji text if possible (optional, but keep complex icons for now or just leave as is)
    });

    this.magicStateMap.clear();
    this.normalize();
    this.history.record(this.editableElement.innerHTML, this.selection.getSelectionPath(this.editableElement));
    this.handleInput();
  }

  private formatMagicTable(table: HTMLElement, state: number): void {
    const states = [
      // State 0: Premium Zebra (Modern Rounded)
      () => {
        table.style.borderCollapse = 'separate';
        table.style.borderRadius = '12px';
        table.style.overflow = 'hidden';
        table.style.border = '1px solid var(--te-border-color)';
        table.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
        table.querySelectorAll('td, th').forEach((cell: any) => {
          cell.style.border = '1px solid var(--te-border-color)';
        });
      },
      // State 1: Clean Minimal (No vertical borders, soft header)
      () => {
        table.style.borderCollapse = 'collapse';
        table.style.borderRadius = '0';
        table.style.boxShadow = 'none';
        table.style.border = 'none';
        table.style.borderTop = '2px solid var(--te-primary-color)';
        table.style.borderBottom = '2px solid var(--te-primary-color)';
        table.querySelectorAll('td, th').forEach((cell: any) => {
          cell.style.borderLeft = 'none';
          cell.style.borderRight = 'none';
          cell.style.borderBottom = '1px solid var(--te-border-color)';
        });
      },
      // State 2: Ultra Minimal (No borders whatsoever)
      () => {
        table.style.border = 'none';
        table.style.boxShadow = 'none';
        table.style.background = 'none';
        table.style.borderRadius = '0';
        table.querySelectorAll('td, th').forEach((cell: any) => {
          cell.style.border = 'none';
          cell.style.padding = '12px 0';
        });
      }
    ];
    states[state]();
  }

  private formatMagicImage(figure: HTMLElement, state: number): void {
    const img = figure.querySelector('img');
    if (!img) return;

    const states = [
      // State 0: Shadow & Rounded
      () => {
        img.style.borderRadius = '12px';
        img.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
        img.style.border = '1px solid var(--te-border-color)';
      },
      // State 1: Thick Border Frame
      () => {
        img.style.borderRadius = '0';
        img.style.border = '8px solid white';
        img.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
      },
      // State 2: Soft Minimal
      () => {
        img.style.borderRadius = '8px';
        img.style.boxShadow = 'none';
        img.style.border = 'none';
      }
    ];
    states[state]();
  }

  private formatMagicHeading(h: HTMLElement, state: number): void {
    const states = [
      // State 0: Typography Focus (Modern Weight)
      () => {
        h.style.fontWeight = '800';
        h.style.color = 'var(--te-primary-color)';
        h.style.letterSpacing = '-0.02em';
        h.style.border = 'none';
        h.style.marginBottom = '1.5rem';
      },
      // State 1: Elegant Serif Look (Soft Color)
      () => {
        h.style.fontFamily = 'serif';
        h.style.color = '#4338ca'; // Indigo 700
        h.style.fontStyle = 'italic';
        h.style.border = 'none';
        h.style.letterSpacing = 'normal';
      },
      // State 2: All Caps & Spaced (Professional Accent)
      () => {
        h.style.textTransform = 'uppercase';
        h.style.letterSpacing = '0.2em';
        h.style.color = '#1e1b4b'; // Indigo 950
        h.style.fontWeight = '900';
        h.style.border = 'none';
      }
    ];
    states[state]();
  }

  private formatMagicText(p: HTMLElement, state: number): void {
    const states = [
      // State 0: Premium Reading Mode
      () => {
        p.style.lineHeight = '2';
        p.style.fontSize = '1.15rem';
        p.style.color = '#334155'; // Slate 700
        p.style.fontWeight = '400';
        p.style.border = 'none';
      },
      // State 1: Soft Highlight Look
      () => {
        p.style.background = 'rgba(99, 102, 241, 0.05)';
        p.style.borderLeft = '4px solid #818cf8';
        p.style.padding = '1rem 1.5rem';
        p.style.borderRadius = '8px';
        p.style.color = '#1e293b';
      },
      // State 2: Modern Clean Minimal
      () => {
        p.style.fontWeight = '500';
        p.style.letterSpacing = '0.01em';
        p.style.color = '#0f172a'; // Slate 900
        p.style.background = 'none';
        p.style.border = 'none';
        p.style.padding = '0.5rem 0';
      }
    ];
    states[state]();
  }

  /**
   * Enriches text nodes within a block with emojis without breaking HTML structure.
   */
  private enrichBlockWithEmojis(block: HTMLElement): void {
    const emojiMap: Record<string, string> = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'magic': '✨',
      'done': '🎯',
      'plan': '📝',
      'link': '🔗',
      'image': '🖼️',
      'table': '📊',
      'celebrate': '🎉',
      'rocket': '🚀'
    };

    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      let text = node.nodeValue || '';
      let changed = false;
      Object.entries(emojiMap).forEach(([word, emoji]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(text) && !text.includes(emoji)) {
          text = text.replace(regex, `${emoji} ${word}`);
          changed = true;
        }
      });
      if (changed) node.nodeValue = text;
    }
  }

  /**
   * Inserts a table at the current selection.
   */
  insertTable(rows: number = 3, cols: number = 3): void {
    this.focus();
    const range = this.selection.getRange();
    if (!range) return;

    const table = document.createElement('table');
    table.classList.add('te-table');

    // Create thead for the first row
    if (rows > 0) {
      const thead = document.createElement('thead');
      const headerTr = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const th = document.createElement('th');
        th.innerHTML = '<br>';
        headerTr.appendChild(th);
      }
      thead.appendChild(headerTr);
      table.appendChild(thead);
    }

    // Create tbody for remaining rows
    if (rows > 1) {
      const tbody = document.createElement('tbody');
      for (let r = 1; r < rows; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < cols; c++) {
          const td = document.createElement('td');
          td.innerHTML = '<br>'; // Empty cell
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
    }

    range.deleteContents();
    range.insertNode(table);

    // Ensure there's a paragraph after the table for the user to click into.
    // If the next sibling isn't a paragraph, or it's just a lone <br>, add a fresh <p>.
    const next = table.nextElementSibling;
    if (!next || next.tagName !== 'P') {
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      table.after(p);

      // If there was a lone BR, remove it as we now have a proper P
      if (next && next.tagName === 'BR') {
        next.remove();
      }
    }

    this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Adds a row to the currently selected table.
   */
  addRow(): void {
    const table = this.getSelectedTable();
    if (!table) return;

    const newRow = document.createElement('tr');
    newRow.style.borderBottom = '1px solid var(--te-border-color)';
    const cols = table.rows[0].cells.length;
    for (let i = 0; i < cols; i++) {
      const td = document.createElement('td');
      td.innerHTML = '<br>';
      newRow.appendChild(td);
    }

    const currentTd = this.getSelectedTd();
    if (currentTd) {
      currentTd.parentElement?.after(newRow);
    } else {
      table.appendChild(newRow);
    }

    this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Deletes the currently selected row.
   */
  public deleteRow(): void {
    const td = this.getSelectedTd();
    if (td && td.parentElement) {
      const tr = td.parentElement as HTMLTableRowElement;
      const table = tr.parentElement as HTMLTableElement;
      if (table.rows.length > 1) {
        // QA FIX: Find a neighbor to focus BEFORE deleting
        const rowIndex = tr.rowIndex;
        const neighbor = table.rows[rowIndex + 1] || table.rows[rowIndex - 1];
        const cellIndex = td.cellIndex;

        tr.remove();

        if (neighbor && neighbor.cells[cellIndex]) {
          const range = document.createRange();
          range.selectNodeContents(neighbor.cells[cellIndex]);
          range.collapse(true);
          this.selection.restoreSelection(range);
        }

        this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  /**
   * Adds a column to the currently selected table.
   */
  addColumn(): void {
    const table = this.getSelectedTable();
    if (!table) return;

    const currentTd = this.getSelectedTd();
    const cellIndex = currentTd ? currentTd.cellIndex : -1;

    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      const td = document.createElement('td');
      td.innerHTML = '<br>';
      if (cellIndex !== -1) {
        row.cells[cellIndex].after(td);
      } else {
        row.appendChild(td);
      }
    }

    this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Deletes the currently selected column.
   */
  public deleteColumn(): void {
    const td = this.getSelectedTd();
    if (!td) return;

    const table = this.getSelectedTable();
    if (!table) return;

    const cellIndex = td.cellIndex;
    if (table.rows[0].cells.length > 1) {
      // QA FIX: Find a neighbor to focus
      const neighborCell = td.nextElementSibling || td.previousElementSibling;

      for (let i = 0; i < table.rows.length; i++) {
        table.rows[i].cells[cellIndex].remove();
      }

      if (neighborCell) {
        const range = document.createRange();
        range.selectNodeContents(neighborCell);
        range.collapse(true);
        this.selection.restoreSelection(range);
      }

      this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  private getSelectedTd(): HTMLTableCellElement | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    let node = selection.anchorNode;
    while (node && node !== this.editableElement) {
      if (node.nodeName === 'TD') return node as HTMLTableCellElement;
      node = node.parentNode;
    }
    return null;
  }

  private getSelectedTable(): HTMLTableElement | null {
    const td = this.getSelectedTd();
    return td ? (td.closest('table') as HTMLTableElement) : null;
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
        // If the span is now empty and has no ID or other important attributes, remove it
        if (node.tagName === 'SPAN' && node.style.length === 0 && !node.id && !node.className) {
           node.replaceWith(...Array.from(node.childNodes));
        }
      }
      node = walker.nextNode() as HTMLElement | null;
    }
  }

  /**
   * Applies an inline style to the selection.
   * This is used for properties like font-size (px) and font-family
   * where execCommand is outdated or limited.
   */
  /**
   * Applies an inline style to the selection.
   * This is used for properties like font-size (px) and font-family
   * where execCommand is outdated or limited.
   */
  setStyle(property: string, value: string, range?: Range): Range | null {
    if (!range) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      range = selection.getRangeAt(0);
    }

    if (range.collapsed) {
      this.pendingStyles[property] = value;
      return range;
    }

    // Handle block-level properties (like line-height) differently
    const blockProperties = ['line-height'];
    if (blockProperties.includes(property)) {
      return this.setBlockStyle(property, value, range);
    }

    // Check if the current selection is already inside a span with this property
    let parent = range.commonAncestorContainer as HTMLElement;
    if (parent.nodeType === Node.TEXT_NODE) {
      parent = parent.parentElement!;
    }

    let resultRange: Range | null = null;

    // Modern approach: apply style and then clean up/merge
    // 1. Check if the selection is exactly a span and update it
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
   * Applies a style to the block-level containers within the range.
   */
  private setBlockStyle(property: string, value: string, range: Range): Range | null {
    const blockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'DIV', 'BLOCKQUOTE'];
    const blocks = new Set<HTMLElement>();

    // 1. Check all candidate blocks inside the editor for overlap with selection
    const candidates = Array.from(this.editableElement.querySelectorAll(blockTags.join(','))) as HTMLElement[];
    candidates.forEach(candidate => {
      if (range.intersectsNode(candidate)) {
        blocks.add(candidate);
      }
    });

    // 2. If no inner blocks found (e.g. selection is entirely inside a block's text),
    // find the closest ancestor block of the selection start
    if (blocks.size === 0) {
      let node: Node | null = range.commonAncestorContainer;
      while (node && node !== this.editableElement.parentElement) {
        if (node.nodeType === Node.ELEMENT_NODE && blockTags.includes((node as HTMLElement).tagName)) {
          blocks.add(node as HTMLElement);
          break;
        }
        node = node.parentNode;
      }
    }

    blocks.forEach(block => {
      block.style.setProperty(property, value);
    });

    this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
    return range;
  }

  /**
   * Creates a link at the current selection.
   * Ensures the link opens in a new tab with proper security attributes.
   */
  createLink(url: string): void {
    this.focus();

    // Security check: strictly block malicious URI schemes
    url = url.trim();
    if (/^(javascript|vbscript|data|file):/i.test(url)) {
      console.warn('Security Warning: Blocked malicious URI scheme.');
      return;
    }

    // Check if it's an email address
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isEmail = emailRegex.test(url);

    // Check if the URL has a protocol, if not add appropriate one
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !url.startsWith('#')) {
      if (isEmail) {
        url = 'mailto:' + url;
      } else {
        url = 'https://' + url;
      }
    }

    // Use execCommand to create the link initially
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // If selection is collapsed (no text selected), insert the URL as text first
      if (range.collapsed) {
        const textNode = document.createTextNode(url);
        range.insertNode(textNode);

        // Select the newly inserted text
        const newRange = document.createRange();
        newRange.selectNodeContents(textNode);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }

    document.execCommand('createLink', false, url);

    // Find the newly created anchor tag and add target="_blank"
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let container = range.commonAncestorContainer as HTMLElement;

      // If the container is a text node, get its parent
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement!;
      }

      // Look for the anchor tag
      let anchor: HTMLAnchorElement | null = null;
      if (container.tagName === 'A') {
        anchor = container as HTMLAnchorElement;
      } else {
        anchor = container.querySelector('a');
      }

      if (anchor) {
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
      }
    }

    this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Inserts an image at the current selection.
   */
  insertImage(url: string, id?: string, isLoading: boolean = false): HTMLElement | null {
    this.focus();
    const range = this.selection.getRange();
    if (!range) return null;

    const figure = document.createElement('figure');
    figure.classList.add('te-image-container');
    figure.setAttribute('contenteditable', 'false');
    if (isLoading) {
      figure.classList.add('is-loading');
    }

    const img = document.createElement('img');
    img.src = url;
    img.classList.add('te-image');
    if (id) {
      img.setAttribute('data-image-id', id);
    }

    const caption = document.createElement('figcaption');
    caption.classList.add('te-image-caption');
    caption.setAttribute('contenteditable', 'true');
    caption.setAttribute('data-placeholder', 'Type caption...');

    // Resize handles
    const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    handles.forEach(pos => {
      const handle = document.createElement('div');
      handle.classList.add('te-image-resizer', `te-resizer-${pos}`);
      figure.appendChild(handle);
    });

    figure.appendChild(img);
    figure.appendChild(caption);

    range.deleteContents();
    range.insertNode(figure);

    // Add a trailing line break to make it easier to type after
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    figure.after(p);

    // Focus the next paragraph
    const nextRange = document.createRange();
    nextRange.setStart(p, 0);
    nextRange.setEnd(p, 0);
    this.selection.restoreSelection(nextRange);

    this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
    this.save();
    return figure;
  }

  /**
   * Returns the clean and optimized HTML content of the editor.
   */
  getHTML(): string {
    const html = this.normalizeHTML(this.editableElement.innerHTML);
    // If it's just a blank placeholder paragraph, return empty string for data export
    if (html === '<p><br></p>' || html === '<p></p>') {
      return '';
    }
    return html;
  }

  /**
   * Returns the plain text content of the editor.
   */
  getText(): string {
    return this.editableElement.innerText || this.editableElement.textContent || '';
  }

  /**
   * Returns the current character count based on plain text.
   */
  getCharCount(): number {
    const text = this.getText();
    // innerText/textContent often includes a trailing newline for the empty block
    return text.replace(/\n$/, '').length;
  }

  /**
   * Normalizes the editor's content in-place.
   */
  public normalize(): void {
    const raw = this.editableElement.innerHTML;

    // CRITICAL QA FIX: Use marker-based preservation for structural changes
    const selection = this.selection.getRange();
    let startMarker: HTMLElement | null = null;
    let endMarker: HTMLElement | null = null;

    if (selection && this.editableElement.contains(selection.commonAncestorContainer)) {
      startMarker = document.createElement('span');
      startMarker.id = 'te-selection-start';
      startMarker.style.display = 'none';

      endMarker = document.createElement('span');
      endMarker.id = 'te-selection-end';
      endMarker.style.display = 'none';

      const startRange = selection.cloneRange();
      startRange.collapse(true);
      startRange.insertNode(startMarker);

      const endRange = selection.cloneRange();
      endRange.collapse(false);
      endRange.insertNode(endMarker);
    }

    const normalized = this.normalizeHTML(this.editableElement.innerHTML);

    // Always apply if markers were added, or if HTML changed
    if (normalized !== raw || startMarker) {
      this.editableElement.innerHTML = normalized;

      const newStart = this.editableElement.querySelector('#te-selection-start');
      const newEnd = this.editableElement.querySelector('#te-selection-end');

      if (newStart && newEnd) {
        const range = document.createRange();
        range.setStartAfter(newStart);
        range.setEndBefore(newEnd);
        this.selection.restoreSelection(range);
      }

      // Cleanup markers
      this.editableElement.querySelectorAll('#te-selection-start, #te-selection-end').forEach(el => el.remove());
    }

    this.checkPlaceholder();
  }

  private normalizationContainer: HTMLElement | null = null;

  /**
   * Internal helper to strictly sanitize HTML strings.
   */
  private sanitize(html: string): string {
    // Add temporary hook to enforce security on all links
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });

    const result = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'b', 'i', 'u', 's', 'span', 'div', 'p', 'br', 'a',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'hr', 'pre', 'code',
        'img', 'table', 'tbody', 'tr', 'td', 'th', 'thead', 'tfoot',
        'figure', 'figcaption'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'style', 'color', 'background-color',
        'class', 'id', 'target', 'rel', 'contenteditable', 'data-placeholder', 'data-image-id'
      ],
      ALLOW_DATA_ATTR: true,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'textarea'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });

    // Cleanup hook
    DOMPurify.removeHook('afterSanitizeAttributes');
    return result;
  }

  private isBlockElement(node: Node): boolean {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const tagName = (node as HTMLElement).tagName;
    return ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE', 'PRE', 'HR', 'FIGURE'].includes(tagName);
  }

  /**
   * Optimizes HTML by fixing invalid nesting and removing redundant tags.
   */
  private normalizeHTML(html: string): string {
    if (!this.normalizationContainer) {
      this.normalizationContainer = document.createElement('div');
    }

    const container = this.normalizationContainer;
    container.innerHTML = html;

    // 0. Wrap top-level text nodes and inline elements in <p>
    const rootNodes = Array.from(container.childNodes);
    let currentP: HTMLParagraphElement | null = null;
    
    rootNodes.forEach(node => {
      if (this.isBlockElement(node)) {
        currentP = null;
        // Ensure pre blocks have a code tag and copy button
        if (node.nodeName === 'PRE') {
          const pre = node as HTMLElement;
          
          // 1. Ensure <code> tag exists
          if (!pre.querySelector('code')) {
            const code = document.createElement('code');
            code.innerHTML = pre.innerHTML;
            pre.innerHTML = '';
            pre.appendChild(code);
          }

          // 2. Ensure wrapper exists
          let wrapper = pre.parentElement;
          if (!wrapper || !wrapper.classList.contains('te-code-wrapper')) {
            wrapper = document.createElement('div');
            wrapper.className = 'te-code-wrapper';
            wrapper.contentEditable = 'false';
            pre.before(wrapper);
            wrapper.appendChild(pre);
            pre.contentEditable = 'true';
          }

           // 3. Ensure Controls Hub is in the WRAPPER (top right)
           let controls = wrapper.querySelector('.te-code-controls') as HTMLElement;
           if (!controls) {
              controls = document.createElement('div');
              controls.className = 'te-code-controls';
              controls.contentEditable = 'false';
              wrapper.insertBefore(controls, pre);
           }

           // 4. Ensure Buttons are in the Controls Hub
           if (!controls.querySelector('.te-code-copy-btn')) {
              const btn = document.createElement('div');
              btn.className = 'te-code-copy-btn';
              btn.textContent = 'Copy';
              btn.contentEditable = 'false';
              controls.appendChild(btn);
           }
           if (!controls.querySelector('.te-code-remove-btn')) {
              const btn = document.createElement('div');
              btn.className = 'te-code-remove-btn';
              btn.contentEditable = 'false';
              btn.title = 'Remove Code Block';
              btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
              controls.appendChild(btn);
           }

           // Cleanup old floating buttons if they exist
           wrapper.querySelectorAll(':scope > .te-code-remove-btn, :scope > pre > .te-code-copy-btn').forEach(el => el.remove());

           // 5. Ensure 4 Resize Bars exist
           ['top', 'bottom', 'left', 'right'].forEach(dir => {
              if (!wrapper.querySelector(`.te-bar-${dir}`)) {
                 const bar = document.createElement('div');
                 bar.className = `te-resize-bar te-bar-${dir}`;
                 bar.contentEditable = 'false';
                 wrapper.appendChild(bar);
              }
           });

           // 6. Ensure 4 Corners exist
           ['tl', 'tr', 'bl', 'br'].forEach(corner => {
              if (!wrapper.querySelector(`.te-corner-${corner}`)) {
                 const handle = document.createElement('div');
                 handle.className = `te-resize-corner te-corner-${corner}`;
                 handle.contentEditable = 'false';
                 wrapper.appendChild(handle);
              }
           });

           // Cleanup old singular resize components
           wrapper.querySelectorAll(':scope > .te-code-resize-handle, :scope > .te-code-resize-bar').forEach(el => el.remove());
        }
      } else {
        // Skip whitespace-only text nodes between blocks
        if (node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim() === '' && !currentP) {
          return;
        }

        if (!currentP) {
          currentP = document.createElement('p');
          node.before(currentP);
        }
        currentP.appendChild(node);
      }
    });

    // 1. Fix structural nesting: lift <ul>, <ol>, <table> out of <p>
    const paras = container.querySelectorAll('p');
    paras.forEach(p => {
      const complexBlocks = p.querySelectorAll('ul, ol, table, h1, h2, h3, h4, h5, h6, pre, blockquote');
      if (complexBlocks.length > 0) {
        complexBlocks.forEach(block => {
          // Move block after the paragraph
          p.after(block);
        });
        // If the paragraph is now empty (or only has whitespace/BR), remove it
        if (p.innerHTML.trim() === '' || p.innerHTML.trim() === '<br>') {
          p.remove();
        }
      }
    });

    // 2. Remove redundant spans (those without attributes or empty)
    container.querySelectorAll('span').forEach(span => {
      // QA FIX: Do not remove selection markers
      if (span.id.startsWith('te-selection-')) return;

      if (span.attributes.length === 0) {
        const text = document.createTextNode(span.textContent || '');
        span.replaceWith(text);
      } else if (span.innerHTML.trim() === '') {
        span.remove();
      }
    });

    // 2.1 Merge adjacent identical spans
    const spans = Array.from(container.querySelectorAll('span'));
    spans.forEach(span => {
      if (!span.parentNode) return; // Already removed/merged

      let next = span.nextSibling;
      // Skip whitespace text nodes
      while (next && next.nodeType === Node.TEXT_NODE && next.textContent?.trim() === '') {
        next = next.nextSibling;
      }

      if (next && next.nodeType === Node.ELEMENT_NODE && (next as HTMLElement).tagName === 'SPAN') {
        const nextSpan = next as HTMLElement;
        const style1 = span.getAttribute('style') || '';
        const style2 = nextSpan.getAttribute('style') || '';
        const class1 = span.getAttribute('class') || '';
        const class2 = nextSpan.getAttribute('class') || '';

        if (style1 === style2 && class1 === class2 && !span.id && !nextSpan.id) {
          // Merge contents
          while (nextSpan.firstChild) {
            span.appendChild(nextSpan.firstChild);
          }
          nextSpan.remove();
        }
      }
    });

    // 3. Remove empty paragraphs (except if it's the only one or has a BR)
    const allParas = Array.from(container.querySelectorAll('p'));

    // First remove empty ones in the middle
    allParas.forEach(p => {
      if (p.innerHTML.trim() === '' && container.childNodes.length > 1 && p !== container.lastElementChild) {
        p.remove();
      }
    });

    // Then trim from the end
    for (let i = allParas.length - 1; i >= 0; i--) {
      const p = allParas[i];
      const isEmpty = p.innerHTML.trim() === '' || p.innerHTML.trim() === '<br>';
      const isLast = p === container.lastElementChild;

      if (isEmpty && isLast && container.children.length > 1) {
        p.remove();
      } else {
        break;
      }
    }

    // 4. Ensure a trailing empty paragraph if the last element is a "trapping" block
    const lastChild = container.lastElementChild as HTMLElement;
    const trappingBlocks = ['PRE', 'TABLE', 'FIGURE', 'BLOCKQUOTE', 'UL', 'OL', 'HR'];
    if (lastChild && trappingBlocks.includes(lastChild.tagName)) {
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      container.appendChild(p);
    }

    // 5. Final check: if the output is just an empty paragraph, keep it as a placeholder
    // This ensures we always have a <p> tag for styling even when empty
    if (container.innerHTML.trim() === '' || container.innerHTML.trim() === '<p><br></p>' || container.innerHTML.trim() === '<p></p>') {
      return '<p><br></p>';
    }

    // CRITICAL SECURITY FIX: Sanitize the final normalized output
    return this.sanitize(container.innerHTML);
  }

  // Handle paste events to sanitize inherited malware and styles
  private handlePaste(e: ClipboardEvent): void {
    e.preventDefault();

    let text = (e.clipboardData || (window as any).clipboardData).getData('text/plain');
    let html = (e.clipboardData || (window as any).clipboardData).getData('text/html');

    // First, check for image files in clipboard items
    if (e.clipboardData && e.clipboardData.items) {
      const files: File[] = [];
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        this.handleFiles(files);
        return;
      }
    }

    // Truncate based on character limit if enabled
    if (this.options.maxCharCount && this.options.strictCharLimit) {
      const currentCount = this.getCharCount();
      const selection = window.getSelection();
      let selectionLength = 0;
      if (selection && selection.rangeCount > 0) {
        selectionLength = selection.toString().length;
      }

      const available = this.options.maxCharCount - (currentCount - selectionLength);
      if (available <= 0) {
        return; // No space left
      }

      if (text.length > available) {
        text = text.substring(0, available);
        // If we truncate, we force plain text to avoid broken HTML tags
        html = '';
      }
    }

    // Auto-format pasted raw HTML strings if it's plain text code
    const isHtmlString = /<([a-z1-6]+)\b[^>]*>[\s\S]*<\/\1>/i.test(text) || /^\s*<[a-z1-6]+\b[^>]*>/i.test(text);
    if (!html && text && isHtmlString) {
      html = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/>\s+</g, "><").trim();
    }

    // If no image files, process HTML or plain text
    if (html) {
      // Sanitize the HTML before inserting
      const safeHTML = this.sanitize(html);
      this.execute('insertHTML', safeHTML);
    } else if (text) {
      // Just plain text
      this.execute('insertText', text);
    }
  }

  /**
   * Sets the HTML content of the editor.
   */
  setHTML(html: string): void {
    const safeHTML = this.sanitize(html);
    this.editableElement.innerHTML = safeHTML;
  }

  /**
   * Internal access to the editable element.
   */
  get el(): HTMLElement {
    return this.editableElement;
  }

  /**
   * Returns the editor options.
   */
  getOptions(): EditorOptions {
    return this.options;
  }

  /**
   * Internal helper to handle multiple files.
   */
  public async handleFiles(files: File[]): Promise<void> {
    const maxMB = this.options.maxImageSizeMB || 5;

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      let placeholder: HTMLElement | null = null;
      try {
        // 1. Enforce size limit (Pre-compression check)
        if (file.size > maxMB * 1024 * 1024 * 3) { // Allow 3x limit for compression attempt
          console.warn(`File ${file.name} is too large to even attempt processing.`);
          continue;
        }

        if (this.options.onSaving) this.options.onSaving();

        // 2. Insert Preview Placeholder immediately
        const previewUrl = URL.createObjectURL(file);
        placeholder = this.insertImage(previewUrl, undefined, true);

        // 3. Compress Client-Side
        const processedFile = await ImageUploader.compressImage(file, maxMB);

        // Update placeholder preview with compressed blob if significantly different or if URL revoked
        const compressedUrl = URL.createObjectURL(processedFile);
        if (placeholder) {
          const img = placeholder.querySelector('img');
          if (img) img.src = compressedUrl;
        }

        // Final check after compression
        if (processedFile.size > maxMB * 1024 * 1024) {
          alert(`Image "${file.name}" exceeds the ${maxMB}MB limit even after compression.`);
          placeholder?.remove();
          continue;
        }

        // 4. Upload (Custom or Fallback)
        const result = await ImageUploader.uploadFile(processedFile, this.options);

        if (result) {
          if (placeholder) {
            const img = placeholder.querySelector('img');
            if (img) {
              img.src = result.imageUrl;
              if (result.imageId) img.setAttribute('data-image-id', result.imageId);
            }
            placeholder.classList.remove('is-loading');
          } else {
            this.insertImage(result.imageUrl, result.imageId);
          }
        } else {
          // 5. Default Base64 Fallback
          const reader = new FileReader();
          reader.onload = (event) => {
            const url = event.target?.result as string;
            if (placeholder) {
              const img = placeholder.querySelector('img');
              if (img) img.src = url;
              placeholder.classList.remove('is-loading');
            } else {
              this.insertImage(url);
            }
          };
          reader.readAsDataURL(processedFile);
        }
      } catch (error) {
        console.error('Image handling failed', error);
        placeholder?.remove();
      } finally {
        if (this.options.onSave) this.save(); // Cleanup status
      }
    }
  }

  public insertCodeBlock(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'te-code-wrapper';
    wrapper.contentEditable = 'false';
    
    const pre = document.createElement('pre');
    pre.contentEditable = 'true';
    const code = document.createElement('code');
    code.innerHTML = '<br>';
    pre.appendChild(code);
    
    // Unified Controls Hub (Top-Right)
    const controls = document.createElement('div');
    controls.className = 'te-code-controls';
    controls.contentEditable = 'false';

    const copyBtn = document.createElement('div');
    copyBtn.className = 'te-code-copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.contentEditable = 'false';
    
    const removeBtn = document.createElement('div');
    removeBtn.className = 'te-code-remove-btn';
    removeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    removeBtn.contentEditable = 'false';
    removeBtn.title = 'Remove Code Block';

    controls.appendChild(copyBtn);
    controls.appendChild(removeBtn);
    wrapper.appendChild(controls);
    wrapper.appendChild(pre);

    // 4-Directional Resize Bars
    ['top', 'bottom', 'left', 'right'].forEach(dir => {
      const bar = document.createElement('div');
      bar.className = `te-resize-bar te-bar-${dir}`;
      bar.contentEditable = 'false';
      wrapper.appendChild(bar);
    });

    // Corner Handles
    ['tl', 'tr', 'bl', 'br'].forEach(corner => {
      const handle = document.createElement('div');
      handle.className = `te-resize-corner te-corner-${corner}`;
      handle.contentEditable = 'false';
      wrapper.appendChild(handle);
    });

    range.deleteContents();
    range.insertNode(wrapper);
    
    this.selection.setCursorAtStart(code);
    this.normalize();
    this.history.record(this.editableElement.innerHTML, this.selection.getSelectionPath(this.editableElement));
  }

  private handleCodeRemove(btn: HTMLElement): void {
    const wrapper = btn.closest('.te-code-wrapper') as HTMLElement;
    if (!wrapper) return;
    
    // Find neighbors for cursor migration
    const prev = wrapper.previousElementSibling;
    const next = wrapper.nextElementSibling;
    const parent = wrapper.parentElement;

    // Remove the entire block including all text
    wrapper.remove();

    // Migrate cursor to a valid location
    if (next) {
      if (next.tagName === 'PRE' || next.classList.contains('te-code-wrapper')) {
        const target = next.querySelector('code') || next.querySelector('pre') || next;
        this.selection.setCursorAtStart(target);
      } else {
        this.selection.setCursorAtStart(next);
      }
    } else if (prev) {
      this.selection.setCursorAtEnd(prev);
    } else if (parent) {
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      parent.appendChild(p);
      this.selection.setCursorAtStart(p);
    }

    this.normalize();
    this.history.record(this.editableElement.innerHTML, this.selection.getSelectionPath(this.editableElement));
  }

  private handleCodeCopy(btn: HTMLElement): void {
    if (btn.classList.contains('copied')) return;

    const pre = btn.parentElement;
    if (!pre) return;
    
    const code = pre.querySelector('code');
    const text = code ? code.innerText : pre.innerText.replace('Copy', '').trim();
    
    navigator.clipboard.writeText(text).then(() => {
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('copied');
      }, 2000);
    });
  }

  private showCodeContextMenu(x: number, y: number, wrapper: HTMLElement): void {
    this.hideCodeContextMenu();

    const menu = document.createElement('div');
    menu.className = 'te-code-context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const themeSection = document.createElement('div');
    themeSection.className = 'te-menu-section';
    themeSection.innerHTML = '<div class="te-menu-label">Code Themes</div>';
    
    const grid = document.createElement('div');
    grid.className = 'te-theme-grid';
    
    const themes = ['slate', 'ocean', 'forest', 'crimson', 'terminal'];
    const currentTheme = Array.from(wrapper.classList).find(c => c.startsWith('te-theme-'))?.replace('te-theme-', '') || 'slate';

    themes.forEach(t => {
      const dot = document.createElement('div');
      dot.className = `te-theme-dot ${t === currentTheme ? 'active' : ''}`;
      dot.dataset.theme = t;
      dot.title = t.charAt(0).toUpperCase() + t.slice(1);
      dot.onclick = (e) => {
        e.stopPropagation();
        this.applyCodeTheme(wrapper, t);
        this.hideCodeContextMenu();
      };
      grid.appendChild(dot);
    });

    themeSection.appendChild(grid);
    menu.appendChild(themeSection);
    
    // Custom Color Trigger
    const customTrigger = document.createElement('div');
    customTrigger.className = 'te-custom-color-trigger';
    customTrigger.innerHTML = '<span>Custom Color</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
    customTrigger.onclick = (e) => {
      e.stopPropagation();
      this.showCustomColorPicker(wrapper, themeSection, menu);
    };
    menu.appendChild(customTrigger);
    
    document.body.appendChild(menu);
    
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = `${window.innerWidth - rect.width - 10}px`;
    if (rect.bottom > window.innerHeight) menu.style.top = `${window.innerHeight - rect.height - 10}px`;

    const closer = (e: Event) => {
      if (menu.contains(e.target as Node)) return;
      this.hideCodeContextMenu();
      document.removeEventListener('mousedown', closer);
      document.removeEventListener('wheel', closer);
    };
    setTimeout(() => {
      document.addEventListener('mousedown', closer);
      document.addEventListener('wheel', closer);
    }, 0);
  }

  private hideCodeContextMenu(): void {
    const existing = document.querySelector('.te-code-context-menu');
    if (existing) existing.remove();
  }

  private applyCodeTheme(wrapper: HTMLElement, theme: string): void {
    const pre = wrapper.querySelector('pre') as HTMLElement;
    if (pre) {
      pre.removeAttribute('style');
    }

    Array.from(wrapper.classList).forEach(c => {
      if (c.startsWith('te-theme-')) wrapper.classList.remove(c);
    });
    
    if (theme !== 'slate') {
      wrapper.classList.add(`te-theme-${theme}`);
    }
    
    this.history.record(this.editableElement.innerHTML, this.selection.getSelectionPath(this.editableElement));
  }

  private showCustomColorPicker(wrapper: HTMLElement, _parentSection: HTMLElement, menu: HTMLElement): void {
    const existing = menu.querySelector('.te-color-picker-container');
    if (existing) {
      existing.remove();
      return;
    }

    const container = document.createElement('div');
    container.className = 'te-color-picker-container';
    
    const pre = wrapper.querySelector('pre') as HTMLElement;
    const currentBg = pre.style.backgroundColor || '#0f172a';
    
    // Hex converter for color input
    let hexBg = currentBg;
    if (currentBg.startsWith('rgb')) {
       const rgb = currentBg.match(/\d+/g);
       if (rgb) {
          hexBg = '#' + rgb.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
       }
    }

    container.innerHTML = `
      <div class="te-color-input-wrapper">
        <input type="color" class="te-color-input" value="${hexBg.startsWith('#') ? hexBg : '#0f172a'}">
        <span style="font-size: 11px; color: #e2e8f0;">Choose Color</span>
      </div>
      <div class="te-picker-actions">
        <button class="te-picker-btn cancel">Cancel</button>
        <button class="te-picker-btn apply">Apply</button>
      </div>
    `;

    const input = container.querySelector('.te-color-input') as HTMLInputElement;
    const applyBtn = container.querySelector('.te-picker-btn.apply') as HTMLButtonElement;
    const cancelBtn = container.querySelector('.te-picker-btn.cancel') as HTMLButtonElement;

    applyBtn.onclick = (e) => {
      e.stopPropagation();
      this.applyCustomColor(wrapper, input.value);
      this.hideCodeContextMenu();
    };

    cancelBtn.onclick = (e) => {
      e.stopPropagation();
      container.remove();
    };

    menu.appendChild(container);
  }

  private applyCustomColor(wrapper: HTMLElement, bgColor: string): void {
    const pre = wrapper.querySelector('pre') as HTMLElement;
    if (!pre) return;

    // Remove theme classes
    Array.from(wrapper.classList).forEach(c => {
      if (c.startsWith('te-theme-')) wrapper.classList.remove(c);
    });

    const textColor = this.getContrastColor(bgColor);
    pre.style.backgroundColor = bgColor;
    pre.style.color = textColor;
    pre.style.borderColor = this.adjustColorBrightness(bgColor, -20);
    
    this.history.record(this.editableElement.innerHTML, this.selection.getSelectionPath(this.editableElement));
  }

  private getContrastColor(hexcolor: string): string {
    if (hexcolor.startsWith('#')) hexcolor = hexcolor.slice(1);
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    // For code blocks we want high contrast
    return (yiq >= 128) ? '#0f172a' : '#f8fafc';
  }

  private adjustColorBrightness(hex: string, percent: number): string {
    if (hex.startsWith('#')) hex = hex.slice(1);
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    r = Math.max(0, Math.min(255, r + (r * percent / 100)));
    g = Math.max(0, Math.min(255, g + (g * percent / 100)));
    b = Math.max(0, Math.min(255, b + (b * percent / 100)));

    return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  }

  private handleCodeResizeStart(e: MouseEvent, handle: HTMLElement): void {
    e.preventDefault();
    e.stopPropagation();

    const wrapper = handle.closest('.te-code-wrapper') as HTMLElement;
    const pre = wrapper.querySelector('pre') as HTMLElement;
    if (!pre) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = wrapper.offsetWidth;
    const startHeight = wrapper.offsetHeight;
    const startMarginTop = parseInt(window.getComputedStyle(wrapper).marginTop || '0');
    const startMarginLeft = parseInt(window.getComputedStyle(wrapper).marginLeft || '0');
    
    // Direction detection
    const isTop = handle.classList.contains('te-bar-top') || handle.classList.contains('te-corner-tl') || handle.classList.contains('te-corner-tr');
    const isBottom = handle.classList.contains('te-bar-bottom') || handle.classList.contains('te-corner-bl') || handle.classList.contains('te-corner-br');
    const isLeft = handle.classList.contains('te-bar-left') || handle.classList.contains('te-corner-tl') || handle.classList.contains('te-corner-bl');
    const isRight = handle.classList.contains('te-bar-right') || handle.classList.contains('te-corner-tr') || handle.classList.contains('te-corner-br');

    handle.classList.add('active');
    wrapper.classList.add('resizing');

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Handle Height
      if (isBottom) {
        wrapper.style.height = `${Math.max(60, startHeight + deltaY)}px`;
      } else if (isTop) {
        const newHeight = Math.max(60, startHeight - deltaY);
        if (newHeight > 60) {
          wrapper.style.height = `${newHeight}px`;
          wrapper.style.marginTop = `${startMarginTop + deltaY}px`;
        }
      }

      // Handle Width
      if (isRight) {
        wrapper.style.width = `${Math.max(100, startWidth + deltaX)}px`;
      } else if (isLeft) {
        const newWidth = Math.max(100, startWidth - deltaX);
        if (newWidth > 100) {
          wrapper.style.width = `${newWidth}px`;
          wrapper.style.marginLeft = `${startMarginLeft + deltaX}px`;
        }
      }
    };

    const onMouseUp = () => {
      handle.classList.remove('active');
      wrapper.classList.remove('resizing');
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      
      this.history.record(this.editableElement.innerHTML, this.selection.getSelectionPath(this.editableElement));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
}
