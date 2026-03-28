import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InkflowEditor } from '../index';

describe('QA Bug Fixes', () => {
  let container: HTMLElement;
  let editor: InkflowEditor;

  beforeEach(() => {
    document.execCommand = vi.fn();
    
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new InkflowEditor(container);
    
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
    const mockSelection = window.getSelection()!;

    // Initial path capture setup
    const range = document.createRange();
    range.setStart(li.firstChild || li, 0);
    range.setEnd(li.firstChild || li, 4);
    
    (mockSelection.getRangeAt as any).mockReturnValue(range);
    (mockSelection as any).rangeCount = 1;

    editor.normalize();

    // With path-based restoration, restoreSelectionPath will be called,
    // which eventually calls addRange.
    expect(mockSelection.addRange).toHaveBeenCalled();
    expect(editor.el.innerHTML).toContain('<ul><li>Item</li>');
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
