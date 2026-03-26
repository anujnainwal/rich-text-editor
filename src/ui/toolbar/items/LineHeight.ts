import { ToolbarItem } from '../ToolbarItem';

export const lineHeight: ToolbarItem = {
  type: 'select',
  title: 'Line Height',
  command: 'lineHeight',
  options: [
    { label: 'Normal', value: 'normal' },
    { label: '1.0', value: '1.0' },
    { label: '1.1', value: '1.1' },
    { label: '1.2', value: '1.2' },
    { label: '1.3', value: '1.3' },
    { label: '1.4', value: '1.4' },
    { label: '1.5', value: '1.5' },
    { label: '1.6', value: '1.6' },
    { label: '1.7', value: '1.7' },
    { label: '1.8', value: '1.8' },
    { label: '1.9', value: '1.9' },
    { label: '2.0', value: '2.0' },
  ],
  value: 'normal'
};
