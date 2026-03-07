import { ToolbarItem } from '../ToolbarItem';

export const heading: ToolbarItem = {
  type: 'select',
  title: 'Heading',
  command: 'formatBlock',
  options: [
    { label: 'Paragraph', value: 'P' },
    { label: 'Heading 1', value: 'H1' },
    { label: 'Heading 2', value: 'H2' },
    { label: 'Heading 3', value: 'H3' },
    { label: 'Heading 4', value: 'H4' },
    { label: 'Heading 5', value: 'H5' },
    { label: 'Heading 6', value: 'H6' },
  ]
};
