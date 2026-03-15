import { CoreEditor, EditorOptions } from './core/Editor';
import { Toolbar } from './ui/Toolbar';
import './styles/editor.css';

export class InkflowEditor extends CoreEditor {
  private toolbar: Toolbar;

  constructor(container: HTMLElement, options: EditorOptions = {}) {
    // Inject custom hooks if provided, otherwise provide default ones for toolbar status
    const augmentedOptions: EditorOptions = {
      ...options,
      onSaving: () => {
        this.toolbar?.updateStatus('Auto saving...', true);
        if (options.onSaving) options.onSaving();
      },
      onSave: (html) => {
        const dateTime = new Date().toLocaleString([], { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true
        });
        this.toolbar?.updateStatus(`Saved at ${dateTime}`, false);
        if (options.onSave) options.onSave(html);
      }
    };

    super(container, augmentedOptions);
    
    // SSR Guard
    if (typeof document === 'undefined' || !container) {
      this.toolbar = {} as Toolbar;
      return;
    }
    
    this.toolbar = new Toolbar(this);
    
    const pos = augmentedOptions.toolbarPosition || 'top';
    
    if (pos === 'top') {
      this.container.insertBefore(this.toolbar.el, this.editableElement);
    } else if (pos === 'bottom') {
      this.container.appendChild(this.toolbar.el);
      this.container.classList.add('te-toolbar-bottom');
    } else if (pos === 'left') {
      this.container.insertBefore(this.toolbar.el, this.editableElement);
      this.container.classList.add('te-toolbar-left');
    } else if (pos === 'right') {
      this.container.appendChild(this.toolbar.el);
      this.container.classList.add('te-toolbar-right');
    } else if (pos === 'floating') {
      // Main toolbar is not attached to the container
      this.container.classList.add('te-toolbar-floating');
    }

    if (augmentedOptions.showStatus !== false && this.toolbar && pos !== 'floating') {
      this.toolbar.updateStatus('All changes saved', false);
    }

    // Initialize metrics if enabled
    if (augmentedOptions.showCharCount) {
      this.toolbar.updateMetrics();
    }

    // Listen for changes to update metrics
    this.el.addEventListener('input', () => {
      this.toolbar?.updateMetrics();
    });

    // Trigger initial change to sync optimized content with parent
    this.triggerChange();
  }

  public getToolbar(): Toolbar {
    return this.toolbar;
  }

  public destroy(): void {
    if (this.toolbar) {
      this.toolbar.destroy();
    }
    super.destroy();
  }
}

export { CoreEditor, type EditorOptions } from './core/Editor';
export { SelectionManager } from './core/SelectionManager';
export { Toolbar } from './ui/Toolbar';
export { HistoryManager } from './core/HistoryManager';
