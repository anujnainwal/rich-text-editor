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
    this.editor.el.addEventListener('scroll', () => {
      if (this.isVisible && !this.activeModal) this.hide();
    }, true);
    
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
    const parent = this.container.offsetParent || document.documentElement;
    const parentRect = parent.getBoundingClientRect();
    
    this.container.style.display = 'flex';
    this.isVisible = true;

    const toolbarWidth = this.container.offsetWidth;
    const toolbarHeight = this.container.offsetHeight;

    // Viewport-relative coordinates subtracted by parent coordinates gives the correct local style top/left.
    // This accounts for body margins, paddings, and flex centering in index.html.
    let top = rect.top - parentRect.top - toolbarHeight - 10;
    let left = rect.left - parentRect.left + (rect.width / 2) - (toolbarWidth / 2);

    // Boundary checks relative to viewport
    if (rect.top - toolbarHeight - 15 < 0) {
      // Show below the selection if not enough space above
      top = rect.bottom - parentRect.top + 10;
    }
    
    // Horizontal boundary checks (relative to parent)
    const minLeft = 10 - parentRect.left;
    const maxLeft = (window.innerWidth - 10) - parentRect.left - toolbarWidth;
    
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

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
