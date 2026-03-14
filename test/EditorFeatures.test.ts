import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { CoreEditor } from '../src/core/Editor';
import { ImageUploader } from '../src/core/plugins/ImageUploader';

vi.mock('../src/core/plugins/ImageUploader', () => ({
  ImageUploader: {
    compressImage: vi.fn((file: File) => Promise.resolve(file)),
    uploadFile: vi.fn(() => Promise.resolve(null))
  }
}));

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

      // It SHOULD prevent default and call insertText for standard text
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(editor.execute).toHaveBeenCalledWith('insertText', 'Just normal text');
    });
  });

  describe('Image Drag & Drop / Paste', () => {
    it('should handle pasting an image file', async () => {
      const insertImageSpy = vi.spyOn(editor, 'insertImage');
      const preventDefaultSpy = vi.fn();

      // Mock FileReader to trigger its onload event
      class MockFileReader {
        onload: any;
        readAsDataURL(file: Blob) {
          setTimeout(() => {
            if (this.onload) this.onload({ target: { result: 'data:image/png;base64,mock' } });
          }, 0);
        }
      }
      global.FileReader = MockFileReader as any;

      const pasteEvent = new Event('paste') as any;
      pasteEvent.preventDefault = preventDefaultSpy;
      pasteEvent.clipboardData = {
        getData: vi.fn().mockReturnValue(''),
        items: [
          {
            type: 'image/png',
            getAsFile: () => new File([''], 'test.png', { type: 'image/png' })
          }
        ]
      };

      editor.el.dispatchEvent(pasteEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      
      // Wait for async processing to finish
      await vi.waitFor(() => {
        expect(insertImageSpy).toHaveBeenCalledWith('data:image/png;base64,mock');
      });
    });
  });
});
