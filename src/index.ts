import { CoreEditor, EditorOptions } from './core/Editor';
import { Toolbar } from './ui/Toolbar';
import './styles/editor.css';

export class TestEditor extends CoreEditor {
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
    // Move toolbar to the top of the container
    this.container.insertBefore(this.toolbar.el, this.editableElement);

    // Initial status
    if (augmentedOptions.showStatus !== false) {
      this.toolbar.updateStatus('All changes saved', false);
    }
  }

  public getToolbar(): Toolbar {
    return this.toolbar;
  }
}

export { CoreEditor, type EditorOptions } from './core/Editor';
export { SelectionManager } from './core/SelectionManager';
export { Toolbar } from './ui/Toolbar';
export { HistoryManager } from './core/HistoryManager';
