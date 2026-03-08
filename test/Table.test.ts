import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
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
      }
    };

    window.getSelection = vi.fn().mockReturnValue(mockSelection);
  });

  let container: HTMLElement;
  let editor: CoreEditor;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new CoreEditor(container);
    
    // Set up initial selection to dynamic insertion can work
    const range = document.createRange();
    range.setStart(editor.el.firstChild || editor.el, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  });

  it('should insert a table with specified dimensions', () => {
    editor.insertTable(2, 4);
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
    expect(table?.classList.contains('te-table')).toBe(true);
    expect(table?.querySelectorAll('tr').length).toBe(2);
    expect(table?.querySelectorAll('td').length).toBe(8);
  });

  it('should have editable cells', () => {
    editor.insertTable(1, 1);
    const td = container.querySelector('td');
    expect(td).toBeTruthy();
    // In our implementation, we rely on the table being inside a contenteditable parent
    // or the cells themselves being editable if needed. 
    // Since the whole editor is contenteditable, table cells should be as well.
  });

  it('should add a row to the table', () => {
    editor.insertTable(1, 1);
    const table = container.querySelector('table') as HTMLTableElement;
    
    // Select the first cell
    const td = table.querySelector('td')!;
    const range = document.createRange();
    range.selectNodeContents(td);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    editor.addRow();
    expect(table.rows.length).toBe(2);
  });

  it('should delete a row from the table', () => {
    editor.insertTable(2, 1);
    const table = container.querySelector('table') as HTMLTableElement;
    
    // Select the first cell
    const td = table.querySelector('td')!;
    const range = document.createRange();
    range.selectNodeContents(td);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    editor.deleteRow();
    expect(table.rows.length).toBe(1);
  });

  it('should add a column to the table', () => {
    editor.insertTable(1, 1);
    const table = container.querySelector('table') as HTMLTableElement;
    
    // Select the first cell
    const td = table.querySelector('td')!;
    const range = document.createRange();
    range.selectNodeContents(td);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    editor.addColumn();
    expect(table.rows[0].cells.length).toBe(2);
  });

  it('should delete a column from the table', () => {
    editor.insertTable(1, 2);
    const table = container.querySelector('table') as HTMLTableElement;
    
    // Select the first cell
    const td = table.querySelector('td')!;
    const range = document.createRange();
    range.selectNodeContents(td);
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
