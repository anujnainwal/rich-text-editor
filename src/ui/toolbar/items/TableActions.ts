import { ToolbarItem } from '../ToolbarItem';

export const addRow: ToolbarItem = {
  type: 'button',
  command: 'addRow',
  title: 'Add Row',
  icon: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M22 10H2v10h20V10M4 12h5v3H4v-3m7 0h3v3h-3v-3m5 0h4v3h-4v-3m-12 5h5v2H4v-2m7 0h3v2h-3v-2m5 0h4v2h-4v-2M2 4v4h20V4H2m7 2h3v2H9V6m5 0h3v2h-3V6M4 6h3v2H4V6m11-2h4v2h-4V4Z"/></svg>'
};

export const deleteRow: ToolbarItem = {
  type: 'button',
  command: 'deleteRow',
  title: 'Delete Row',
  icon: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M15.41 16.59L14 18l-2-2-2 2-1.41-1.41L10.59 14 8.59 12 10 10.59l2 2 2-2 1.41 1.41-2 2 2 2M22 10H2v10h20V10M4 12h5v3H4v-3m7 0h3v3h-3v-3m5 0h4v3h-4v-3m-12 5h5v2H4v-2m7 0h3v2h-3v-2m5 0h4v2h-4v-2M2 4v4h20V4H2m7 2h3v2H9V6m5 0h3v2h-3V6M4 6h3v2H4V6m11-2h4v2h-4V4Z"/></svg>'
};

export const addColumn: ToolbarItem = {
  type: 'button',
  command: 'addColumn',
  title: 'Add Column',
  icon: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M10 2v20h10V2H10m2 2h3v5h-3V4m0 7h3v3h-3v-3m0 5h3v4h-3v-4m5-12h3v5h-3V4m0 7h3v3h-3v-3m0 5h3v4h-3v-4M4 2v20H2V2h2m4 0v20H6V2h2m0 2H6v5h2V4m0 7H6v3h2v-3m0 5H6v4h2v-4Z"/></svg>'
};

export const deleteColumn: ToolbarItem = {
  type: 'button',
  command: 'deleteColumn',
  title: 'Delete Column',
  icon: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M11.41 12L10 10.59l2-2 2 2-1.41 1.41L14.59 14 12.59 16 14 17.41l2-2 2 2 1.41-1.41-2-2 2-2L10 2v20h10V2H10m2 2h3v5h-3V4m0 7h3v3h-3v-3m0 5h3v4h-3v-4m5-12h3v5h-3V4m0 7h3v3h-3v-3m0 5h3v4h-3v-4M4 2v20H2V2h2m4 0v20H6V2h2m0 2H6v5h2V4m0 7H6v3h2v-3m0 5H6v4h2v-4Z"/></svg>'
};
