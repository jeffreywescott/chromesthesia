# Chromesthesia

A real-time sound-to-color synesthesia visualizer. Listens to your microphone, extracts pitch class energies via FFT, and floods the canvas with colors corresponding to the notes being played.

## How it works

1. **Audio**: `getUserMedia` → `AnalyserNode` (FFT size 4096, smoothing 0.75)
2. **Pitch extraction**: FFT bins are mapped to pitch classes (C–B) via equal temperament. Each frame, amplitudes are averaged per pitch class, normalized relative to the loudest note, and shaped with a contrast curve (^3) to suppress overtones.
3. **Rendering**: Each of the 12 pitch classes is positioned on a circle-of-fifths layout. Active notes render as large radial gradient blobs. The canvas fades to black each frame for color persistence / trailing.

## Color mapping

Notes are mapped to hues around the color wheel using the circle of fifths — harmonically related notes (e.g. C, E, G in a major chord) land ~120° apart spatially so each chord color gets its own canvas region.

## Stack

- TypeScript, Web Audio API, Canvas 2D
- Vite (dev server + bundler)

## Usage

```
npm install
npm run dev
```

Open the local URL, click the overlay to grant mic access, then play or sing something.
