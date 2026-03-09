import { SelectionManager } from './SelectionManager';
import { ImageManager } from './ImageManager';
import { HistoryManager } from './HistoryManager';

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
  toolbarItems?: string[]; // IDs of tools to show
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
  private eventListeners: Array<{ target: EventTarget, type: string, handler: any }> = [];

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
    // Create the contenteditable area first
    this.editableElement = this.createEditableElement();

    // Now initialize managers that depend on the element
    this.selection = new SelectionManager();
    this.imageManager = new ImageManager(this);
    this.history = new HistoryManager(this.editableElement.innerHTML);

    this.setupInputHandlers();
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

    // Set default paragraph separator to <p>
    document.execCommand('defaultParagraphSeparator', false, 'p');
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
    } else {
      this.container.classList.remove('te-dark');
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
    this.container.classList.remove('te-container', 'te-dark');
    this.container.removeAttribute('style');
  }

  protected checkPlaceholder(): void {
    if (!this.editableElement) return;
    
    // Logically empty if it has no text and no images/other media
    const isEmpty = this.editableElement.textContent?.trim() === '' && 
                    !this.editableElement.querySelector('img') &&
                    !this.editableElement.querySelector('table');
    
    if (isEmpty) {
      this.editableElement.classList.add('is-empty');
    } else {
      this.editableElement.classList.remove('is-empty');
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
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const url = event.target?.result as string;
              this.insertImage(url);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    });

    // Handle paste events for images
    this.addEventListener(this.editableElement, 'paste', (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      if (clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault(); // Stop default pasting of image/html
              const reader = new FileReader();
              reader.onload = (event) => {
                const url = event.target?.result as string;
                this.insertImage(url);
              };
              reader.readAsDataURL(file);
              return; // handled
            }
          }
        }
      }

      // 2. Auto-format pasted raw HTML strings (if it contains block/inline tags)
      // If the clipboard has plain text that looks like HTML code, parse it.
      // We avoid touching it if the clipboard mainly has text/html rendering, 
      // UNLESS the user copied raw html code which comes in as text/plain.
      const plainText = clipboardData.getData('text/plain');

      // Basic heuristic: string starts with a common tag or contains paired tags
      const isHtmlString = /<([a-z1-6]+)\b[^>]*>[\s\S]*<\/\1>/i.test(plainText) || /^\s*<[a-z1-6]+\b[^>]*>/i.test(plainText);

      if (plainText && isHtmlString) {
        // Clean the HTML string to remove newlines and excessive whitespace between tags
        const cleanedHtml = plainText
          .replace(/(\r\n|\n|\r)/gm, " ") // Remove all newlines
          .replace(/>\s+</g, "><")         // Remove any remaining spaces between tags
          .trim();

        e.preventDefault();
        this.execute('insertHTML', cleanedHtml);
        return;
      }

      // 3. We no longer intercept text/html completely because the MutationObserver
      // will catch any raw <img> tags that the browser successfully pastes and 
      // automatically wrap them in our resizer containers. 
      // This is much safer than trying to parse clipboard HTML manually and breaking text formatting.
    });

    // Handle input for history and auto-save
    this.addEventListener(this.editableElement, 'input', () => {
      this.handleInput();
    });

    this.addEventListener(this.editableElement, 'keydown', (e: KeyboardEvent) => {
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
    });
  }

  private handleInput(): void {
    this.scheduleHistoryRecord();

    if (this.options.autoSave) {
      if (this.options.onSaving) {
        this.options.onSaving();
      }
      this.scheduleAutoSave();
    }
    
    if (this.options.onChange) {
      this.options.onChange(this.editableElement.innerHTML);
    }
  }

  private scheduleHistoryRecord(): void {
    if (this.historyTimeout) clearTimeout(this.historyTimeout);
    this.historyTimeout = setTimeout(() => {
      this.history.record(this.editableElement.innerHTML);
    }, 500); // Record after 500ms of inactivity
  }

  private scheduleAutoSave(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    const interval = this.options.autoSaveInterval || 1000;
    this.saveTimeout = setTimeout(() => {
      this.save();
    }, interval);
  }

  public save(): void {
    if (this.options.onSave) {
      this.options.onSave(this.editableElement.innerHTML);
    }
  }

  public undo(): void {
    const html = this.history.undo();
    if (html !== null) {
      this.editableElement.innerHTML = html;
      this.triggerChange();
    }
  }

  public redo(): void {
    const html = this.history.redo();
    if (html !== null) {
      this.editableElement.innerHTML = html;
      this.triggerChange();
    }
  }

  private triggerChange(): void {
    this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
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
   * Inserts a table at the current selection.
   */
  insertTable(rows: number = 3, cols: number = 3): void {
    this.focus();
    const range = this.selection.getRange();
    if (!range) return;

    const table = document.createElement('table');
    table.classList.add('te-table');
    
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const td = document.createElement('td');
        td.innerHTML = '<br>'; // Empty cell
        tr.appendChild(td);
      }
      table.appendChild(tr);
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
  deleteRow(): void {
    const td = this.getSelectedTd();
    if (td && td.parentElement) {
      const tr = td.parentElement;
      const table = tr.parentElement as HTMLTableElement;
      if (table.rows.length > 1) {
        tr.remove();
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
  deleteColumn(): void {
    const td = this.getSelectedTd();
    if (!td) return;

    const table = this.getSelectedTable();
    if (!table) return;

    const cellIndex = td.cellIndex;
    if (table.rows[0].cells.length > 1) {
      for (let i = 0; i < table.rows.length; i++) {
        table.rows[i].cells[cellIndex].remove();
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
      // The tests expect raw value passthrough (UI handles bounds)
      if (!value.endsWith('px')) {
        // Just a safety check if no unit is provided
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
   * Creates a link at the current selection.
   * Ensures the link opens in a new tab with proper security attributes.
   */
  createLink(url: string): void {
    this.focus();

    // Check if the URL has a protocol, if not add https://
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !url.startsWith('#')) {
      url = 'https://' + url;
    }

    // Use execCommand to create the link initially
    document.execCommand('createLink', false, url);

    // Find the newly created anchor tag and add target="_blank"
    const selection = window.getSelection();
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
  insertImage(url: string): void {
    this.focus();
    const range = this.selection.getRange();
    if (!range) return;

    const figure = document.createElement('figure');
    figure.classList.add('te-image-container');
    figure.setAttribute('contenteditable', 'false');

    const img = document.createElement('img');
    img.src = url;
    img.classList.add('te-image');

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

    // Add a new paragraph after the figure for easier typing
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    figure.after(p);

    // Focus the next paragraph
    const nextRange = document.createRange();
    nextRange.setStart(p, 0);
    nextRange.setEnd(p, 0);
    this.selection.restoreSelection(nextRange);

    this.editableElement.dispatchEvent(new Event('input', { bubbles: true }));
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

  /**
   * Returns the editor options.
   */
  getOptions(): EditorOptions {
    return this.options;
  }
}
