import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { CoreEditor } from '../src/core/Editor';

describe('Table Support', () => {
  beforeAll(() => {
    document.execCommand = vi.fn();
    
    // Selection/Range mock for JSDOM
    const mockSelection = {
      rangeCount: 0,
      _ranges: [] as Range[],
      get anchorNode() { return this._ranges[0]?.startContainer; },
      get focusNode() { return this._ranges[0]?.endContainer; },
      getRangeAt(index: number) { return this._ranges[index]; },
      addRange(range: Range) { 
        this._ranges.push(range); 
        this.rangeCount = this._ranges.length;
      },
      removeAllRanges() { 
        this._ranges = []; 
        this.rangeCount = 0;
      },
      // Adding a simple implementation for selectNodeContents if needed, 
      // but usually the native Range.prototype.selectNodeContents works if the node is real.
      containsNode(node: Node) { return true; } 
    };

    window.getSelection = vi.fn().mockReturnValue(mockSelection);
  });

  let container: HTMLElement;
  let editor: CoreEditor;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new CoreEditor(container);
    
    // Set up initial selection so dynamic insertion can work
    // We must ensure the range is attached to a real node in the DOM
    const range = document.createRange();
    if (editor.el.firstChild) {
      range.setStart(editor.el.firstChild, 0);
    } else {
      range.setStart(editor.el, 0);
    }
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('should insert a table with specified dimensions', () => {
    editor.insertTable(2, 4);
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
    expect(table?.classList.contains('te-table')).toBe(true);
    expect(table?.querySelectorAll('tr').length).toBe(2);
    // Count both th and td
    expect(table?.querySelectorAll('td, th').length).toBe(8);
  });

  it('should add a row to the table', () => {
    editor.insertTable(1, 1);
    const table = container.querySelector('table') as HTMLTableElement;
    
    // Select the first (header) cell
    const th = table.querySelector('th');
    expect(th).toBeTruthy();
    
    const range = document.createRange();
    // Select text node instead of the cell directly for more realistic selection
    range.setStart(th!.firstChild || th!, 0);
    range.collapse(true);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    editor.addRow();
    // 1 original th row + 1 new row (td) = 2
    expect(table.rows.length).toBe(2);
  });

  it('should delete a row from the table', () => {
    editor.insertTable(2, 1); // 1 th row + 1 td row
    const table = container.querySelector('table') as HTMLTableElement;
    
    // Select the second row (the td row)
    const td = table.querySelector('td');
    expect(td).toBeTruthy();
    
    const range = document.createRange();
    range.setStart(td!.firstChild || td!, 0);
    range.collapse(true);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    editor.deleteRow();
    expect(table.rows.length).toBe(1);
    expect(table.querySelector('th')).toBeTruthy();
    expect(table.querySelector('td')).toBeNull();
  });

  it('should add a column to the table', () => {
    editor.insertTable(1, 1);
    const table = container.querySelector('table') as HTMLTableElement;
    
    const th = table.querySelector('th');
    expect(th).toBeTruthy();
    
    const range = document.createRange();
    range.setStart(th!.firstChild || th!, 0);
    range.collapse(true);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    editor.addColumn();
    // One row now has 2 cells
    expect(table.rows[0].cells.length).toBe(2);
  });

  it('should delete a column from the table', () => {
    editor.insertTable(1, 2);
    const table = container.querySelector('table') as HTMLTableElement;
    
    const th = table.querySelector('th');
    expect(th).toBeTruthy();
    
    const range = document.createRange();
    range.setStart(th!.firstChild || th!, 0);
    range.collapse(true);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    editor.deleteColumn();
    expect(table.rows[0].cells.length).toBe(1);
  });

  it('should add a paragraph after the table', () => {
    editor.insertTable(2, 2);
    const table = container.querySelector('table');
    const nextSibling = table?.nextElementSibling;
    expect(nextSibling?.tagName).toBe('P');
  });
});
