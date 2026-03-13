import { CoreEditor } from './Editor';

export class ImageManager {
  private editor: CoreEditor;
  private activeContainer: HTMLElement | null = null;
  private isResizing = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private currentHandle: string | null = null;
  private aspectRatio = 1;

  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: () => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(editor: CoreEditor) {
    this.editor = editor;
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.setupListeners();
  }

  private setupListeners(): void {
    const el = this.editor.el;
    el.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseup', this.boundMouseUp);
    el.addEventListener('keydown', this.boundKeyDown);
    el.addEventListener('blur', this.deselectImage.bind(this));
  }

  private handleMouseDown(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    
    // Handle resizer click
    if (target.classList.contains('te-image-resizer')) {
      e.preventDefault();
      e.stopPropagation();
      
      const container = target.closest('.te-image-container') as HTMLElement;
      if (container) {
        this.selectImage(container);
        this.startResize(e, target);
      }
      return;
    }

    // Handle image container click
    const container = target.closest('.te-image-container') as HTMLElement;
    if (container) {
      this.selectImage(container);
    } else {
      this.deselectImage();
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.isResizing) {
      this.handleResize(e);
    }
  }

  private handleMouseUp(): void {
    if (this.isResizing) {
      this.stopResize();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if ((e.key === 'Backspace' || e.key === 'Delete') && this.activeContainer) {
      // CRITICAL QA FIX: Check if the selection is actually within the active image container
      // If the user has clicked away but the image is still "active" in our state,
      // we should not delete it.
      const range = this.editor.selection.getRange();
      if (range && this.activeContainer.contains(range.commonAncestorContainer)) {
        e.preventDefault();
        this.activeContainer.remove();
        this.activeContainer = null;
        this.editor.el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  public destroy(): void {
    const el = this.editor.el;
    if (el) {
      el.removeEventListener('mousedown', this.boundMouseDown);
      el.removeEventListener('keydown', this.boundKeyDown);
      el.removeEventListener('blur', this.deselectImage.bind(this));
    }
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseup', this.boundMouseUp);
  }

  private selectImage(container: HTMLElement): void {
    if (this.activeContainer) {
      this.activeContainer.classList.remove('active');
    }
    this.activeContainer = container;
    this.activeContainer.classList.add('active');
  }

  private deselectImage(): void {
    if (this.activeContainer) {
      this.activeContainer.classList.remove('active');
      this.activeContainer = null;
    }
  }

  private startResize(e: MouseEvent, handle: HTMLElement): void {
    if (!this.activeContainer) return;
    
    this.isResizing = true;
    this.currentHandle = Array.from(handle.classList).find(c => c.startsWith('te-resizer-'))?.replace('te-resizer-', '') || null;
    
    const img = this.activeContainer.querySelector('img') as HTMLImageElement;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startWidth = img.clientWidth;
    this.startHeight = img.clientHeight;
    this.aspectRatio = this.startWidth / this.startHeight;

    document.body.style.cursor = window.getComputedStyle(handle).cursor;
  }

  private handleResize(e: MouseEvent): void {
    if (!this.activeContainer || !this.isResizing) return;

    const img = this.activeContainer.querySelector('img') as HTMLImageElement;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    let newWidth = this.startWidth;
    let newHeight = this.startHeight;

    if (this.currentHandle?.includes('right')) {
      newWidth = this.startWidth + dx;
    } else if (this.currentHandle?.includes('left')) {
      newWidth = this.startWidth - dx;
    } else if (this.currentHandle?.includes('bottom')) {
      newWidth = this.startWidth + (dy * this.aspectRatio);
    } else if (this.currentHandle?.includes('top')) {
      newWidth = this.startWidth - (dy * this.aspectRatio);
    }

    // Maintain aspect ratio
    newHeight = newWidth / this.aspectRatio;

    if (newWidth > 50 && newWidth < this.editor.el.clientWidth) {
      img.style.width = `${newWidth}px`;
      img.style.height = `${newHeight}px`;
    }
  }

  private stopResize(): void {
    this.isResizing = false;
    this.currentHandle = null;
    document.body.style.cursor = '';
    this.editor.el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
