/**
 * The site's mark: the king of the Marble set, used by the favicon, the PWA icons and the Open Graph image
 * so all three stay one drawing. Kept as data (not a component) because the icon scripts run in Node.
 */
export const LOGO_PATHS = [
  'M47 8h6v6h6v6h-6v7h-6v-7h-6v-6h6z',
  'M50 27c10 0 18 7 18 16 0 5-2 9-6 13l4 16H34l4-16c-4-4-6-8-6-13 0-9 8-16 18-16z',
  'M28 82h44l4 8H24z',
  'M22 92h56a3 3 0 0 1 3 3v3H19v-3a3 3 0 0 1 3-3z',
];

export const LOGO_COLORS = { background: '#2f3a44', piece: '#f3efe6', edge: '#12171c', accent: '#bf892f' };
