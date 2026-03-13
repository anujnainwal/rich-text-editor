import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { InkFlowEditor } from '../index';

describe('QA Bug Fixes', () => {
  let container: HTMLElement;
  let editor: InkFlowEditor;

  beforeEach(() => {
    document.execCommand = vi.fn();
    
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new InkFlowEditor(container);
    
    // Mock selection
    const mockSelection = {
      rangeCount: 1,
      getRangeAt: vi.fn(),
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    };
    window.getSelection = vi.fn().mockReturnValue(mockSelection);
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('should restore selection path after content normalization', () => {
    (editor as any).editableElement.innerHTML = '<p><ul><li>Item</li></ul></p>';
    
    const li = editor.el.querySelector('li')!;
    const range = {
      startContainer: li,
      startOffset: 0,
      endContainer: li,
      endOffset: 4,
      commonAncestorContainer: li,
      cloneRange: () => ({ ...range }),
      collapse: vi.fn(),
      insertNode: vi.fn((node: Node) => {
        li.appendChild(node);
      }),
      setStartAfter: vi.fn(),
      setEndBefore: vi.fn()
    } as unknown as Range;

    document.createRange = vi.fn().mockReturnValue({
      setStartAfter: vi.fn(),
      setEndBefore: vi.fn(),
      collapse: vi.fn(),
    });

    const mockSelection = window.getSelection()!;
    (mockSelection.getRangeAt as any).mockReturnValue(range);

    editor.normalize();

    expect(mockSelection.addRange).toHaveBeenCalled();
    expect(editor.el.innerHTML).toBe('<ul><li>Item</li></ul>');
  });

  it('should only delete image if selection is within the image container', () => {
    editor.setHTML('<div class="te-image-container active"><img src="test.jpg"></div><p>Other text</p>');
    const imageContainer = editor.el.querySelector('.te-image-container') as HTMLElement;
    const p = editor.el.querySelector('p')!;
    
    (editor as any).imageManager.activeContainer = imageContainer;

    const rangeOutside = {
      commonAncestorContainer: p,
    };
    (window.getSelection()!.getRangeAt as any).mockReturnValue(rangeOutside);

    const event = new KeyboardEvent('keydown', { key: 'Backspace' });
    editor.el.dispatchEvent(event);

    expect(editor.el.querySelector('.te-image-container')).not.toBeNull();

    const rangeInside = {
      commonAncestorContainer: imageContainer,
    };
    (window.getSelection()!.getRangeAt as any).mockReturnValue(rangeInside);

    editor.el.dispatchEvent(event);

    expect(editor.el.querySelector('.te-image-container')).toBeNull();
  });
});
