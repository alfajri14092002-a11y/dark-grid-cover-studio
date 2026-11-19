// Dark Grid Cover Studio — screenshot scenes. ?shot=editor shows the editor
// with a sample loaded; ?shot=cover renders the cover alone, full-bleed.
// Query params: photo (sample id for all panels), layout, grade, size,
// kicker, title, subtitle. Sets window.__shotReady once painted.

import { SAMPLES, GRADES, LAYOUTS, EXPORT_SIZES } from './state.js';
import { paintCover, loadImages } from './paint.js';

function readParams(state) {
  const q = new URLSearchParams(location.search);
  const photo = q.get('photo');
  if (photo && SAMPLES.some((s) => s.id === photo)) {
    state.panels.forEach((p) => { p.src = photo; p.zoom = 1; p.ox = 0; p.oy = 0; });
  }
  const layout = q.get('layout');
  if (layout && LAYOUTS[layout]) state.layout = layout;
  const grade = q.get('grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const size = q.get('size');
  if (size && EXPORT_SIZES.some((s) => s.id === size)) state.size = size;
  for (const key of ['kicker', 'title', 'subtitle']) {
    const v = q.get(key);
    if (v != null) state[key] = v;
  }
}

export async function runShotScene(state, editor) {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (!shot) return false;
  readParams(state);
  if (shot === 'cover') {
    document.body.classList.add('cover-only');
    const canvas = document.querySelector('#preview');
    const size = EXPORT_SIZES.find((s) => s.id === state.size) || EXPORT_SIZES[1];
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.objectFit = 'contain';
    const images = await loadImages(state);
    paintCover(canvas.getContext('2d'), size.w, size.h, state, images);
    window.__shotReady = true;
    return true;
  }
  // editor scene: repaint with the params applied, then signal ready
  await editor.repaint();
  window.__shotReady = true;
  return true;
}
