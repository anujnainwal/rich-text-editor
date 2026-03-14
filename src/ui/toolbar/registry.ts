import { ToolbarItem } from './ToolbarItem';
import { undo } from './items/Undo';
import { redo } from './items/Redo';
import { heading } from './items/Heading';
import { fontFamily } from './items/FontFamily';
import { fontSize } from './items/FontSize';
import { lineHeight } from './items/LineHeight';
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
import { image } from './items/Image';
import { table } from './items/Table';
import { codeBlock } from './items/CodeBlock';

const divider: ToolbarItem = { type: 'divider', title: '' };

export const toolbarItems: ToolbarItem[] = [
  { ...undo, id: 'undo' },
  { ...redo, id: 'redo' },
  divider,
  { ...heading, id: 'heading' },
  { ...fontFamily, id: 'font-family' },
  { ...fontSize, id: 'font-size' },
  { ...lineHeight, id: 'line-height' },
  divider,
  { ...bold, id: 'bold' },
  { ...italic, id: 'italic' },
  { ...underline, id: 'underline' },
  { ...strikethrough, id: 'strikethrough' },
  divider,
  { ...textColor, id: 'text-color' },
  { ...highlightColor, id: 'highlight-color' },
  divider,
  { ...alignLeft, id: 'align-left' },
  { ...alignCenter, id: 'align-center' },
  { ...alignRight, id: 'align-right' },
  { ...alignJustify, id: 'align-justify' },
  divider,
  { ...bulletList, id: 'bullet-list' },
  { ...orderedList, id: 'ordered-list' },
  { ...outdent, id: 'outdent' },
  { ...indent, id: 'indent' },
  divider,
  { ...horizontalRule, id: 'horizontal-rule' },
  { ...emoji, id: 'emoji' },
  { ...link, id: 'link' },
  { ...image, id: 'image' },
  { ...table, id: 'table' },
  { ...codeBlock, id: 'code-block' },
  { ...clearFormatting, id: 'clear-formatting' }
];
