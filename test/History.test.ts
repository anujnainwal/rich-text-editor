import { describe, it, expect } from 'vitest';
import { HistoryManager } from '../src/core/HistoryManager';

describe('HistoryManager', () => {
  it('should record states and undo', () => {
    const history = new HistoryManager('state 1');
    history.record('state 2');
    history.record('state 3');

    expect(history.undo()).toBe('state 2');
    expect(history.undo()).toBe('state 1');
    expect(history.undo()).toBe(null);
  });

  it('should redo states', () => {
    const history = new HistoryManager('state 1');
    history.record('state 2');
    history.undo();

    expect(history.redo()).toBe('state 2');
    expect(history.redo()).toBe(null);
  });

  it('should clear redo stack on new record', () => {
    const history = new HistoryManager('state 1');
    history.record('state 2');
    history.undo();
    history.record('state 3');

    expect(history.redo()).toBe(null);
    expect(history.undo()).toBe('state 1');
  });

  it('should respect maxDepth', () => {
    // With maxDepth 50, let's test a smaller depth for the unit test context if we were to modify it
    // But since it's hardcoded to 50, we'll just verify basic record/undo.
    const history = new HistoryManager('1');
    for (let i = 2; i <= 60; i++) {
        history.record(i.toString());
    }
    
    // Should have dropped '1' through '10'
    // Actually it shifts when length > 50. 
    // After 60 records, the first state in stack should be '11'
    let count = 0;
    while(history.undo()) { count++; }
    expect(count).toBe(49); // 60 was index 50, 59 was 49... 11 was at index 0. 
    // index started at 0 for '1'. 
    // record '2' -> index 1, len 2
    // record '50' -> index 49, len 50
    // record '51' -> shifts '1', index 49, len 50, stack[0] is '2'
    // record '60' -> index 49, len 50, stack[0] is '11'
    // undoing from 60 (index 49) to 11 (index 0) takes 49 undos.
  });
});
