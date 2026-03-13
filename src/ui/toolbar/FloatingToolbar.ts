import { CoreEditor } from '../../core/Editor';
import { toolbarItems } from './registry';
import { ToolbarItem } from './ToolbarItem';
import { InputModal } from './InputModal';

export class FloatingToolbar {
  private container: HTMLElement;
  private editor: CoreEditor;
  private activeModal: InputModal | null = null;
  private savedRange: Range | null = null;
  private isVisible: boolean = false;

  constructor(editor: CoreEditor) {
    this.editor = editor;
    this.container = this.createContainer();
    this.setupListeners();
    document.body.appendChild(this.container);
  }

  private createContainer(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'te-floating-toolbar te-glass';
    el.style.display = 'none';
    el.style.position = 'absolute';
    el.style.zIndex = '2000';
    
    // Use a subset of tools for the floating toolbar
    const floatingTools = ['heading', 'bold', 'italic', 'underline', 'strikethrough', 'highlight-color', 'link', 'clear-formatting'];
    const items = toolbarItems.filter(item => item.id && floatingTools.includes(item.id));

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'te-floating-btn';
      btn.title = item.title;
      btn.innerHTML = item.icon || item.title;
      
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleCommand(item);
      };

      el.appendChild(btn);
    });

    return el;
  }

  private handleCommand(item: ToolbarItem) {
    if (item.command === 'createLink') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        this.savedRange = selection.getRangeAt(0).cloneRange();
      }

      if (this.activeModal) this.activeModal.close();

      this.activeModal = new InputModal(
        'Insert Link',
        [{ id: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com' }],
        (values) => {
          if (this.savedRange) {
            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(this.savedRange);
            }
          }
          this.editor.execute('createLink', values.url);
          this.savedRange = null;
          this.hide();
        },
        () => { 
          this.activeModal = null;
          this.savedRange = null;
        },
        this.editor.getOptions().theme,
        this.editor.getOptions().dark
      );
      this.activeModal.show(this.container);
    } else if (item.id === 'heading') {
      this.editor.execute('formatBlock', 'H2');
    } else if (item.id === 'highlight-color') {
      // Apply a default highlight color for quick access in floating toolbar
      this.editor.execute('backColor', '#fef08a');
    } else {
      this.editor.execute(item.command || '', item.value);
    }
  }

  private setupListeners() {
    const update = () => {
      // Small Delay to allow selection to settle
      setTimeout(() => this.updatePosition(), 50);
    };

    this.editor.el.addEventListener('mouseup', update);
    this.editor.el.addEventListener('keyup', update);
    
    // Hide on scroll or click outside
    window.addEventListener('mousedown', (e) => {
      if (!this.container.contains(e.target as Node) && !this.editor.el.contains(e.target as Node)) {
        this.hide();
      }
    });

    window.addEventListener('resize', () => {
      if (this.isVisible) this.updatePosition();
    });
  }

  private updatePosition() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (!this.activeModal) this.hide();
      return;
    }

    const range = selection.getRangeAt(0);
    if (!this.editor.el.contains(range.commonAncestorContainer)) {
      this.hide();
      return;
    }

    const rect = range.getBoundingClientRect();
    
    this.container.style.display = 'flex';
    this.isVisible = true;

    const toolbarWidth = this.container.offsetWidth;
    const toolbarHeight = this.container.offsetHeight;

    let top = rect.top + window.scrollY - toolbarHeight - 10;
    let left = rect.left + window.scrollX + (rect.width / 2) - (toolbarWidth / 2);

    // Boundary checks
    if (top < window.scrollY) {
      top = rect.bottom + window.scrollY + 10;
    }
    
    if (left < 10) left = 10;
    if (left + toolbarWidth > window.innerWidth - 10) {
      left = window.innerWidth - toolbarWidth - 10;
    }

    this.container.style.top = `${top}px`;
    this.container.style.left = `${left}px`;
    this.container.classList.add('te-floating-visible');
  }

  private hide() {
    this.container.style.display = 'none';
    this.container.classList.remove('te-floating-visible');
    this.isVisible = false;
  }

  public destroy() {
    this.container.remove();
  }

  public setDarkMode(dark: boolean) {
    if (dark) {
      this.container.classList.add('te-dark');
    } else {
      this.container.classList.remove('te-dark');
    }
  }
}
