export interface HistoryState {
  html: string;
  selection: { startPath: number[], startOffset: number, endPath: number[], endOffset: number } | null;
}

export class HistoryManager {
  private stack: HistoryState[] = [];
  private index: number = -1;
  private maxDepth: number = 50;

  constructor(initialState?: string) {
    if (initialState !== undefined) {
      this.record(initialState, null);
    }
  }

  /**
   * Records a new state in the history stack.
   * Clears any "redo" states if we record a new action.
   */
  public record(html: string, selection: HistoryState['selection'] | null): void {
    // If the new state is identical to the current one, do nothing
    // Note: We check HTML identity, but we still update the selection if it changed
    if (this.index >= 0 && this.stack[this.index].html === html) {
      this.stack[this.index].selection = selection;
      return;
    }

    // Remove redo states
    if (this.index < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.index + 1);
    }

    this.stack.push({ html, selection });
    this.index++;

    // Limit stack size
    if (this.stack.length > this.maxDepth) {
      this.stack.shift();
      this.index--;
    }
  }

  /**
   * Returns the previous state if available.
   */
  public undo(): HistoryState | null {
    if (this.index > 0) {
      this.index--;
      return this.stack[this.index];
    }
    return null;
  }

  /**
   * Returns the next state if available.
   */
  public redo(): HistoryState | null {
    if (this.index < this.stack.length - 1) {
      this.index++;
      return this.stack[this.index];
    }
    return null;
  }

  /**
   * Checks if undo is possible.
   */
  public canUndo(): boolean {
    return this.index > 0;
  }

  /**
   * Checks if redo is possible.
   */
  public canRedo(): boolean {
    return this.index < this.stack.length - 1;
  }
}
