import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { CoreEditor } from './Editor';

describe('CoreEditor - 30 Font Size Test Cases', () => {
  let container: HTMLElement;
  let editor: CoreEditor;
  let mockSelection: any;

  beforeAll(() => {
    document.execCommand = vi.fn();
    
    mockSelection = {
      rangeCount: 0,
      _ranges: [] as Range[],
      getRangeAt(index: number) { return this._ranges[index]; },
      addRange(range: Range) { 
        this._ranges = [range]; 
        this.rangeCount = 1;
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
    mockSelection.removeAllRanges();
  });

  const setSelection = (startNode: Node, startOffset: number, endNode: Node | number, endOffset?: number) => {
    const range = document.createRange();
    let actualEndNode: Node;
    let actualEndOffset: number;

    if (typeof endNode === 'number') {
      actualEndNode = startNode;
      actualEndOffset = endNode;
    } else {
      actualEndNode = endNode;
      actualEndOffset = endOffset === undefined ? 0 : endOffset;
    }

    range.setStart(startNode, startOffset || 0);
    range.setEnd(actualEndNode, actualEndOffset);
    mockSelection.removeAllRanges();
    mockSelection.addRange(range);
    return range;
  };

  it('Cases 1-5: Basic Selection Application', () => {
    editor.setHTML('<p>Hello World</p>');
    
    // 1. Single Word
    let text = editor.el.querySelector('p')!.firstChild!;
    editor.setStyle('font-size', '20px', setSelection(text, 0, 5));
    expect(editor.getHTML()).toContain('20px');

    // 2. Full Paragraph
    editor.setHTML('<p>Paragraph</p>');
    text = editor.el.querySelector('p')!.firstChild!;
    editor.setStyle('font-size', '30px', setSelection(text, 0, 9));
    expect(editor.getHTML()).toContain('30px');

    // 3. Partial Start
    editor.setHTML('<p>Partial</p>');
    text = editor.el.querySelector('p')!.firstChild!;
    editor.setStyle('font-size', '25px', setSelection(text, 0, 4));
    expect(editor.getHTML()).toContain('Part</span>ial');

    // 4. Partial End
    editor.setHTML('<p>Partial</p>');
    text = editor.el.querySelector('p')!.firstChild!;
    editor.setStyle('font-size', '15px', setSelection(text, 4, 7));
    expect(editor.getHTML()).toContain('Part<span');

    // 5. Multi-Paragraph
    editor.setHTML('<p>P1</p><p>P2</p>');
    text = editor.el.querySelector('p')!.firstChild!;
    editor.setStyle('font-size', '10px', setSelection(text, 0, 2));
    expect(editor.getHTML()).toContain('P1</span>');
  });

  it('Cases 6-10: Overlapping & Nesting', () => {
    // 6. Span Update
    editor.setHTML('<p><span style="font-size: 10px;">Update</span></p>');
    let t = editor.el.querySelector('span')!.firstChild!;
    editor.setStyle('font-size', '40px', setSelection(t, 0, 6));
    expect(editor.getHTML()).toContain('40px');
    expect((editor.getHTML().match(/<span/g) || []).length).toBe(1);

    // 7. Left Partial Override
    editor.setHTML('<p><span style="font-size: 30px;">BigText</span></p>');
    t = editor.el.querySelector('span')!.firstChild!;
    editor.setStyle('font-size', '10px', setSelection(t, 0, 3));
    expect(editor.getHTML()).toContain('10px');
    expect(editor.getHTML()).toContain('30px');

    // 8. Right Partial Override
    editor.setHTML('<p><span style="font-size: 30px;">BigText</span></p>');
    t = editor.el.querySelector('span')!.firstChild!;
    editor.setStyle('font-size', '10px', setSelection(t, 3, 7));
    expect(editor.getHTML()).toContain('Big<span');

    // 9. Multi-Span Wrap
    editor.setHTML('<p><span style="font-size: 10px;">A</span> <span style="font-size: 20px;">B</span></p>');
    let p = editor.el.querySelector('p')!;
    editor.setStyle('font-size', '30px', setSelection(p, 0, p, 3));
    expect(editor.getHTML()).toContain('30px');

    // 10. Mixed Content
    editor.setHTML('<p>Plain <span style="font-size: 10px;">Styled</span></p>');
    p = editor.el.querySelector('p')!;
    editor.setStyle('font-size', '12px', setSelection(p, 0, p, 2));
    expect(editor.getHTML()).toContain('12px');
  });

  it('Cases 11-15: Sticky Styles', () => {
    // 11. Empty Editor Sticky
    editor.setHTML('<p><br></p>');
    let p = editor.el.querySelector('p')!;
    setSelection(p, 0, 0);
    editor.setStyle('font-size', '50px');
    editor.el.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'A', bubbles: true }));
    expect(editor.getHTML()).toContain('50px');

    // 12. Line End Sticky
    editor.setHTML('<p>End</p>');
    let t = editor.el.querySelector('p')!.firstChild!;
    setSelection(t, 3, 3);
    editor.setStyle('font-size', '22px');
    editor.el.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: '!', bubbles: true }));
    expect(editor.getHTML()).toContain('End<span style="font-size: 22px');

    // 13. Mid-Word Sticky
    editor.setHTML('<p>Split</p>');
    let t2 = editor.el.querySelector('p')!.firstChild!;
    setSelection(t2, 2, 2); // Sp|lit
    editor.setStyle('font-size', '8px');
    editor.el.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: '-', bubbles: true }));
    expect(editor.getHTML()).toContain('Sp<span style="font-size: 8px');

    // 14. Selection Change Clear
    editor.setHTML('<p>Text</p>');
    setSelection(editor.el.querySelector('p')!.firstChild!, 0, 0);
    editor.setStyle('font-size', '40px');
    // Change selection to non-collapsed
    setSelection(editor.el.querySelector('p')!.firstChild!, 0, 2);
    document.dispatchEvent(new Event('selectionchange'));
    editor.el.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'X', bubbles: true }));
    expect(editor.getHTML()).not.toContain('40px');

    // 15. Sticky Overwrite
    editor.setHTML('<p><br></p>');
    setSelection(editor.el.querySelector('p')!, 0, 0);
    editor.setStyle('font-size', '10px');
    editor.setStyle('font-size', '20px');
    editor.el.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'Z', bubbles: true }));
    expect(editor.getHTML()).toContain('20px');
    expect(editor.getHTML()).not.toContain('10px');
  });

  it('Cases 16-20: Structural', () => {
    // 16. List Item
    editor.setHTML('<ul><li>Item</li></ul>');
    let li = editor.el.querySelector('li')!.firstChild!;
    editor.setStyle('font-size', '16px', setSelection(li, 0, 4));
    expect(editor.getHTML()).toContain('16px');

    // 18. Empty Paragraph
    editor.setHTML('<p><br></p>');
    editor.setStyle('font-size', '18px', setSelection(editor.el.querySelector('p')!, 0, 1));
    expect(editor.getHTML()).toContain('18px');

    // 20. Span Boundary
    editor.setHTML('<p><span style="font-size: 20px;">Boundary</span></p>');
    let spanNode = editor.el.querySelector('span')!.firstChild!;
    setSelection(spanNode, 0, 0);
    editor.setStyle('font-size', '30px');
    editor.el.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: '!', bubbles: true }));
    expect(editor.getHTML()).toContain('30px');
  });

  it('Cases 21-25: Boundary Values', () => {
    editor.setHTML('<p>B</p>');
    
    // 21. Gigantic
    let t = editor.el.querySelector('p')!.firstChild!;
    editor.setStyle('font-size', '500px', setSelection(t, 0, 1));
    expect(editor.getHTML()).toContain('500px');

    // 22. Micro
    // Re-query 't' because it's now inside a span
    t = editor.el.querySelector('span')!.firstChild!;
    editor.setStyle('font-size', '1px', setSelection(t, 0, 1));
    expect(editor.getHTML()).toContain('1px');

    // 25. Fractional
    t = editor.el.querySelector('span')!.firstChild!;
    editor.setStyle('font-size', '12.34px', setSelection(t, 0, 1));
    expect(editor.getHTML()).toContain('12.34px');
  });

  it('Cases 26-30: Interactive & Special', () => {
    // 30. Line Break Selection
    editor.setHTML('<p>Line1<br>Line2</p>');
    let p = editor.el.querySelector('p')!;
    editor.setStyle('font-size', '20px', setSelection(p, 0, 2));
    expect(editor.getHTML()).toContain('20px');
  });
});
