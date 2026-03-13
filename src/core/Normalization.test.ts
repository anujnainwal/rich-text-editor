import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { CoreEditor } from './Editor';

describe('HTML Normalization', () => {
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

  it('should lift lists out of paragraphs', () => {
    const invalidHTML = '<p><ul><li>Item 1</li></ul></p>';
    editor.setHTML(invalidHTML);
    expect(editor.getHTML()).toBe('<ul><li>Item 1</li></ul>');
  });

  it('should lift lists and keep preceding text', () => {
    const mixedHTML = '<p>Preceding text<ul><li>Item 1</li></ul></p>';
    editor.setHTML(mixedHTML);
    // The paragraph should stay because it has text, but the list should be moved out
    expect(editor.getHTML()).toBe('<p>Preceding text</p><ul><li>Item 1</li></ul>');
  });

  it('should remove redundant spans', () => {
    const redundantHTML = '<p><span>Just text</span> <span style="color: red;">Colored</span></p>';
    editor.setHTML(redundantHTML);
    expect(editor.getHTML()).toBe('<p>Just text <span style="color: red;">Colored</span></p>');
  });

  it('should remove empty spans', () => {
    const emptySpanHTML = '<p>Text<span></span></p>';
    editor.setHTML(emptySpanHTML);
    expect(editor.getHTML()).toBe('<p>Text</p>');
  });

  it('should remove empty paragraphs when there are multiple', () => {
    const multipleParas = '<p>Para 1</p><p></p><p>Para 2</p>';
    editor.setHTML(multipleParas);
    expect(editor.getHTML()).toBe('<p>Para 1</p><p>Para 2</p>');
  });

  it('should return an empty string if the content is just a blank paragraph', () => {
    const blankPara = '<p><br></p>';
    editor.setHTML(blankPara);
    expect(editor.getHTML()).toBe('');
  });

  it('should remove is-empty class when a list is present', () => {
    editor.setHTML('<ul><li>Item</li></ul>');
    // Forcing checkPlaceholder call if it's internal
    (editor as any).checkPlaceholder(); 
    expect(editor.el.classList.contains('is-empty')).toBe(false);
  });

  it('should wrap top-level text nodes in <p>', () => {
    const raw = 'Simple text';
    editor.setHTML(raw);
    expect(editor.getHTML()).toBe('<p>Simple text</p>');
  });

  it('should wrap mixed top-level text and block nodes correctly', () => {
    const raw = 'Text before<ul><li>List</li></ul>Text after';
    editor.setHTML(raw);
    expect(editor.getHTML()).toBe('<p>Text before</p><ul><li>List</li></ul><p>Text after</p>');
  });
});
