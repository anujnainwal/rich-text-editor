/**
 * SelectionManager handles wrapping the native browser Selection and Range APIs.
 * This ensures consistent behavior across different environments and simplifies
 * interaction with the editor's cursor and selected text.
 */
export class SelectionManager {
  /**
   * Returns the current selection object.
   */
  getSelection(): Selection | null {
    return window.getSelection();
  }

  /**
   * Returns the first range of the current selection.
   */
  getRange(): Range | null {
    const selection = this.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }
    return selection.getRangeAt(0);
  }

  /**
   * Serializes the current selection into a path-based format relative to a root element.
   * This allows restoring selection even if the DOM nodes are replaced but the structure is similar.
   */
  getSelectionPath(root: HTMLElement): { startPath: number[], startOffset: number, endPath: number[], endOffset: number } | null {
    const range = this.getRange();
    if (!range || !root.contains(range.commonAncestorContainer)) return null;

    return {
      startPath: this.getNodePath(range.startContainer, root),
      startOffset: range.startOffset,
      endPath: this.getNodePath(range.endContainer, root),
      endOffset: range.endOffset
    };
  }

  /**
   * Restores selection from a path-based serialization.
   */
  restoreSelectionPath(root: HTMLElement, path: { startPath: number[], startOffset: number, endPath: number[], endOffset: number } | null): void {
    if (!path) return;

    try {
      const startNode = this.getNodeByPath(path.startPath, root);
      const endNode = this.getNodeByPath(path.endPath, root);

      if (startNode && endNode) {
        const range = document.createRange();
        range.setStart(startNode, Math.min(path.startOffset, startNode.textContent?.length || 0));
        range.setEnd(endNode, Math.min(path.endOffset, endNode.textContent?.length || 0));
        this.restoreSelection(range);
      }
    } catch (e) {
      console.warn('Failed to restore selection path:', e);
    }
  }

  private getNodePath(node: Node, root: HTMLElement): number[] {
    const path: number[] = [];
    let current = node;
    while (current !== root && current.parentElement) {
      const index = Array.from(current.parentElement.childNodes).indexOf(current as ChildNode);
      path.unshift(index);
      current = current.parentElement;
    }
    return path;
  }

  private getNodeByPath(path: number[], root: HTMLElement): Node | null {
    let current: Node = root;
    for (const index of path) {
      if (current.childNodes[index]) {
        current = current.childNodes[index];
      } else {
        return null;
      }
    }
    return current;
  }

  /**
   * Saves the current selection range.
   */
  saveSelection(): Range | null {
    const range = this.getRange();
    return range ? range.cloneRange() : null;
  }

  /**
   * Restores a previously saved range.
   */
  restoreSelection(range: Range | null): void {
    if (!range) return;

    const selection = this.getSelection();
    if (selection) {
      try {
        // Ensure range is still valid and in document
        if (!range.startContainer || !document.contains(range.startContainer)) {
          return;
        }
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.warn('Interrupted selection restoration:', e);
      }
    }
  }

  /**
   * Checks if the selection is within a specific element.
   */
  isSelectionInElement(element: HTMLElement): boolean {
    const range = this.getRange();
    if (!range) return false;
    
    return element.contains(range.commonAncestorContainer);
  }

  /**
   * Clears the current selection.
   */
  clearSelection(): void {
    const selection = this.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }

  /**
   * Moves the cursor to the end of the specified element.
   */
  setCursorAtEnd(element: Element): void {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    this.restoreSelection(range);
  }

  /**
   * Moves the cursor to the start of the specified element.
   */
  setCursorAtStart(element: Element): void {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(true);
    this.restoreSelection(range);
  }

  /**
   * Temporary markers for robust preservation across structural changes.
   */
  saveSelectionMarkers(root: HTMLElement): void {
    const range = this.getRange();
    if (!range || !root.contains(range.commonAncestorContainer)) return;

    const startMarker = document.createElement('span');
    startMarker.id = 'te-selection-start';
    startMarker.style.display = 'none';

    const endMarker = document.createElement('span');
    endMarker.id = 'te-selection-end';
    endMarker.style.display = 'none';

    const endRange = range.cloneRange();
    endRange.collapse(false);
    endRange.insertNode(endMarker);

    const startRange = range.cloneRange();
    startRange.collapse(true);
    startRange.insertNode(startMarker);
  }

  restoreSelectionMarkers(root: HTMLElement): void {
    const startMarker = root.querySelector('#te-selection-start');
    const endMarker = root.querySelector('#te-selection-end');

    if (startMarker && endMarker) {
      const range = document.createRange();
      range.setStartAfter(startMarker);
      range.setEndBefore(endMarker);
      this.restoreSelection(range);
    } else if (startMarker) {
      const range = document.createRange();
      range.setStartAfter(startMarker);
      range.collapse(true);
      this.restoreSelection(range);
    }

    // Cleanup
    if (startMarker) startMarker.remove();
    if (endMarker) endMarker.remove();
  }

  removeSelectionMarkers(root: HTMLElement): void {
    root.querySelectorAll('#te-selection-start, #te-selection-end').forEach(m => m.remove());
  }
}
