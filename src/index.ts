import { CoreEditor, EditorOptions } from './core/Editor';
import { Toolbar } from './ui/Toolbar';
import './styles/editor.css';

export class TestEditor extends CoreEditor {
  private toolbar: Toolbar;

  constructor(container: HTMLElement, options: EditorOptions = {}) {
    super(container, options);
    
    this.toolbar = new Toolbar(this);
    // Move toolbar to the top of the container
    this.container.insertBefore(this.toolbar.el, this.editableElement);
  }
}

export { CoreEditor, type EditorOptions } from './core/Editor';
export { SelectionManager } from './core/SelectionManager';
export { Toolbar } from './ui/Toolbar';
