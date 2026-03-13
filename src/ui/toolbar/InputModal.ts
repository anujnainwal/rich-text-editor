import type { ThemeConfig } from '../../core/Editor';

export interface ModalField {
  id: string;
  label: string;
  type: 'text' | 'number';
  placeholder?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
}

export class InputModal {
  private container: HTMLElement;
  private onConfirm: (values: Record<string, string>) => void;
  private onClose: () => void;
  private dark?: boolean;
  private theme?: ThemeConfig;
  private fields: ModalField[];

  constructor(
    title: string,
    fields: ModalField[],
    onConfirm: (values: Record<string, string>) => void,
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

    const fieldsHtml = fields.map(f => `
      <div class="te-modal-field">
        <label for="${f.id}">${f.label}</label>
        <input type="${f.type}" id="${f.id}" class="te-modal-input" placeholder="${f.placeholder || ''}" value="${f.defaultValue || ''}" ${f.min ? `min="${f.min}"` : ''} ${f.max ? `max="${f.max}"` : ''}>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="te-modal-header">${title}</div>
      <div class="te-modal-body">
        ${fieldsHtml}
      </div>
      <div class="te-modal-footer">
        <button class="te-modal-btn te-modal-btn-cancel">Cancel</button>
        <button class="te-modal-btn te-modal-btn-confirm">Insert</button>
      </div>
    `;
    return el;
  }

  private setupEvents(): void {
    const cancelBtn = this.container.querySelector('.te-modal-btn-cancel') as HTMLElement;
    const confirmBtn = this.container.querySelector('.te-modal-btn-confirm') as HTMLElement;

    cancelBtn.addEventListener('click', () => this.close());
    confirmBtn.addEventListener('click', () => {
      const values: Record<string, string> = {};
      this.fields.forEach(f => {
        const input = this.container.querySelector(`#${f.id}`) as HTMLInputElement;
        values[f.id] = input.value;
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

    let top = rect.bottom + window.scrollY + 10;
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
