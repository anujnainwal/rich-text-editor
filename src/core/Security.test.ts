import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { CoreEditor } from './Editor';

describe('CoreEditor Security', () => {
  let editor: CoreEditor;
  let container: HTMLDivElement;
  let mockSelection: any;

  beforeAll(() => {
    document.execCommand = vi.fn();
    
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
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new CoreEditor(container);
    mockSelection.removeAllRanges();
  });

  afterEach(() => {
    editor.destroy();
    container.remove();
  });

  it('should strip script tags from setHTML', () => {
    editor.setHTML('<p>Hello</p><script>alert("XSS")</script>');
    const html = editor.getHTML();
    expect(html).not.toContain('<script>');
    expect(html).toBe('<p>Hello</p>');
  });

  it('should strip malicious event handlers from setHTML', () => {
    editor.setHTML('<p><span onclick="alert(\'XSS\')">Click me</span></p>');
    const html = editor.getHTML();
    expect(html).not.toContain('onclick');
    // DOMPurify + normalizeHTML correctly strips the redundant empty span
    expect(html).toBe('<p>Click me</p>');
  });

  it('should block javascript: URIs in links', () => {
    editor.createLink('javascript:alert("XSS")');
    const html = editor.getHTML();
    expect(html).not.toContain('javascript:');
  });

  it('should sanitize the final output of normalizeHTML', () => {
    (editor as any).editableElement.innerHTML = '<p>Normal</p><img src=x onerror=alert(1)>';
    editor.normalize();
    const html = editor.getHTML();
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('alert(1)');
  });

  it('should sanitize links and add security attributes', () => {
    // Testing the sanitize helper directly via setHTML which is what normalize uses
    editor.setHTML('<a href="https://google.com">Google</a>');
    const html = editor.getHTML();
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });
});
