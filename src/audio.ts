/**
 * Audio capture and pitch class energy extraction.
 *
 * Pipeline:
 *   getUserMedia → MediaStreamSourceNode → AnalyserNode → FFT
 *   FFT bins → pitch class (0–11) via equal temperament mapping
 */

const FFT_SIZE = 4096;
const MIN_FREQ = 55;    // A1 — below this we ignore (mostly noise/rumble)
const MAX_FREQ = 4200;  // C8ish — above this pitch perception fades

let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array<ArrayBuffer> | null = null;
let sampleRate = 44100;

export async function initAudio(audioContext: AudioContext): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  const source = audioContext.createMediaStreamSource(stream);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0.75;

  source.connect(analyser);
  // Do NOT connect to destination — we don't want to hear ourselves

  dataArray = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
  sampleRate = audioContext.sampleRate;
}

/**
 * Returns normalized energy (0–1) for each of the 12 pitch classes.
 * Index 0 = C, 1 = C#, ..., 11 = B.
 */
export function getPitchClassEnergies(): number[] {
  const energies = new Array<number>(12).fill(0);
  const counts = new Array<number>(12).fill(0);

  if (!analyser || !dataArray) return energies;

  analyser.getByteFrequencyData(dataArray);

  const binCount = analyser.frequencyBinCount;
  const nyquist = sampleRate / 2;

  for (let i = 1; i < binCount; i++) {
    const freq = (i / binCount) * nyquist;
    if (freq < MIN_FREQ || freq > MAX_FREQ) continue;

    // Map frequency to pitch class via equal temperament
    // semitones from A4 (440 Hz): n = 12 * log2(freq / 440)
    const semitones = 12 * Math.log2(freq / 440);
    // pitch class: semitones mod 12, shifted so C=0
    // A4 = 9 semitones above C4, so C = semitone 0 when we offset by 9
    const pc = ((Math.round(semitones) + 9) % 12 + 12) % 12;

    energies[pc] += dataArray[i];
    counts[pc] += 1;
  }

  const SILENCE_FLOOR = 0.08;
  const CONTRAST = 2.0;

  // Step 1: average raw amplitudes per pitch class
  const avg = new Array<number>(12).fill(0);
  for (let i = 0; i < 12; i++) {
    avg[i] = counts[i] > 0 ? energies[i] / counts[i] : 0;
  }

  // Step 2: find loudest pitch class this frame
  const max = Math.max(...avg);

  // Step 3: silence gate — if nothing is loud enough, return zeros
  if (max < SILENCE_FLOOR * 255) {
    return energies; // already all zeros
  }

  // Step 4–5: relative normalization + contrast curve
  for (let i = 0; i < 12; i++) {
    const norm = avg[i] / max;        // loudest note = 1.0
    energies[i] = norm ** CONTRAST;   // power curve crushes low values
  }

  return energies;
}
