export interface HistoryState {
  html: string;
  // We can add cursor position/selection data here later if needed
}

export class HistoryManager {
  private stack: HistoryState[] = [];
  private index: number = -1;
  private maxDepth: number = 50;

  constructor(initialState?: string) {
    if (initialState !== undefined) {
      this.record(initialState);
    }
  }

  /**
   * Records a new state in the history stack.
   * Clears any "redo" states if we record a new action.
   */
  public record(html: string): void {
    // If the new state is identical to the current one, do nothing
    if (this.index >= 0 && this.stack[this.index].html === html) {
      return;
    }

    // Remove redo states
    if (this.index < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.index + 1);
    }

    this.stack.push({ html });
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
  public undo(): string | null {
    if (this.index > 0) {
      this.index--;
      return this.stack[this.index].html;
    }
    return null;
  }

  /**
   * Returns the next state if available.
   */
  public redo(): string | null {
    if (this.index < this.stack.length - 1) {
      this.index++;
      return this.stack[this.index].html;
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
