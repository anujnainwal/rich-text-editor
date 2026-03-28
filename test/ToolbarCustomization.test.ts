import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { InkflowEditor } from '../src/index';

describe('Toolbar Customization', () => {
  let container: HTMLElement;

  beforeAll(() => {
    document.execCommand = vi.fn();
    
    // Improved Selection/Range mock for JSDOM
    const mockSelection = {
      rangeCount: 0,
      _ranges: [] as Range[],
      getRangeAt(index: number) { return this._ranges[index]; },
      addRange(range: Range) { 
        this._ranges.push(range); 
        this.rangeCount = this._ranges.length;
      },
      removeAllRanges() { 
        this._ranges = []; 
        this.rangeCount = 0;
      }
    };

    window.getSelection = vi.fn().mockReturnValue(mockSelection);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render only specified tools', () => {
    const editor = new InkflowEditor(container, {
      toolbarItems: ['bold', 'italic']
    });

    const toolbar = container.querySelector('.te-toolbar');
    expect(toolbar).toBeTruthy();

    const buttons = toolbar?.querySelectorAll('.te-button');
    // We expect exactly 2 buttons (Bold and Italic)
    // Note: Other types like select might be present if not filtered, 
    // but here we specifically requested bold and italic which are buttons.
    expect(buttons?.length).toBe(2);
    
    // Verify specific titles
    const titles = Array.from(buttons || []).map(b => (b as HTMLElement).title);
    expect(titles).toContain('Bold');
    expect(titles).toContain('Italic');
    expect(titles).not.toContain('Underline');
  });

  it('should render all tools by default', () => {
    const editor = new InkflowEditor(container);
    const toolbar = container.querySelector('.te-toolbar');
    const buttons = toolbar?.querySelectorAll('.te-button');
    // Default has many buttons
    expect(buttons!.length).toBeGreaterThan(10);
  });

  it('should handle empty toolbarItems', () => {
    const editor = new InkflowEditor(container, {
      toolbarItems: []
    });
    const toolbar = container.querySelector('.te-toolbar');
    const buttons = toolbar?.querySelectorAll('.te-button');
    const selects = toolbar?.querySelectorAll('.te-select');
    
    expect(buttons?.length).toBe(0);
    expect(selects?.length).toBe(0);
  });
});
