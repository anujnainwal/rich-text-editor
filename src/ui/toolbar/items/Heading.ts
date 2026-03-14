import { ToolbarItem } from '../ToolbarItem';

export const heading: ToolbarItem = {
  type: 'select',
  title: 'Heading',
  command: 'formatBlock',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"></path><path d="M4 18V6"></path><path d="M12 18V6"></path><path d="M17 12h3"></path><path d="M17 18V6"></path></svg>',
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
