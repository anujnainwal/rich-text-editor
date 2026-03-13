import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InkFlowEditor } from '../index';

describe('QA Bug Fixes', () => {
  let container: HTMLElement;
  let editor: InkFlowEditor;

  beforeEach(() => {
    // Mock execCommand BEFORE editor initialization
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
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should restore selection path after content normalization', () => {
    // Manually set invalid status without using normalize()
    (editor as any).editableElement.innerHTML = '<p><ul><li>Item</li></ul></p>';
    
    // Simulate selection in the list item
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

    // Also mock document.createRange for the restoration part
    document.createRange = vi.fn().mockReturnValue({
      setStartAfter: vi.fn(),
      setEndBefore: vi.fn(),
      collapse: vi.fn(),
    });

    const mockSelection = window.getSelection()!;
    (mockSelection.getRangeAt as any).mockReturnValue(range);

    // Call normalize - it should lift the list and use preserve selection
    editor.normalize();

    // Verify it called addRange (part of restoration)
    expect(mockSelection.addRange).toHaveBeenCalled();
    // HTML should be lifted
    expect(editor.el.innerHTML).toBe('<ul><li>Item</li></ul>');
  });

  it('should only delete image if selection is within the image container', () => {
    editor.setHTML('<div class="te-image-container active"><img src="test.jpg"></div><p>Other text</p>');
    const container = editor.el.querySelector('.te-image-container') as HTMLElement;
    const p = editor.el.querySelector('p')!;
    
    // Set active container in ImageManager
    (editor as any).imageManager.activeContainer = container;

    // Simulate selection OUTSIDE the image (in the paragraph)
    const rangeOutside = {
      commonAncestorContainer: p,
    };
    (window.getSelection()!.getRangeAt as any).mockReturnValue(rangeOutside);

    // Simulate Backspace
    const event = new KeyboardEvent('keydown', { key: 'Backspace' });
    editor.el.dispatchEvent(event);

    // Image should NOT be deleted
    expect(editor.el.querySelector('.te-image-container')).not.toBeNull();

    // Simulate selection INSIDE the image
    const rangeInside = {
      commonAncestorContainer: container,
    };
    (window.getSelection()!.getRangeAt as any).mockReturnValue(rangeInside);

    // Simulate Backspace again
    editor.el.dispatchEvent(event);

    // Image SHOULD be deleted now
    expect(editor.el.querySelector('.te-image-container')).toBeNull();
  });
});
