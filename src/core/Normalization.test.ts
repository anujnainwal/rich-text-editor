import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { CoreEditor } from './Editor';

describe('HTML Normalization', () => {
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
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should lift lists out of paragraphs', () => {
    const invalidHTML = '<p><ul><li>Item 1</li></ul></p>';
    editor.setHTML(invalidHTML);
    expect(editor.getHTML()).toBe('<ul><li>Item 1</li></ul><p><br></p>');
  });

  it('should lift lists and keep preceding text', () => {
    const mixedHTML = '<p>Preceding text<ul><li>Item 1</li></ul></p>';
    editor.setHTML(mixedHTML);
    expect(editor.getHTML()).toBe('<p>Preceding text</p><ul><li>Item 1</li></ul><p><br></p>');
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

  it('should return an empty string if the content is blank', () => {
    const blankPara = '<p><br></p>';
    editor.setHTML(blankPara);
    expect(editor.getHTML()).toBe('');
  });

  it('should remove is-empty class when a list is present', () => {
    editor.setHTML('<ul><li>Item</li></ul>');
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

  it('should merge adjacent spans with identical styles', () => {
    const html = '<p><span style="color: red;">Part 1</span><span style="color: red;">Part 2</span></p>';
    editor.setHTML(html);
    expect(editor.getHTML()).toBe('<p><span style="color: red;">Part 1Part 2</span></p>');
  });

  it('should not merge adjacent spans with different styles', () => {
    const html = '<p><span style="color: red;">Red</span><span style="color: blue;">Blue</span></p>';
    editor.setHTML(html);
    expect(editor.getHTML()).toBe('<p><span style="color: red;">Red</span><span style="color: blue;">Blue</span></p>');
  });

  it('should merge spans with identical classes and styles', () => {
    const html = '<p><span class="bold" style="color: red;">A</span><span class="bold" style="color: red;">B</span></p>';
    editor.setHTML(html);
    expect(editor.getHTML()).toBe('<p><span class="bold" style="color: red;">AB</span></p>');
  });

  it('should remove spans that become redundant after style removal', () => {
    const html = '<p><span style="font-size: 20px;">Text</span></p>';
    editor.setHTML(html);
    // Manually trigger clear
    (editor as any).clearStyleRecursive(editor.el, 'font-size');
    editor.normalize();
    expect(editor.getHTML()).toBe('<p>Text</p>');
  });
});
