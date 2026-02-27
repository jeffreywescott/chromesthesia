export interface NoteEnergy {
  /** Pitch class index 0–11 (C, C#, D, D#, E, F, F#, G, G#, A, A#, B) */
  index: number;
  /** Normalized energy 0–1 */
  energy: number;
}
