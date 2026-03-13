import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { CoreEditor } from './Editor';

describe('BR Repro', () => {
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

  let container: HTMLElement;
  let editor: CoreEditor;

  beforeEach(() => {
    document.body.innerHTML = '<div id="editor"></div>';
    container = document.getElementById('editor')!;
    editor = new CoreEditor(container);
  });

  it('repro: should remove trailing empty paragraphs with BR', () => {
    const html = '<p>lkl</p><p><br></p>';
    editor.setHTML(html);
    const output = editor.getHTML();
    console.log(`Input:  ${html}`);
    console.log(`Output: ${output}`);
    // This is what we WANT, but it currently fails (likely)
    expect(output).toBe('<p>lkl</p>');
  });
});
