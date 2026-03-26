import type { ThemeConfig } from '../../core/Editor';

export interface ModalField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'file';
  placeholder?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
}

export class InputModal {
  private container: HTMLElement;
  private onConfirm: (values: Record<string, any>) => void;
  private onClose: () => void;
  private dark?: boolean;
  private theme?: ThemeConfig;
  private fields: ModalField[];

  constructor(
    title: string,
    fields: ModalField[],
    onConfirm: (values: Record<string, any>) => void,
    onClose: () => void,
    theme?: ThemeConfig,
    dark?: boolean
  ) {
    this.fields = fields;
    this.onConfirm = onConfirm;
    this.onClose = onClose;
    this.theme = theme;
    this.dark = dark;
    this.container = this.createModalElement(title, fields);
    this.setupEvents();
  }

  private createModalElement(title: string, fields: ModalField[]): HTMLElement {
    const el = document.createElement('div');
    el.classList.add('te-modal');
    
    if (this.theme) {
      this.applyTheme(el, this.theme);
    }

    if (this.dark) {
      el.classList.add('te-dark');
    }

    // Modal Header
    const header = document.createElement('div');
    header.classList.add('te-modal-header');
    header.textContent = title;
    el.appendChild(header);

    // Modal Body
    const body = document.createElement('div');
    body.classList.add('te-modal-body');
    
    fields.forEach(f => {
      const fieldDiv = document.createElement('div');
      fieldDiv.classList.add('te-modal-field');
      
      const label = document.createElement('label');
      label.setAttribute('for', f.id);
      label.textContent = f.label;
      
      const input = document.createElement('input');
      input.type = f.type;
      input.id = f.id;
      input.classList.add('te-modal-input');
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.defaultValue) input.value = f.defaultValue;
      if (f.min) input.min = f.min;
      if (f.max) input.max = f.max;
      if (f.type === 'file') {
        input.accept = 'image/*';
        input.classList.add('te-modal-file-input');
      }
      
      fieldDiv.appendChild(label);
      fieldDiv.appendChild(input);
      body.appendChild(fieldDiv);
    });
    el.appendChild(body);

    // Modal Footer
    const footer = document.createElement('div');
    footer.classList.add('te-modal-footer');
    
    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('te-modal-btn', 'te-modal-btn-cancel');
    cancelBtn.textContent = 'Cancel';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.classList.add('te-modal-btn', 'te-modal-btn-confirm');
    confirmBtn.textContent = 'Insert';
    
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    el.appendChild(footer);

    return el;
  }

  private setupEvents(): void {
    const cancelBtn = this.container.querySelector('.te-modal-btn-cancel') as HTMLElement;
    const confirmBtn = this.container.querySelector('.te-modal-btn-confirm') as HTMLElement;

    cancelBtn.addEventListener('click', () => this.close());
    confirmBtn.addEventListener('click', () => {
      const values: Record<string, any> = {};
      this.fields.forEach(f => {
        const input = this.container.querySelector(`#${f.id}`) as HTMLInputElement;
        if (f.type === 'file') {
          values[f.id] = input.files && input.files.length > 0 ? input.files[0] : null;
        } else {
          values[f.id] = input.value;
        }
      });
      this.onConfirm(values);
      this.close();
    });

    // Close on Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'Enter') confirmBtn.click();
    };
    this.container.addEventListener('keydown', handleKeyDown);

    // Close on click outside
    const handleOutsideClick = (e: MouseEvent) => {
      if (!this.container.contains(e.target as Node)) {
        this.close();
        document.removeEventListener('mousedown', handleOutsideClick);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handleOutsideClick), 0);
  }

  public show(referenceEl: HTMLElement): void {
    document.body.appendChild(this.container);

    const rect = referenceEl.getBoundingClientRect();
    const modalWidth = 260;

    const top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;

    // Boundary check
    if (left + modalWidth > window.innerWidth) {
      left = window.innerWidth - modalWidth - 20;
    }

    this.container.style.top = `${top}px`;
    this.container.style.left = `${left}px`;

    const firstInput = this.container.querySelector('input') as HTMLInputElement;
    if (firstInput) firstInput.focus();
  }

  public close(): void {
    if (this.container.parentElement) {
      this.container.remove();
      this.onClose();
    }
  }

  private applyTheme(root: HTMLElement, theme: ThemeConfig): void {
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
}
