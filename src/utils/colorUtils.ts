/**
 * Utility to add opacity to a color string safely.
 * Handles both hex (#RRGGBB) and rgb (rgb(r, g, b)) formats.
 */
export const addOpacity = (color: string, opacity: number): string => {
  if (!color) return 'transparent';

  // Handle rgb(r, g, b)
  if (color.startsWith('rgb(')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }

  // Handle hex #RRGGBB
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return color;
};

/**
 * Converts hex opacity (00-FF) to decimal (0-1)
 */
export const hexToOpacity = (hex: string): number => {
  return parseInt(hex, 16) / 255;
};
