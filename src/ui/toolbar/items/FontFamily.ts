import { ToolbarItem } from '../ToolbarItem';

export const fontFamily: ToolbarItem = {
  type: 'select',
  title: 'Font',
  command: 'fontFamily',
  options: [
    { label: 'Inter', value: "'Inter', sans-serif" },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier', value: "'Courier New', monospace" },
    { label: 'Times New Roman', value: "'Times New Roman', serif" },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Tahoma', value: 'Tahoma, sans-serif' },
    { label: 'Roboto', value: "'Roboto', sans-serif" },
    { label: 'Open Sans', value: "'Open Sans', sans-serif" },
    { label: 'Montserrat', value: "'Montserrat', sans-serif" },
    { label: 'Lato', value: "'Lato', sans-serif" },
    { label: 'Poppins', value: "'Poppins', sans-serif" },
    { label: 'Oswald', value: "'Oswald', sans-serif" },
    { label: 'Playfair Display', value: "'Playfair Display', serif" },
    { label: 'Merriweather', value: "'Merriweather', serif" },
  ]
};
