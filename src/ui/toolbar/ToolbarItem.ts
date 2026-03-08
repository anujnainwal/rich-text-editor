export type ToolbarItemType = 'button' | 'select' | 'input' | 'divider' | 'color-picker';

export interface ToolbarItemOption {
  label: string;
  value: string;
}

export interface ToolbarItem {
  id?: string;
  type: ToolbarItemType;
  title: string;
  command?: string;
  icon?: string;
  value?: string;
  options?: ToolbarItemOption[];
  placeholder?: string;
  className?: string;
}
