import type { EmojiData } from './EmojiList';
import type { ThemeConfig } from '../../core/Editor';

export class EmojiPicker {
  private container: HTMLElement;
  private searchInput: HTMLInputElement;
  private emojiGrid: HTMLElement;
  private onSelect: (emoji: string) => void;
  private onClose: () => void;
  private emojiList: EmojiData[] = [];

  private theme?: ThemeConfig;
  private dark?: boolean;

  constructor(onSelect: (emoji: string) => void, onClose: () => void, theme?: ThemeConfig, dark?: boolean) {
    this.onSelect = onSelect;
    this.onClose = onClose;
    this.theme = theme;
    this.dark = dark;
    this.container = this.createPickerElement();
    this.searchInput = this.container.querySelector('.te-emoji-search') as HTMLInputElement;
    this.emojiGrid = this.container.querySelector('.te-emoji-grid') as HTMLElement;

    this.setupEvents();
    this.loadEmojis();
  }

  private async loadEmojis(): Promise<void> {
    this.emojiGrid.textContent = 'Loading...';
    try {
      const { EMOJI_LIST } = await import('./EmojiList');
      this.emojiList = EMOJI_LIST;
      this.renderEmojis(this.emojiList);
    } catch (error) {
      console.error('Failed to load emojis:', error);
      this.emojiGrid.textContent = 'Failed to load';
    }
  }

  private createPickerElement(): HTMLElement {
    const el = document.createElement('div');
    el.classList.add('te-emoji-picker');
    
    if (this.theme) {
      this.applyTheme(el, this.theme);
    }

    if (this.dark) {
      el.classList.add('te-dark');
    }

    el.innerHTML = `
      <div class="te-emoji-header">
        <input type="text" class="te-emoji-search" placeholder="Search emoji...">
      </div>
      <div class="te-emoji-body">
        <div class="te-emoji-grid"></div>
      </div>
    `;
    return el;
  }

  private setupEvents(): void {
    // Prevent toolbar/editor focus stealing when interacting with the search box
    this.searchInput.addEventListener('mousedown', (e) => e.stopPropagation());
    this.searchInput.addEventListener('click', (e) => e.stopPropagation());

    this.searchInput.addEventListener('input', () => {
      const query = this.searchInput.value.toLowerCase();
      const filtered = this.emojiList.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query)
      );
      this.renderEmojis(filtered);
    });

    // Close on click outside
    const handleOutsideClick = (e: MouseEvent) => {
      if (!this.container.contains(e.target as Node)) {
        this.close();
        document.removeEventListener('mousedown', handleOutsideClick);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handleOutsideClick), 0);
  }

  private renderEmojis(emojis: EmojiData[]): void {
    this.emojiGrid.innerHTML = '';

    if (emojis.length === 0) {
      this.emojiGrid.textContent = 'No emoji found';
      return;
    }

    // Group by category if we're not searching
    const isSearching = this.searchInput.value.length > 0;

    if (!isSearching) {
      const categories = ['Smileys', 'Symbols', 'Hands', 'Animals', 'Food', 'Travel', 'Objects', 'Activities'];
      categories.forEach(cat => {
        const catEmojis = emojis.filter(e => e.category === cat);
        if (catEmojis.length > 0) {
          const title = document.createElement('div');
          title.classList.add('te-emoji-category-title');
          title.textContent = cat;
          this.emojiGrid.appendChild(title);

          this.renderGridItems(catEmojis);
        }
      });
    } else {
      this.renderGridItems(emojis);
    }
  }

  private renderGridItems(emojis: EmojiData[]): void {
    emojis.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.classList.add('te-emoji-item');
      btn.textContent = item.emoji;
      btn.title = item.name;

      btn.addEventListener('click', () => {
        this.onSelect(item.emoji);
        this.close();
      });

      this.emojiGrid.appendChild(btn);
    });
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

  public show(referenceEl: HTMLElement): void {
    document.body.appendChild(this.container);

    const rect = referenceEl.getBoundingClientRect();
    const pickerWidth = 280;

    const top = rect.bottom + window.scrollY + 5;
    let left = rect.left + window.scrollX;

    // Boundary check
    if (left + pickerWidth > window.innerWidth) {
      left = window.innerWidth - pickerWidth - 10;
    }

    this.container.style.top = `${top}px`;
    this.container.style.left = `${left}px`;

    this.searchInput.focus();
  }

  public close(): void {
    if (this.container.parentElement) {
      this.container.remove();
      this.onClose();
    }
  }

  public get el(): HTMLElement {
    return this.container;
  }
}
