import { CoreEditor } from '../core/Editor';
import { ToolbarItem } from './toolbar/ToolbarItem';
import { toolbarItems } from './toolbar/registry';
import { EmojiPicker } from './toolbar/EmojiPicker';

export class Toolbar {
  private editor: CoreEditor;
  private container: HTMLElement;
  private savedRange: Range | null = null;
  private items: ToolbarItem[] = toolbarItems;
  private activePicker: EmojiPicker | null = null;

  constructor(editor: CoreEditor) {
    this.editor = editor;
    this.container = this.createToolbarElement();
    this.render();
  }

  private createToolbarElement(): HTMLElement {
    const el = document.createElement('div');
    el.classList.add('te-toolbar');
    return el;
  }

  private render(): void {
    this.items.forEach(item => {
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

    // Handle selection change to update states
    this.editor.el.addEventListener('keyup', () => this.updateActiveStates());
    this.editor.el.addEventListener('mouseup', () => this.updateActiveStates());
  }

  private renderButton(item: ToolbarItem): void {
    const button = document.createElement('button');
    button.classList.add('te-button');
    button.innerHTML = item.icon || '';
    button.title = item.title;

    button.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (item.command === 'insertEmoji') {
        if (!this.activePicker) {
          this.activePicker = new EmojiPicker(
            (emoji) => {
              this.editor.execute('insertText', emoji);
            },
            () => { this.activePicker = null; }
          );
          this.activePicker.show(button);
        } else {
          this.activePicker.close();
        }
        return;
      }

      if (item.command === 'createLink') {
        const url = window.prompt('Enter the URL');
        if (url) {
          this.editor.createLink(url);
        }
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
      }
      this.editor.focus();
    });

    select.addEventListener('mousedown', () => {
      this.savedRange = this.editor.selection.saveSelection();
    });

    this.container.appendChild(select);
  }

  private renderColorPicker(item: ToolbarItem): void {
    const input = document.createElement('input');
    input.type = 'color';
    input.classList.add('te-color-picker');
    input.title = item.title;
    input.value = item.value || '#000000';

    input.addEventListener('mousedown', () => {
      this.savedRange = this.editor.selection.saveSelection();
    });

    input.addEventListener('change', () => {
      if (this.savedRange) {
        this.editor.selection.restoreSelection(this.savedRange);
      }
      if (item.command) {
        this.editor.execute(item.command, input.value);
      }
      this.editor.focus();
    });

    this.container.appendChild(input);
  }

  public get el(): HTMLElement {
    return this.container;
  }

  private updateActiveStates(): void {
    const buttons = this.container.querySelectorAll('.te-button');
    let btnIndex = 0;

    this.items.forEach((item) => {
      if (item.type === 'button') {
        const button = buttons[btnIndex++] as HTMLElement;
        if (item.command && document.queryCommandState(item.command)) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      }
    });
  }
}
