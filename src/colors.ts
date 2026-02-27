/**
 * Color mappings tuned to match chromesthesia perceptions:
 *
 *  C  = Blue        C# = Brighter blue
 *  D  = Green       D# = Brighter green
 *  E  = Yellow
 *  F  = Purple      F# = Brighter purple
 *  G  = Orange      G# = Brighter orange
 *  A  = Turquoise   A# = Brighter turquoise
 *  B  = Grey
 *
 * General rule: sharps are brighter (higher lightness),
 *               flats are darker (lower lightness).
 */

export const NOTE_NAMES: string[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

// [hue, saturation%, lightness%]
const NOTE_HSL: [number, number, number][] = [
  [210, 75, 52],  // C  — blue
  [210, 82, 70],  // C# — brighter blue
  [130, 68, 40],  // D  — green
  [130, 75, 58],  // D# — brighter green
  [ 52, 95, 54],  // E  — yellow
  [275, 62, 48],  // F  — purple
  [275, 72, 65],  // F# — brighter purple
  [ 24, 90, 52],  // G  — orange
  [ 24, 96, 68],  // G# — brighter orange
  [174, 72, 42],  // A  — turquoise
  [174, 80, 58],  // A# — brighter turquoise
  [ 38, 10, 62],  // B  — warm grey / silver
];

/** HSL color string for each pitch class */
export const NOTE_COLORS: string[] = NOTE_HSL.map(
  ([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`
);

/** RGB tuple for each pitch class (pre-parsed for canvas gradient use) */
export const NOTE_RGB: [number, number, number][] = NOTE_HSL.map(
  ([h, s, l]) => hslToRgb(h / 360, s / 100, l / 100)
);

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
