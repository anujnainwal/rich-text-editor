import { ToolbarItem } from '../ToolbarItem';

export const addRow: ToolbarItem = {
  type: 'button',
  command: 'addRow',
  title: 'Add Row',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18M12 11h4M14 9v4"/></svg>'
};

export const deleteRow: ToolbarItem = {
  type: 'button',
  command: 'deleteRow',
  title: 'Delete Row',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18M11 13l2-2m0 2-2-2"/></svg>'
};

export const addColumn: ToolbarItem = {
  type: 'button',
  command: 'addColumn',
  title: 'Add Column',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18M13 11v4M11 13h4"/></svg>'
};

export const deleteColumn: ToolbarItem = {
  type: 'button',
  command: 'deleteColumn',
  title: 'Delete Column',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18M11 13l2 2m0-2-2 2"/></svg>'
};
