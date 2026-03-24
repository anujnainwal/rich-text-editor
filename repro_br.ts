import { CoreEditor } from '@inkflow/rich-text-editor';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><div id="editor"></div>');
Object.defineProperty(global, 'document', { value: dom.window.document });
Object.defineProperty(global, 'window', { value: dom.window });
Object.defineProperty(global, 'Node', { value: dom.window.Node });
Object.defineProperty(global, 'HTMLElement', { value: dom.window.HTMLElement });
Object.defineProperty(global, 'HTMLTableCellElement', { value: dom.window.HTMLTableCellElement });
Object.defineProperty(global, 'HTMLTableElement', { value: dom.window.HTMLTableElement });
Object.defineProperty(global, 'HTMLTableRowElement', { value: dom.window.HTMLTableRowElement });
Object.defineProperty(global, 'DOMParser', { value: dom.window.DOMParser });
Object.defineProperty(global, 'NodeFilter', { value: dom.window.NodeFilter });
Object.defineProperty(global, 'MutationObserver', { value: dom.window.MutationObserver });
Object.defineProperty(global, 'navigator', { value: dom.window.navigator });
Object.defineProperty(global, 'Element', { value: dom.window.Element });
Object.defineProperty(global, 'Event', { value: dom.window.Event });

// Monkey-patch execCommand for JSDOM
(dom.window.document as any).execCommand = () => true;
(global.document as any).execCommand = () => true;

const container = document.getElementById('editor')!;
const editor = new CoreEditor(container);

const testHarness = (html: string) => {
    editor.setHTML(html);
    const output = editor.getHTML();
    console.log(`Input:  ${html}`);
    console.log(`Output: ${output}`);
    console.log('---');
};

console.log('--- Testing Line Height on Multiple Paragraphs ---');
editor.setHTML('<p>line 1</p><p>line 2</p>');
const range = document.createRange();
range.setStartBefore(editor.el.firstChild!);
range.setEndAfter(editor.el.lastChild!);
// Mock selection
const sel = window.getSelection();
sel?.removeAllRanges();
sel?.addRange(range);

editor.setStyle('line-height', '0.5', range);
console.log('Resulting HTML:');
console.log(editor.getHTML());
