// Dark Grid Cover Studio — the editor: builds the left control rail, wires
// every input to the state, and keeps the preview canvas painted. Dragging
// on a panel pans it, the wheel zooms it; export renders a full-size PNG.

import { SAMPLES, GRADES, LAYOUTS, EXPORT_SIZES, PANEL_NAMES, panelUrl } from './state.js';
import { paintCover, loadImages, panelRects } from './paint.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function sampleOptions(select, current) {
  select.innerHTML = '';
  for (const s of SAMPLES) {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.label;
    if (s.id === current) o.selected = true;
    select.appendChild(o);
  }
}

export function createEditor(root, state) {
  const rail = root.querySelector('#rail');
  const stage = root.querySelector('#stage');
  const preview = root.querySelector('#preview');
  const hint = root.querySelector('#hint');
  const pctx = preview.getContext('2d');
  let images = new Map();
  let hoverPanel = 0;

  async function repaint() {
    // In a cover-only screenshot scene the scene runner owns the canvas.
    if (document.body.classList.contains('cover-only')) return;
    images = await loadImages(state);
    if (document.body.classList.contains('cover-only')) return;
    const size = EXPORT_SIZES.find((s) => s.id === state.size) || EXPORT_SIZES[1];
    const scale = Math.min(1, 900 / Math.max(size.w, size.h));
    preview.width = Math.round(size.w * scale);
    preview.height = Math.round(size.h * scale);
    paintCover(pctx, preview.width, preview.height, state, images);
    preview.style.width = `${preview.width}px`;
    preview.style.height = `${preview.height}px`;
  }

  // ---- 1 · photos ---------------------------------------------------------
  const photos = el('section', 'block');
  photos.appendChild(el('h2', '', '1 · Photos'));
  const fillRow = el('div', 'row');
  const fillSel = el('select');
  fillSel.setAttribute('aria-label', 'Fill all panels with one photo');
  const fillOpt = document.createElement('option');
  fillOpt.value = '';
  fillOpt.textContent = 'Fill all panels with one photo…';
  fillSel.appendChild(fillOpt);
  for (const s of SAMPLES) {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.label;
    fillSel.appendChild(o);
  }
  fillSel.addEventListener('change', () => {
    if (!fillSel.value) return;
    state.panels.forEach((p) => { p.src = fillSel.value; p.zoom = 1; p.ox = 0; p.oy = 0; });
    buildPanelCards();
    repaint();
  });
  fillRow.appendChild(fillSel);
  const upAll = el('button', 'btn', 'Upload one photo for all');
  const upAllInput = document.createElement('input');
  upAllInput.type = 'file';
  upAllInput.accept = 'image/*';
  upAllInput.hidden = true;
  upAll.addEventListener('click', () => upAllInput.click());
  upAllInput.addEventListener('change', () => {
    const f = upAllInput.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      state.panels.forEach((p) => { p.src = r.result; p.zoom = 1; p.ox = 0; p.oy = 0; });
      buildPanelCards();
      repaint();
    };
    r.readAsDataURL(f);
  });
  fillRow.appendChild(upAll);
  fillRow.appendChild(upAllInput);
  photos.appendChild(fillRow);
  const cardList = el('div', 'cards');
  photos.appendChild(cardList);
  rail.appendChild(photos);

  function buildPanelCards() {
    cardList.innerHTML = '';
    state.panels.forEach((panel, i) => {
      const card = el('div', 'card');
      const thumb = el('div', 'thumb');
      const img = document.createElement('img');
      img.alt = PANEL_NAMES[i];
      img.src = panelUrl(panel);
      thumb.appendChild(img);
      thumb.appendChild(el('span', 'tag', PANEL_NAMES[i].toUpperCase()));
      card.appendChild(thumb);
      const ctrls = el('div', 'card-ctrls');
      const sel = el('select');
      sampleOptions(sel, SAMPLES.some((s) => s.id === panel.src) ? panel.src : '');
      const upOpt = document.createElement('option');
      upOpt.value = '';
      upOpt.textContent = panel.src.startsWith('data:') ? 'Uploaded photo' : 'Sample…';
      sel.prepend(upOpt);
      sel.addEventListener('change', () => {
        if (!sel.value) return;
        panel.src = sel.value;
        panel.zoom = 1; panel.ox = 0; panel.oy = 0;
        buildPanelCards();
        repaint();
      });
      ctrls.appendChild(sel);
      const up = el('button', 'btn small', 'Upload');
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.hidden = true;
      up.addEventListener('click', () => inp.click());
      inp.addEventListener('change', () => {
        const f = inp.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          panel.src = r.result;
          panel.zoom = 1; panel.ox = 0; panel.oy = 0;
          buildPanelCards();
          repaint();
        };
        r.readAsDataURL(f);
      });
      ctrls.appendChild(up);
      ctrls.appendChild(inp);
      const gradeSel = el('select');
      const gOpt = document.createElement('option');
      gOpt.value = '';
      gOpt.textContent = 'Grade: Global';
      gradeSel.appendChild(gOpt);
      for (const [id, g] of Object.entries(GRADES)) {
        const o = document.createElement('option');
        o.value = id;
        o.textContent = g.label;
        gradeSel.appendChild(o);
      }
      gradeSel.addEventListener('change', () => {
        if (!gradeSel.value) return;
        state.grade = gradeSel.value;
        buildGradeSwatches();
        repaint();
      });
      ctrls.appendChild(gradeSel);
      const zoomRow = el('label', 'zoom');
      zoomRow.appendChild(el('span', '', 'Zoom'));
      const zoom = document.createElement('input');
      zoom.type = 'range';
      zoom.min = '0.6';
      zoom.max = '2.4';
      zoom.step = '0.05';
      zoom.value = String(panel.zoom || 1);
      zoom.addEventListener('input', () => {
        panel.zoom = parseFloat(zoom.value);
        repaint();
      });
      zoomRow.appendChild(zoom);
      ctrls.appendChild(zoomRow);
      card.appendChild(ctrls);
      cardList.appendChild(card);
    });
  }

  // ---- 2 · caption --------------------------------------------------------
  const caption = el('section', 'block');
  caption.appendChild(el('h2', '', '2 · Caption'));
  for (const [key, label, max] of [['kicker', 'Kicker', 24], ['title', 'Title', 24], ['subtitle', 'Subtitle', 48]]) {
    const row = el('label', 'field');
    row.appendChild(el('span', '', label));
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = max;
    input.value = state[key];
    input.addEventListener('input', () => { state[key] = input.value; repaint(); });
    row.appendChild(input);
    caption.appendChild(row);
  }
  rail.appendChild(caption);

  // ---- 3 · layout ---------------------------------------------------------
  const layoutSec = el('section', 'block');
  layoutSec.appendChild(el('h2', '', '3 · Layout'));
  const layoutRow = el('div', 'seg');
  for (const [id, l] of Object.entries(LAYOUTS)) {
    const b = el('button', 'seg-btn' + (state.layout === id ? ' on' : ''), l.label);
    b.addEventListener('click', () => {
      state.layout = id;
      layoutRow.querySelectorAll('.seg-btn').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      repaint();
    });
    layoutRow.appendChild(b);
  }
  layoutSec.appendChild(layoutRow);
  rail.appendChild(layoutSec);

  // ---- 4 · grade ----------------------------------------------------------
  const gradeSec = el('section', 'block');
  gradeSec.appendChild(el('h2', '', '4 · Grade'));
  const gradeRow = el('div', 'swatches');
  function buildGradeSwatches() {
    gradeRow.innerHTML = '';
    for (const [id, g] of Object.entries(GRADES)) {
      const b = el('button', 'swatch' + (state.grade === id ? ' on' : ''), g.label);
      b.dataset.grade = id;
      b.addEventListener('click', () => {
        state.grade = id;
        buildGradeSwatches();
        repaint();
      });
      gradeRow.appendChild(b);
    }
  }
  gradeSec.appendChild(gradeRow);
  rail.appendChild(gradeSec);

  // ---- 5 · export ---------------------------------------------------------
  const exp = el('section', 'block');
  exp.appendChild(el('h2', '', '5 · Export'));
  const sizeSel = el('select');
  for (const s of EXPORT_SIZES) {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.label;
    if (s.id === state.size) o.selected = true;
    sizeSel.appendChild(o);
  }
  sizeSel.addEventListener('change', () => { state.size = sizeSel.value; repaint(); });
  exp.appendChild(sizeSel);
  const exportBtn = el('button', 'btn big', 'Export PNG');
  exportBtn.addEventListener('click', async () => {
    const size = EXPORT_SIZES.find((s) => s.id === state.size) || EXPORT_SIZES[1];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    paintCover(off.getContext('2d'), size.w, size.h, state, await loadImages(state));
    off.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `dark-grid-${(state.title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${size.id}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  });
  exp.appendChild(exportBtn);
  rail.appendChild(exp);

  // ---- preview interaction: drag to pan, wheel to zoom --------------------
  function panelAt(mx, my) {
    const r = preview.getBoundingClientRect();
    const x = (mx - r.left) * (preview.width / r.width);
    const y = (my - r.top) * (preview.height / r.height);
    const { panels, band } = panelRects(state.layout, preview.width, preview.height);
    if (y >= band.y) return -1;
    for (let i = 0; i < panels.length; i++) {
      const p = panels[i];
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
    }
    return -1;
  }

  let drag = null;
  preview.addEventListener('pointerdown', (e) => {
    const i = panelAt(e.clientX, e.clientY);
    if (i < 0) return;
    drag = { i, x: e.clientX, y: e.clientY, ox: state.panels[i].ox || 0, oy: state.panels[i].oy || 0 };
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    const i = panelAt(e.clientX, e.clientY);
    hoverPanel = i;
    hint.textContent = i >= 0
      ? `Panel: ${PANEL_NAMES[i]} — drag to pan · scroll to zoom · drop a photo here`
      : 'Pick a panel to pan and zoom it';
    if (!drag) return;
    const r = preview.getBoundingClientRect();
    const panel = state.panels[drag.i];
    panel.ox = Math.max(-1, Math.min(1, drag.ox + ((e.clientX - drag.x) / r.width) * 2));
    panel.oy = Math.max(-1, Math.min(1, drag.oy + ((e.clientY - drag.y) / r.height) * 2));
    repaint();
  });
  preview.addEventListener('pointerup', () => { drag = null; });
  preview.addEventListener('wheel', (e) => {
    const i = panelAt(e.clientX, e.clientY);
    if (i < 0) return;
    e.preventDefault();
    const panel = state.panels[i];
    panel.zoom = Math.max(0.6, Math.min(2.4, (panel.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.93)));
    buildPanelCards();
    repaint();
  }, { passive: false });

  // Drop a photo straight onto a panel.
  preview.addEventListener('dragover', (e) => e.preventDefault());
  preview.addEventListener('drop', (e) => {
    e.preventDefault();
    const i = panelAt(e.clientX, e.clientY);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (i < 0 || !f) return;
    const r = new FileReader();
    r.onload = () => {
      state.panels[i].src = r.result;
      state.panels[i].zoom = 1;
      state.panels[i].ox = 0;
      state.panels[i].oy = 0;
      buildPanelCards();
      repaint();
    };
    r.readAsDataURL(f);
  });

  buildPanelCards();
  buildGradeSwatches();
  repaint();
  return { repaint };
}
