import { describe, it, expect } from 'vitest';
import { HistoryManager } from '../src/core/HistoryManager';

describe('HistoryManager', () => {
  it('should record states and undo', () => {
    const history = new HistoryManager('state 1');
    history.record('state 2', null);
    history.record('state 3', null);

    expect(history.undo()?.html).toBe('state 2');
    expect(history.undo()?.html).toBe('state 1');
    expect(history.undo()).toBe(null);
  });

  it('should redo states', () => {
    const history = new HistoryManager('state 1');
    history.record('state 2', null);
    history.undo();

    expect(history.redo()?.html).toBe('state 2');
    expect(history.redo()).toBe(null);
  });

  it('should clear redo stack on new record', () => {
    const history = new HistoryManager('state 1');
    history.record('state 2', null);
    history.undo();
    history.record('state 3', null);

    expect(history.redo()).toBe(null);
    expect(history.undo()?.html).toBe('state 1');
  });

  it('should respect maxDepth', () => {
    const history = new HistoryManager('1');
    for (let i = 2; i <= 60; i++) {
        history.record(i.toString(), null);
    }
    
    let count = 0;
    while(history.undo()) { count++; }
    expect(count).toBe(49);
  });
});
