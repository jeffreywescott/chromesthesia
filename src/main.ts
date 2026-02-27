import { initAudio, getPitchClassEnergies } from './audio.js';
import { initRenderer, drawFrame } from './renderer.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLDivElement;

async function start(): Promise<void> {
  overlay.classList.add('hidden');
  const audioContext = new AudioContext();
  await initAudio(audioContext);
  initRenderer(canvas);
  requestAnimationFrame(loop);
}

function loop(): void {
  drawFrame(getPitchClassEnergies());
  requestAnimationFrame(loop);
}

overlay.addEventListener('click', () => {
  start().catch((err) => {
    console.error('Failed to start:', err);
    overlay.classList.remove('hidden');
    const p = overlay.querySelector('p');
    if (p) p.textContent = 'mic access denied — check browser permissions';
  });
});
