# Editor Metrics: CharCount and Limits

The InkFlow Editor provides built-in support for tracking CharCount and enforcing limits. This is useful for writing tasks with specific length constraints.

## Configuration Options

You can customize these metrics via `EditorOptions`:

| Option | Type | Description |
| :--- | :--- | :--- |
| `maxCharCount` | `number` | The maximum number of characters allowed. |
| `showCharCount` | `boolean` | Whether to display the character count in the status bar. |
| `strictCharLimit` | `boolean` | If true, prevents further typing once the limit is reached. |

## UI Placement

Metrics are displayed on the right side of the toolbar status bar for high visibility.

- **CharCount**: Displayed as `Chars: [count]` or `Chars: [count]/[limit]`.

## Behavior

- **Warning State**: When the character limit is reached, the corresponding metric display will turn red to notify the user.
- **Auto-Update**: Metrics update in real-time as you type.

### Example Usage

```javascript
const editor = new InkFlowEditor(container, {
  maxCharCount: 2000,
  showCharCount: true,
  strictCharLimit: true
});
```
