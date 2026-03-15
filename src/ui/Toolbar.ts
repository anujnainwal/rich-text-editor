import { CoreEditor } from '../core/Editor';
import { ToolbarItem } from './toolbar/ToolbarItem';
import { toolbarItems } from './toolbar/registry';
import { EmojiPicker } from './toolbar/EmojiPicker';
import { InputModal } from './toolbar/InputModal';

export class Toolbar {
  private editor: CoreEditor;
  private container: HTMLElement;
  private savedRange: Range | null = null;
  private items: ToolbarItem[] = toolbarItems;
  private activePicker: EmojiPicker | null = null;
  private activeModal: InputModal | null = null;
  private statusEl: HTMLElement | null = null;
  private charCountEl: HTMLElement | null = null;
  private saveStatusEl: HTMLElement | null = null;
  private boundUpdateActiveStates: () => void;
  private itemElements: Map<ToolbarItem, HTMLElement> = new Map();


  constructor(editor: CoreEditor) {
    this.editor = editor;
    this.container = this.createToolbarElement();
    this.boundUpdateActiveStates = this.updateActiveStates.bind(this);
    this.render();
  }

  private createToolbarElement(): HTMLElement {
    const el = document.createElement('div');
    el.classList.add('te-toolbar');

    // Create status container on the right
    this.statusEl = document.createElement('div');
    this.statusEl.classList.add('te-toolbar-status');
    this.statusEl.style.marginLeft = 'auto'; // Push to right
    this.statusEl.style.display = 'flex';
    this.statusEl.style.alignItems = 'center';
    this.statusEl.style.gap = '6px';
    this.statusEl.style.fontSize = '12px';
    this.statusEl.style.color = 'var(--te-text-muted)';
    this.statusEl.style.paddingRight = '12px';

    // Internal segments
    this.saveStatusEl = document.createElement('span');
    this.charCountEl = document.createElement('span');
    this.charCountEl.style.fontWeight = '500';

    this.statusEl.appendChild(this.charCountEl);
    this.statusEl.appendChild(this.saveStatusEl);

    return el;
  }

  private render(): void {
    const allowedItems = this.editor.getOptions().toolbarItems;

    // First pass: identify visible items
    const visibleItems: ToolbarItem[] = [];
    this.items.forEach(item => {
      if (item.type === 'divider') {
        visibleItems.push(item);
      } else if (item.id && (!allowedItems || allowedItems.includes(item.id))) {
        visibleItems.push(item);
      }
    });

    // Second pass: clean up dividers
    const finalItems: ToolbarItem[] = [];
    visibleItems.forEach((item, index) => {
      if (item.type === 'divider') {
        // Skip leading dividers
        if (finalItems.length === 0) return;
        // Skip consecutive dividers
        if (finalItems[finalItems.length - 1].type === 'divider') return;

        // Peek ahead to see if there are any non-divider items left
        const hasMoreTools = visibleItems.slice(index + 1).some(next => next.type !== 'divider');
        if (!hasMoreTools) return;

        finalItems.push(item);
      } else {
        finalItems.push(item);
      }
    });

    // Render the final set
    finalItems.forEach(item => {
      if (item.type === 'button') {
        this.renderButton(item);
      } else if (item.type === 'select') {
        this.renderSelect(item);
      } else if (item.type === 'input') {
        this.renderInput(item);
      } else if (item.type === 'color-picker') {
        this.renderColorPicker(item);
      } else if (item.type === 'divider') {
        const divider = document.createElement('div');
        divider.classList.add('te-divider');
        this.container.appendChild(divider);
      }
    });

    const showStatus = this.editor.getOptions().showStatus !== false;
    if (showStatus) {
      this.container.appendChild(this.statusEl!);
    }

    // Handle selection change to update states
    this.editor.el.addEventListener('keyup', this.boundUpdateActiveStates);
    this.editor.el.addEventListener('mouseup', this.boundUpdateActiveStates);
  }

  private renderButton(item: ToolbarItem): void {
    const button = document.createElement('button');
    button.classList.add('te-button');
    // Security: item.icon is a trusted internal SVG string.
    // We insert it as HTML but ensure no user-provided strings are directly used.
    button.innerHTML = item.icon || '';
    button.title = item.title;
    this.itemElements.set(item, button);

    button.addEventListener('mousedown', (e) => {
      e.preventDefault();

      if (item.command === 'createLink' || item.command === 'insertTable' || item.command === 'insertImage') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (this.editor.el.contains(range.commonAncestorContainer)) {
            this.savedRange = range.cloneRange();
          }
        }
      }

      if (item.command === 'insertEmoji') {
        if (!this.activePicker) {
          this.activePicker = new EmojiPicker(
            (emoji) => {
              this.editor.execute('insertText', emoji);
            },
            () => { this.activePicker = null; },
            this.editor.getOptions().theme,
            this.editor.getOptions().dark
          );
          this.activePicker.show(button);
        } else {
          this.activePicker.close();
        }
        return;
      }

      if (item.command === 'insertImage') {
        if (this.activeModal) this.activeModal.close();

        this.activeModal = new InputModal(
          'Insert Image',
          [
            { id: 'url', label: 'Image URL', type: 'text', placeholder: 'https://example.com/image.jpg' },
            { id: 'file', label: 'Or Upload File', type: 'file' }
          ],
          (values) => {
            if (this.savedRange) {
              const selection = window.getSelection();
              if (selection) {
                selection.removeAllRanges();
                selection.addRange(this.savedRange);
              }
            }

            if (values.file) {
              // File upload takes precedence if selected
              this.editor.handleFiles([values.file]);
            } else if (values.url && values.url.trim() !== '') {
              // Otherwise use URL if provided
              this.editor.insertImage(values.url);
            }
            
            this.savedRange = null;
          },
          () => {
            this.activeModal = null;
            this.savedRange = null;
          },
          this.editor.getOptions().theme,
          this.editor.getOptions().dark
        );

        this.activeModal.show(button);
        return;
      }



      if (['addRow', 'deleteRow', 'addColumn', 'deleteColumn'].includes(item.command || '')) {
        const cmd = item.command as 'addRow' | 'deleteRow' | 'addColumn' | 'deleteColumn';
        this.editor[cmd]();
        return;
      }

      if (item.command === 'undo') {
        this.editor.undo();
        return;
      }
      if (item.command === 'redo') {
        this.editor.redo();
        return;
      }

      if (item.command === 'createLink') {
        if (this.activeModal) this.activeModal.close();
        
        this.activeModal = new InputModal(
          'Insert Link',
          [{ id: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com' }],
          (values) => {
            if (this.savedRange) {
              const selection = window.getSelection();
              if (selection) {
                selection.removeAllRanges();
                selection.addRange(this.savedRange);
              }
            }
            this.editor.createLink(values.url);
            this.savedRange = null;
          },
          () => { 
            this.activeModal = null;
            this.savedRange = null;
          },
          this.editor.getOptions().theme,
          this.editor.getOptions().dark
        );
        this.activeModal.show(button);
        return;
      }

      if (item.command === 'insertTable') {
        if (this.activeModal) this.activeModal.close();

        this.activeModal = new InputModal(
          'Insert Table',
          [
            { id: 'rows', label: 'Rows', type: 'number', defaultValue: '3', min: '1' },
            { id: 'cols', label: 'Columns', type: 'number', defaultValue: '3', min: '1' }
          ],
          (values) => {
            if (this.savedRange) {
              const selection = window.getSelection();
              if (selection) {
                selection.removeAllRanges();
                selection.addRange(this.savedRange);
              }
            }
            
            let r = parseInt(values.rows, 10);
            let c = parseInt(values.cols, 10);
            if (isNaN(r) || r < 1) r = 1;
            if (isNaN(c) || c < 1) c = 1;

            this.editor.insertTable(r, c);
            this.savedRange = null;
          },
          () => { 
            this.activeModal = null;
            this.savedRange = null;
          },
          this.editor.getOptions().theme,
          this.editor.getOptions().dark
        );
        this.activeModal.show(button);
        return;
      }

      if (item.command) {
        this.editor.execute(item.command, item.value || null);
      }
      this.updateActiveStates();
    });

    this.container.appendChild(button);
  }

  private renderInput(item: ToolbarItem): void {
    const input = document.createElement('input');
    input.type = 'number';
    input.classList.add('te-input');
    input.title = item.title;
    input.value = item.value || '';
    input.min = '1';
    input.max = '100';

    const handleActiveSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (this.editor.el.contains(range.commonAncestorContainer)) {
          this.savedRange = range.cloneRange();
        }
      }
    };

    input.addEventListener('mousedown', handleActiveSelection);
    input.addEventListener('focus', handleActiveSelection);

    const applyChange = () => {
      let val = parseInt(input.value, 10);
      if (isNaN(val)) return;
      val = Math.max(1, Math.min(100, val));
      input.value = val.toString();

      if (item.command === 'fontSize') {
        if (this.savedRange) {
          const newRange = this.editor.setStyle('font-size', `${val}px`, this.savedRange);
          if (newRange) this.savedRange = newRange;
        } else {
          this.editor.setStyle('font-size', `${val}px`);
        }
        input.focus();
      }
    };

    input.addEventListener('input', applyChange);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        applyChange();
        this.editor.focus();
      }
    });

    this.container.appendChild(input);
  }

  private renderSelect(item: ToolbarItem): void {
    const select = document.createElement('select');
    select.classList.add('te-select');
    select.title = item.title;

    if (item.options) {
      item.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        select.appendChild(option);
      });
    }

    select.addEventListener('change', () => {
      const value = select.value;
      if (this.savedRange) {
        this.editor.selection.restoreSelection(this.savedRange);
      }

      if (item.command === 'formatBlock') {
        this.editor.execute(item.command, value);
      } else if (item.command === 'fontFamily') {
        this.editor.setStyle('font-family', value);
      } else if (item.command === 'lineHeight') {
        this.editor.setStyle('line-height', value);
      }
      this.editor.focus();
    });

    select.addEventListener('mousedown', () => {
      this.savedRange = this.editor.selection.saveSelection();
    });

    this.container.appendChild(select);
  }

  private renderColorPicker(item: ToolbarItem): void {
    const wrapper = document.createElement('div');
    wrapper.classList.add('te-color-picker-wrapper');
    wrapper.title = item.title;

    if (item.icon) {
      const iconBtn = document.createElement('div');
      iconBtn.classList.add('te-button', 'te-color-icon');
      // Trusted icon string
      iconBtn.innerHTML = item.icon;

      const indicator = document.createElement('div');
      indicator.classList.add('te-color-indicator');
      indicator.style.backgroundColor = item.value || '#000000';
      iconBtn.appendChild(indicator);
      this.itemElements.set(item, iconBtn);
      wrapper.appendChild(iconBtn);
    }

    const input = document.createElement('input');
    input.type = 'color';
    input.classList.add('te-color-picker-input');
    // If there is no icon, fallback to default generic look
    if (!item.icon) {
      input.classList.add('te-color-picker');
      input.title = item.title;
    }
    input.value = item.value || '#000000';

    input.addEventListener('mousedown', () => {
      this.savedRange = this.editor.selection.saveSelection();
    });

    input.addEventListener('input', () => {
      if (item.icon) {
        const indicator = wrapper.querySelector('.te-color-indicator') as HTMLElement;
        if (indicator) indicator.style.backgroundColor = input.value;
      }
    });

    input.addEventListener('change', () => {
      if (this.savedRange) {
        this.editor.selection.restoreSelection(this.savedRange);
      }
      
      if (item.command === 'foreColor') {
        const range = this.savedRange || undefined;
        this.editor.setStyle('color', input.value, range);
      } else if (item.command === 'backColor') {
        const range = this.savedRange || undefined;
        this.editor.setStyle('background-color', input.value, range);
      } else if (item.command) {
        this.editor.execute(item.command, input.value);
      }
      this.editor.focus();
    });

    wrapper.appendChild(input);
    this.container.appendChild(item.icon ? wrapper : input);
  }

  public get el(): HTMLElement {
    return this.container;
  }

  private updateActiveStates(): void {
    this.items.forEach((item) => {
      const element = this.itemElements.get(item);
      if (!element) return;

      if (item.type === 'button') {
        if (item.command && document.queryCommandState(item.command)) {
          element.classList.add('active');
        } else {
          element.classList.remove('active');
        }
      }
    });
  }

  public updateStatus(text: string, isLoading: boolean = false): void {
    if (!this.saveStatusEl || this.editor.getOptions().showStatus === false) return;

    this.saveStatusEl.textContent = '';

    if (isLoading) {
      const loader = document.createElement('div');
      loader.classList.add('te-toolbar-loader');
      this.saveStatusEl.appendChild(loader);
    }

    const span = document.createElement('span');
    span.textContent = text;
    this.saveStatusEl.appendChild(span);
  }

  public updateMetrics(): void {
    const options = this.editor.getOptions();
    if (!this.charCountEl || options.showCharCount === false) {
      if (this.charCountEl) this.charCountEl.textContent = '';
      return;
    }

    const count = this.editor.getCharCount();
    const limit = options.maxCharCount;

    if (limit) {
      this.charCountEl.textContent = `Chars: ${count}/${limit}`;
      if (count > limit) {
        this.charCountEl.style.color = '#ef4444'; // Red-500
      } else {
        this.charCountEl.style.color = 'inherit';
      }
    } else {
      this.charCountEl.textContent = `Chars: ${count}`;
      this.charCountEl.style.color = 'inherit';
    }

    // Add visual separator if both status and metrics are shown
    if (this.charCountEl.textContent && this.saveStatusEl?.textContent) {
      this.charCountEl.style.marginRight = '8px';
      this.charCountEl.style.borderRight = '1px solid var(--te-border-color)';
      this.charCountEl.style.paddingRight = '8px';
    } else {
      this.charCountEl.style.marginRight = '0';
      this.charCountEl.style.borderRight = 'none';
      this.charCountEl.style.paddingRight = '0';
    }
  }

  public destroy(): void {
    // Remove event listeners
    this.editor.el.removeEventListener('keyup', this.boundUpdateActiveStates);
    this.editor.el.removeEventListener('mouseup', this.boundUpdateActiveStates);

    // Close active picker if any
    if (this.activePicker) {
      this.activePicker.close();
      this.activePicker = null;
    }

    // Remove from DOM
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
