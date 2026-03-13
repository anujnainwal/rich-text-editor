import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoreEditor } from './src/core/Editor';

describe('Formatting and Link fixes verification', () => {
  let container: HTMLElement;
  let editor: CoreEditor;

  beforeEach(() => {
    document.execCommand = vi.fn();
    window.open = vi.fn();
    document.body.innerHTML = '<div id="editor"></div>';
    container = document.getElementById('editor')!;
    editor = new CoreEditor(container);
  });

  it('should reset headings to paragraphs when clearing formatting', () => {
    // 1. Set a heading
    editor.setHTML('<h2>Heading</h2>');
    
    // 2. Mock selection in the heading
    const h2 = editor.el.querySelector('h2')!;
    const range = document.createRange();
    range.selectNodeContents(h2);
    window.getSelection = vi.fn().mockReturnValue({
      rangeCount: 1,
      getRangeAt: () => range,
      addRange: vi.fn(),
      removeAllRanges: vi.fn(),
    });

    // 3. Clear formatting
    editor.execute('removeFormat');

    // 4. Verify execCommand was called with formatBlock p
    expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'p');
  });

  it('should open link in new tab when clicked', () => {
    // 1. Set a link
    editor.setHTML('<p><a href="https://example.com" id="test-link">Link</a></p>');
    const link = editor.el.querySelector('#test-link') as HTMLElement;

    // 2. Click the link
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true
    });
    link.dispatchEvent(clickEvent);

    // 3. Verify window.open was called
    expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });

  it('should insert URL as text and link it when selection is collapsed', () => {
    // 1. Set cursor in empty editor
    editor.setHTML('<p><br></p>');
    const p = editor.el.querySelector('p')!;
    const range = document.createRange();
    range.setStart(p, 0);
    range.collapse(true);
    window.getSelection = vi.fn().mockReturnValue({
      rangeCount: 1,
      getRangeAt: () => range,
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    });

    // 2. Create link with no selection
    editor.createLink('google.com');

    // 3. Verify HTML
    // Note: execCommand is mocked, so we might need to verify the DOM manually
    // but createLink inserts the text node itself now
    expect(editor.el.innerHTML).toContain('https://google.com');
  });
});
