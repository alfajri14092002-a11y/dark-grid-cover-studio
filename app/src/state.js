// Dark Grid Cover Studio — shared state: samples, grades, layouts, defaults.
// Everything here is plain data; the renderer and the editor both read from it.

export const SAMPLES = [
  { id: 'beach', label: 'Sunset Beach', file: 'samples/beach.jpg' },
  { id: 'car', label: 'Orange Chase', file: 'samples/car.jpg' },
  { id: 'boardwalk', label: 'Neon Boardwalk', file: 'samples/boardwalk.jpg' },
  { id: 'pier', label: 'Pier Day', file: 'samples/pier.jpg' },
  { id: 'street', label: 'Deco Street', file: 'samples/street.jpg' },
];

// Four dark grades. `filter` is a canvas 2d filter string applied per panel;
// `wash` is a two-stop vertical tint laid over the whole cover at low alpha.
export const GRADES = {
  midnight: {
    label: 'Midnight',
    filter: 'saturate(0.85) contrast(1.12) brightness(0.92) hue-rotate(14deg)',
    wash: ['rgba(38, 28, 96, 0.20)', 'rgba(8, 8, 20, 0.26)'],
  },
  ember: {
    label: 'Ember',
    filter: 'saturate(1.28) contrast(1.07) brightness(1.01) sepia(0.30) hue-rotate(-14deg)',
    wash: ['rgba(120, 40, 8, 0.14)', 'rgba(20, 6, 2, 0.22)'],
  },
  neon: {
    label: 'Neon',
    filter: 'saturate(1.65) contrast(1.20) brightness(1.03)',
    wash: ['rgba(0, 90, 90, 0.16)', 'rgba(40, 4, 60, 0.20)'],
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.28) brightness(0.96)',
    wash: ['rgba(10, 10, 14, 0.18)', 'rgba(0, 0, 0, 0.30)'],
  },
};

// Three panel arrangements. `band` is the fraction of the height the title
// band takes at the bottom. Geometry is computed in paint.js from these.
export const LAYOUTS = {
  portrait: { label: 'Hero Top', band: 0.24 },
  wide: { label: 'Three Column', band: 0.27 },
  square: { label: 'Hero Left', band: 0.24 },
};

export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Landscape · 1920 × 1080', w: 1920, h: 1080 },
];

export const PANEL_NAMES = ['Hero', 'Panel 1', 'Panel 2', 'Panel 3', 'Panel 4'];

// The default five photos: hero is the car, the rest fill the small panels.
const DEFAULT_PHOTOS = ['car', 'beach', 'boardwalk', 'pier', 'street'];

export function freshState() {
  return {
    layout: 'portrait',
    grade: 'ember',
    size: '1080x1350',
    kicker: 'DARK GRID',
    title: 'MIDNIGHT RUN',
    subtitle: 'EVERY STREET IS A STAGE',
    panels: DEFAULT_PHOTOS.map((src) => ({ src, zoom: 1, ox: 0, oy: 0 })),
  };
}

// Resolve a panel source to a URL the browser can load: a sample id becomes
// its file path, anything else is already a data: URL from an upload.
export function panelUrl(panel) {
  const hit = SAMPLES.find((s) => s.id === panel.src);
  return hit ? hit.file : panel.src;
}
