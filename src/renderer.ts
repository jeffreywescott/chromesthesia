/**
 * Canvas renderer for the chromesthesia visualizer.
 *
 * Visual model: each active pitch class floods a large color field inward
 * from its canvas region. Multiple simultaneous notes (chords) each occupy
 * different spatial regions and blend where they meet.
 *
 * Spatial layout: circle of fifths — harmonically related notes (e.g. C, E, G
 * in a major chord) are spread ~120° apart so chord colors each get their own
 * canvas territory rather than all piling into the same spot.
 *
 * Each frame:
 *   1. Semi-transparent black fade (ambient color persistence)
 *   2. source-over blobs, quietest first (loudest note wins overlapping regions)
 */

import { NOTE_RGB } from './colors.js';

const ENERGY_THRESHOLD = 0.30;
const BASE_RADIUS_FACTOR = 0.82;   // blob radius as fraction of min(W,H)
const ORBIT_RADIUS_FACTOR = 0.42;  // anchor distance from center as fraction of min(W,H)
const FADE_ALPHA = 0.07;           // black overlay per frame — lower = longer color persistence
const SMOOTH = 0.08;               // exponential smoothing factor (lower = slower/dreamier)

/**
 * Circle of fifths position for each chromatic note index (0 = C).
 * FIFTHS_POSITION[i] gives the angular slot (0–11) for note i.
 *
 * Order around the ring: C G D A E B F# C# G# D# A# F
 * This means a C major chord (C=0, E=4, G=4) lands at slots 0, 4, 1 —
 * spread roughly 120° apart — so each chord color gets its own canvas region.
 */
const FIFTHS_POSITION = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

interface BlobState {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

const blobStates: BlobState[] = Array.from({ length: 12 }, () => ({
  x: 0, y: 0, radius: 0, opacity: 0,
}));

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let initialized = false;

export function initRenderer(canvasEl: HTMLCanvasElement): void {
  canvas = canvasEl;
  ctx = canvas.getContext('2d')!;
  handleResize();
  window.addEventListener('resize', handleResize);
}

function handleResize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initialized = false; // force black fill on next frame
}

export function drawFrame(energies: number[]): void {
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const minDim = Math.min(W, H);
  const baseRadius = minDim * BASE_RADIUS_FACTOR;
  const orbitR = minDim * ORBIT_RADIUS_FACTOR;

  // On first frame after resize, fill solid black
  if (!initialized) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    initialized = true;
  }

  // --- Trail fade: draw semi-transparent black to let previous frame decay ---
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(0, 0, 0, ${FADE_ALPHA})`;
  ctx.fillRect(0, 0, W, H);

  // --- Update blob states ---
  for (let i = 0; i < 12; i++) {
    const energy = energies[i];
    const slot = FIFTHS_POSITION[i];
    const angle = (slot / 12) * Math.PI * 2 - Math.PI / 2;

    const targetX = cx + Math.cos(angle) * orbitR;
    const targetY = cy + Math.sin(angle) * orbitR;
    // Size is the primary response to amplitude
    const targetR = baseRadius * (0.55 + energy * 0.45);
    // Opacity is moderate and fairly stable once above threshold
    const targetOpacity = energy > ENERGY_THRESHOLD ? 0.15 + energy * 0.50 : 0;

    const blob = blobStates[i];
    blob.x += (targetX - blob.x) * SMOOTH;
    blob.y += (targetY - blob.y) * SMOOTH;
    blob.radius += (targetR - blob.radius) * SMOOTH;
    blob.opacity += (targetOpacity - blob.opacity) * SMOOTH;
  }

  // --- Draw blobs: quietest first so loudest note wins overlapping regions ---
  const order = [...Array(12).keys()].sort((a, b) => energies[a] - energies[b]);

  ctx.globalCompositeOperation = 'source-over';

  for (const i of order) {
    const blob = blobStates[i];
    if (blob.opacity < 0.005) continue;

    const [r, g, b] = NOTE_RGB[i];
    const gradient = ctx.createRadialGradient(
      blob.x, blob.y, 0,
      blob.x, blob.y, blob.radius,
    );
    gradient.addColorStop(0,   `rgba(${r}, ${g}, ${b}, ${blob.opacity})`);
    gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${blob.opacity * 0.55})`);
    gradient.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}
