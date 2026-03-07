import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { CoreEditor } from '../src/core/Editor';

describe('Editor New Features (HTML Paste & Formatting)', () => {
  let container: HTMLElement;
  let editor: CoreEditor;

  beforeAll(() => {
    document.execCommand = vi.fn();
    
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
    document.body.innerHTML = '<div id="editor"></div>';
    container = document.getElementById('editor')!;
    editor = new CoreEditor(container);
    // Reset vi mocks
    vi.clearAllMocks();
  });

  describe('HTML Auto-Format Paste', () => {
    it('should intercept raw HTML strings from clipboard and call insertHTML', () => {
      // Mock execute method
      editor.execute = vi.fn();

      const preventDefaultSpy = vi.fn();
      
      const pasteEvent = new Event('paste') as any;
      pasteEvent.preventDefault = preventDefaultSpy;
      pasteEvent.clipboardData = {
        getData: (type: string) => {
          if (type === 'text/plain') return '<h1>Hello</h1>\n<p>World</p>';
          return '';
        },
        items: []
      };

      editor.el.dispatchEvent(pasteEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(editor.execute).toHaveBeenCalledWith('insertHTML', '<h1>Hello</h1><p>World</p>');
    });

    it('should ignore regular plain text', () => {
      editor.execute = vi.fn();

      const preventDefaultSpy = vi.fn();
      
      const pasteEvent = new Event('paste') as any;
      pasteEvent.preventDefault = preventDefaultSpy;
      pasteEvent.clipboardData = {
        getData: (type: string) => {
          if (type === 'text/plain') return 'Just normal text';
          return '';
        },
        items: []
      };

      editor.el.dispatchEvent(pasteEvent);

      // It should NOT prevent default and NOT call insertHTML for standard text
      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(editor.execute).not.toHaveBeenCalled();
    });
  });

  describe('Image Drag & Drop / Paste', () => {
    it('should handle pasting an image file', () => {
      editor.insertImage = vi.fn();
      const preventDefaultSpy = vi.fn();

      // Mock FileReader
      class MockFileReader {
        onload: any;
        readAsDataURL() {
          if (this.onload) this.onload({ target: { result: 'data:image/png;base64,mock' } });
        }
      }
      global.FileReader = MockFileReader as any;

      const pasteEvent = new Event('paste') as any;
      pasteEvent.preventDefault = preventDefaultSpy;
      pasteEvent.clipboardData = {
        items: [
          {
            type: 'image/png',
            getAsFile: () => new File([''], 'test.png', { type: 'image/png' })
          }
        ]
      };

      editor.el.dispatchEvent(pasteEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(editor.insertImage).toHaveBeenCalledWith('data:image/png;base64,mock');
    });
  });
});
