import { ToolbarItem } from './ToolbarItem';
import { undo } from './items/Undo';
import { redo } from './items/Redo';
import { heading } from './items/Heading';
import { fontFamily } from './items/FontFamily';
import { fontSize } from './items/FontSize';
import { bold } from './items/Bold';
import { italic } from './items/Italic';
import { underline } from './items/Underline';
import { strikethrough } from './items/Strikethrough';
import { textColor } from './items/TextColor';
import { highlightColor } from './items/HighlightColor';
import { alignLeft } from './items/AlignLeft';
import { alignCenter } from './items/AlignCenter';
import { alignRight } from './items/AlignRight';
import { alignJustify } from './items/AlignJustify';
import { bulletList } from './items/BulletList';
import { orderedList } from './items/OrderedList';
import { outdent } from './items/Outdent';
import { indent } from './items/Indent';
import { horizontalRule } from './items/HorizontalRule';
import { clearFormatting } from './items/ClearFormatting';
import { emoji } from './items/Emoji';
import { link } from './items/Link';

const divider: ToolbarItem = { type: 'divider', title: '' };

export const toolbarItems: ToolbarItem[] = [
  undo,
  redo,
  divider,
  heading,
  fontFamily,
  fontSize,
  divider,
  bold,
  italic,
  underline,
  strikethrough,
  divider,
  textColor,
  highlightColor,
  divider,
  alignLeft,
  alignCenter,
  alignRight,
  alignJustify,
  divider,
  bulletList,
  orderedList,
  outdent,
  indent,
  divider,
  horizontalRule,
  emoji,
  link,
  clearFormatting
];
