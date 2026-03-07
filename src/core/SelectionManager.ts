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
      selection.removeAllRanges();
      selection.addRange(range);
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
}
