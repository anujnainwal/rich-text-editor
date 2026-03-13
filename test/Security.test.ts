import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { CoreEditor } from '../src/core/Editor';

describe('Security Hardening', () => {
  let container: HTMLElement;
  let editor: CoreEditor;

  beforeAll(() => {
    document.execCommand = vi.fn();
    window.getSelection = vi.fn().mockReturnValue({
      rangeCount: 0,
      getRangeAt: () => ({ collapsed: true, insertNode: vi.fn(), selectNodeContents: vi.fn() }),
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    });
  });

  beforeEach(() => {
    document.body.innerHTML = '<div id="editor"></div>';
    container = document.getElementById('editor')!;
    editor = new CoreEditor(container);
    vi.clearAllMocks();
  });

  describe('DOMPurify HTML Sanitization', () => {
    it('should strip script tags from setHTML', () => {
      editor.setHTML('<p>Safe content</p><script>alert(1)</script>');
      expect(editor.el.innerHTML).not.toContain('<script>');
      expect(editor.el.innerHTML).toContain('<p>Safe content</p>');
    });

    it('should strip malicious event handlers from setHTML', () => {
      editor.setHTML('<img src="x" onerror="alert(1)" />');
      expect(editor.el.innerHTML).not.toContain('onerror');
      expect(editor.el.innerHTML).toContain('<img src="x"');
    });

    it('should allow benign attributes like class and id', () => {
      editor.setHTML('<p class="my-class" id="my-id">Hello</p>');
      expect(editor.el.innerHTML).toContain('class="my-class"');
      expect(editor.el.innerHTML).toContain('id="my-id"');
    });
  });

  describe('Link URI Hardening', () => {
    it('should reject javascript: URIs', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      editor.createLink('javascript:alert(1)');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Blocked malicious URI scheme'));
      expect(document.execCommand).not.toHaveBeenCalledWith('createLink', false, expect.any(String));
      
      consoleSpy.mockRestore();
    });

    it('should reject data: URIs in links', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      editor.createLink('data:text/html,<script>alert(1)</script>');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Blocked malicious URI scheme'));
      expect(document.execCommand).not.toHaveBeenCalledWith('createLink', false, expect.any(String));
      
      consoleSpy.mockRestore();
    });

    it('should process safe URIs', () => {
      editor.createLink('google.com');
      // google.com gets prefixed with https://
      expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://google.com');
    });
  });
});
