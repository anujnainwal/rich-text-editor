export interface EmojiData {
  emoji: string;
  name: string;
  category: string;
}

export const EMOJI_LIST: EmojiData[] = [
  { emoji: '😀', name: 'grinning', category: 'Smileys' },
  { emoji: '😃', name: 'smiley', category: 'Smileys' },
  { emoji: '😄', name: 'smile', category: 'Smileys' },
  { emoji: '😁', name: 'grin', category: 'Smileys' },
  { emoji: '😆', name: 'laughing', category: 'Smileys' },
  { emoji: '😅', name: 'sweat smile', category: 'Smileys' },
  { emoji: '😂', name: 'joy', category: 'Smileys' },
  { emoji: '🙂', name: 'slight smile', category: 'Smileys' },
  { emoji: '😉', name: 'wink', category: 'Smileys' },
  { emoji: '😊', name: 'blush', category: 'Smileys' },
  { emoji: '😍', name: 'heart eyes', category: 'Smileys' },
  { emoji: '😘', name: 'kissing heart', category: 'Smileys' },
  { emoji: '👍', name: 'thumbs up', category: 'Hands' },
  { emoji: '👎', name: 'thumbs down', category: 'Hands' },
  { emoji: '❤️', name: 'heart', category: 'Symbols' },
  { emoji: '✨', name: 'sparkles', category: 'Symbols' },
  { emoji: '🔥', name: 'fire', category: 'Symbols' },
  { emoji: '✅', name: 'check', category: 'Symbols' },
  { emoji: '🎉', name: 'party', category: 'Activities' },
  { emoji: '🚀', name: 'rocket', category: 'Travel' },
];
