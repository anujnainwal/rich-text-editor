import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { CoreEditor } from './Editor';

describe('CoreEditor', () => {
  let mockSelection: any;
  let container: HTMLElement;
  let editor: CoreEditor;

  beforeAll(() => {
    document.execCommand = vi.fn();
    
    // Improved Selection/Range mock for JSDOM
    mockSelection = {
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
    mockSelection.removeAllRanges();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize correctly', () => {
    expect(editor).toBeDefined();
    expect(editor.getHTML()).toBe('');
  });

  it('should execute basic formatting commands', () => {
    editor.setHTML('<p>Hello World</p>');
    
    // Select "Hello"
    const range = document.createRange();
    const textNode = editor.el.querySelector('p')!.firstChild!;
    range.setStart(textNode, 0);
    range.setEnd(textNode, 5);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    editor.execute('bold');
    
    // Check if execCommand was called with 'bold'
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
  });

  it('should apply custom font size using setStyle', () => {
    editor.setHTML('<p>Test Size</p>');
    
    // Select "Size"
    const range = document.createRange();
    const textNode = editor.el.querySelector('p')!.firstChild!;
    range.setStart(textNode, 5);
    range.setEnd(textNode, 9);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    editor.setStyle('font-size', '20px');
    const html = editor.getHTML();
    expect(html).toContain('<span style="font-size: 20px;">Size</span>');
  });

  it('should handle font size update on existing span', () => {
    editor.setHTML('<p>Test <span style="font-size: 10px;">Size</span></p>');
    
    // Select "Size" inside the span
    const span = editor.el.querySelector('span')!;
    const range = document.createRange();
    range.selectNodeContents(span);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    editor.setStyle('font-size', '30px');
    
    const html = editor.getHTML();
    // It should update the existing span instead of nesting
    expect(html).toContain('<span style="font-size: 30px;">Size</span>');
    expect((html.match(/<span/g) || []).length).toBe(1);
  });

  it('should support incremental updates to a range (simulating typing in input)', () => {
    editor.setHTML('<p>Incremental Test</p>');
    
    // Select "Incremental"
    const range = document.createRange();
    const textNode = editor.el.querySelector('p')!.firstChild!;
    range.setStart(textNode, 0);
    range.setEnd(textNode, 11);
    
    // First update: 20px
    const range1 = editor.setStyle('font-size', '20px', range);
    expect(editor.getHTML()).toContain('<span style="font-size: 20px;">Incremental</span>');
    expect(range1).not.toBeNull();

    // Second update: 24px (using the new range)
    editor.setStyle('font-size', '24px', range1!);
    expect(editor.getHTML()).toContain('<span style="font-size: 24px;">Incremental</span>');
    // Should still only be one span
    expect((editor.getHTML().match(/<span/g) || []).length).toBe(1);
  });

  it('should intelligently link web URLs and email addresses', () => {
    editor.setHTML('<p>Inquire at hello@example.com or visit example.com</p>');
    
    // Test email
    const sel = window.getSelection();
    const range = document.createRange();
    const p = editor.el.querySelector('p')!;
    const textNode = p.firstChild!;
    
    // Select "hello@example.com"
    range.setStart(textNode, 11);
    range.setEnd(textNode, 28);
    sel?.removeAllRanges();
    sel?.addRange(range);
    
    editor.createLink('hello@example.com');
    expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'mailto:hello@example.com');
    
    // Test web URL
    range.setStart(p.lastChild!, 11); // "example.com"
    range.setEnd(p.lastChild!, 22);
    sel?.removeAllRanges();
    sel?.addRange(range);
    
    editor.createLink('example.com');
    expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com');
  });
});
