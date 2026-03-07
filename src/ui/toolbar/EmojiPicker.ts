import { EMOJI_LIST, EmojiData } from './EmojiList';

export class EmojiPicker {
  private container: HTMLElement;
  private searchInput: HTMLInputElement;
  private emojiGrid: HTMLElement;
  private onSelect: (emoji: string) => void;
  private onClose: () => void;

  constructor(onSelect: (emoji: string) => void, onClose: () => void) {
    this.onSelect = onSelect;
    this.onClose = onClose;
    this.container = this.createPickerElement();
    this.searchInput = this.container.querySelector('.te-emoji-search') as HTMLInputElement;
    this.emojiGrid = this.container.querySelector('.te-emoji-grid') as HTMLElement;

    this.setupEvents();
    this.renderEmojis(EMOJI_LIST);
  }

  private createPickerElement(): HTMLElement {
    const el = document.createElement('div');
    el.classList.add('te-emoji-picker');
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
      const filtered = EMOJI_LIST.filter(e =>
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
      this.emojiGrid.innerHTML = '<div class="te-emoji-empty">No emoji found</div>';
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

  public show(referenceEl: HTMLElement): void {
    document.body.appendChild(this.container);

    const rect = referenceEl.getBoundingClientRect();
    const pickerWidth = 280;

    let top = rect.bottom + window.scrollY + 5;
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
