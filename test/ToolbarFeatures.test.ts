import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { CoreEditor } from '../src/core/Editor';
import { Toolbar } from '../src/ui/Toolbar';

describe('Toolbar New Features', () => {
  let editorContainer: HTMLElement;
  let editor: CoreEditor;
  let toolbar: Toolbar;

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
      },
      saveSelection() { return document.createRange(); },
      restoreSelection() {}
    };
    window.getSelection = vi.fn().mockReturnValue(mockSelection);
  });

  beforeEach(() => {
    document.body.innerHTML = '<div id="editor"></div>';
    editorContainer = document.getElementById('editor')!;
    editor = new CoreEditor(editorContainer);
    // Mock Editor setStyle
    editor.setStyle = vi.fn();
    editor.insertImage = vi.fn();
    
    toolbar = new Toolbar(editor);
    document.body.appendChild(toolbar.el);
    vi.clearAllMocks();
  });

  describe('Line Height', () => {
    it('should set line height when changing the select dropdown', () => {
      // Find the select dropdown with title "Line Height"
      const selects = toolbar.el.querySelectorAll('select.te-select');
      const lineHeightSelect = Array.from(selects).find(s => (s as HTMLSelectElement).title === 'Line Height') as HTMLSelectElement;
      
      expect(lineHeightSelect).toBeDefined();

      // Trigger change
      lineHeightSelect.value = '1.5';
      lineHeightSelect.dispatchEvent(new Event('change'));

      expect(editor.setStyle).toHaveBeenCalledWith('line-height', '1.5');
    });
  });

  describe('Color Pickers (Text and Highlight)', () => {
    it('should set text color when changing the input', () => {
      const inputs = toolbar.el.querySelectorAll('input[type="color"]');
      const colorInput = Array.from(inputs).find((i: any) => (i.parentElement as HTMLElement)?.title === 'Text Color' || i.title === 'Text Color') as HTMLInputElement;
      
      expect(colorInput).toBeDefined();

      colorInput.value = '#ff0000';
      colorInput.dispatchEvent(new Event('change'));

      expect(document.execCommand).toHaveBeenCalledWith('foreColor', false, '#ff0000');
    });

    it('should set highlight color when changing the input', () => {
      const inputs = toolbar.el.querySelectorAll('input[type="color"]');
      const bgColorInput = Array.from(inputs).find((i: any) => (i.parentElement as HTMLElement)?.title === 'Highlight Color' || i.title === 'Highlight Color') as HTMLInputElement;
      
      expect(bgColorInput).toBeDefined();

      bgColorInput.value = '#00ff00';
      bgColorInput.dispatchEvent(new Event('change'));

      expect(document.execCommand).toHaveBeenCalledWith('backColor', false, '#00ff00');
    });
  });

  describe('Local Image Upload', () => {
    it('should create a file input and read file on change when image button is clicked', () => {
      const buttons = toolbar.el.querySelectorAll('button.te-button');
      const imageBtn = Array.from(buttons).find((b: any) => b.title === 'Insert Image') as HTMLButtonElement;
      
      expect(imageBtn).toBeDefined();

      // Spy on appendChild to catch the hidden input creation
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      
      // Trigger click
      imageBtn.dispatchEvent(new Event('mousedown'));

      // It should append an input of type file
      const appendedElement = appendChildSpy.mock.calls.find(call => 
        call[0] instanceof HTMLInputElement && call[0].type === 'file'
      )?.[0] as HTMLInputElement;

      expect(appendedElement).toBeDefined();
      expect(appendedElement.type).toBe('file');

      // Now trigger the file input change event to simulate upload
      class MockFileReader {
        onload: any;
        readAsDataURL() {
          if (this.onload) this.onload({ target: { result: 'data:image/jpeg;base64,mock2' } });
        }
      }
      global.FileReader = MockFileReader as any;

      Object.defineProperty(appendedElement, 'files', {
        value: [new File([''], 'test.jpg', { type: 'image/jpeg' })]
      });

      appendedElement.dispatchEvent(new Event('change'));

      expect(editor.insertImage).toHaveBeenCalledWith('data:image/jpeg;base64,mock2');
    });
  });
});
