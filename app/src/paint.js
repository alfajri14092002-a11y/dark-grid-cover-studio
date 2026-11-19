// Dark Grid Cover Studio — canvas renderer. Draws one cover at any size from
// the editor state: five photo panels, a sunburst title band with a skyline
// silhouette, and the two badges. No external assets, no network.

import { GRADES, panelUrl } from './state.js';

const INK = '#0b0b14'; // near-black used for gutters, silhouettes and outlines
const PAPER = '#f5f1e8'; // warm off-white for the big title
const EMBER = '#ff7a1a';
const TEAL = '#1fc7bb';
const VIOLET = '#241a4d';

// Rectangles for the five panels plus the band, for a given layout and size.
// Returns { panels: [r0..r4], band: {x, y, w, h} }.
export function panelRects(layout, W, H) {
  const bandH = Math.round(H * (layout === 'wide' ? 0.27 : 0.24));
  const photoH = H - bandH;
  const g = Math.max(4, Math.round(W * 0.006)); // gutter
  const band = { x: 0, y: photoH, w: W, h: bandH };
  let panels;
  if (layout === 'portrait') {
    const heroH = Math.round(photoH * 0.60);
    const rowH = photoH - heroH - g;
    const cellW = Math.round((W - g) / 2);
    panels = [
      { x: 0, y: 0, w: W, h: heroH },
      { x: 0, y: heroH + g, w: cellW, h: rowH },
      { x: cellW + g, y: heroH + g, w: W - cellW - g, h: rowH },
      { x: 0, y: heroH + g, w: cellW, h: rowH }, // placeholder, replaced below
      { x: cellW + g, y: heroH + g, w: W - cellW - g, h: rowH },
    ];
    // bottom half is a 2x2 grid: two rows of two
    const row2H = Math.round((photoH - heroH - g) / 2);
    panels[1] = { x: 0, y: heroH + g, w: cellW, h: row2H };
    panels[2] = { x: cellW + g, y: heroH + g, w: W - cellW - g, h: row2H };
    panels[3] = { x: 0, y: heroH + g + row2H + g, w: cellW, h: photoH - heroH - g - row2H - g };
    panels[4] = { x: cellW + g, y: heroH + g + row2H + g, w: W - cellW - g, h: photoH - heroH - g - row2H - g };
  } else if (layout === 'wide') {
    const rightW = Math.round(W * 0.56);
    const leftW = W - rightW - g;
    const colW = Math.round((leftW - g) / 2);
    const cellH = Math.round((photoH - g) / 2);
    panels = [
      { x: leftW + g, y: 0, w: rightW, h: photoH },
      { x: 0, y: 0, w: colW, h: cellH },
      { x: colW + g, y: 0, w: leftW - colW - g, h: cellH },
      { x: 0, y: cellH + g, w: colW, h: photoH - cellH - g },
      { x: colW + g, y: cellH + g, w: leftW - colW - g, h: photoH - cellH - g },
    ];
  } else {
    // square: hero takes the left, four panels form a 2x2 on the right
    const heroW = Math.round(W * 0.56);
    const rightW = W - heroW - g;
    const cellW = Math.round((rightW - g) / 2);
    const cellH = Math.round((photoH - g) / 2);
    panels = [
      { x: 0, y: 0, w: heroW, h: photoH },
      { x: heroW + g, y: 0, w: cellW, h: cellH },
      { x: heroW + g + cellW + g, y: 0, w: rightW - cellW - g, h: cellH },
      { x: heroW + g, y: cellH + g, w: cellW, h: photoH - cellH - g },
      { x: heroW + g + cellW + g, y: cellH + g, w: rightW - cellW - g, h: photoH - cellH - g },
    ];
  }
  return { panels, band };
}

// Cover-fit a photo into a rect, honouring zoom and pan offsets (-1..1).
function drawPhoto(ctx, img, rect, panel) {
  const zoom = Math.max(0.5, panel.zoom || 1);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (panel.ox || 0) * rect.w * 0.25;
  const dy = rect.y + (rect.h - dh) / 2 + (panel.oy || 0) * rect.h * 0.25;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function fitFont(ctx, text, maxW, startPx, family) {
  let px = startPx;
  while (px > 12) {
    ctx.font = `900 ${px}px ${family}`;
    if (ctx.measureText(text).width <= maxW) break;
    px -= 2;
  }
  return px;
}

const CONDENSED = '"Arial Narrow", "Helvetica Neue", Impact, "Franklin Gothic Medium", sans-serif';

// Alternating sunburst rays fanning out from the bottom centre of the band.
function drawSunburst(ctx, band) {
  const cx = band.x + band.w / 2;
  const cy = band.y + band.h;
  const r = Math.max(band.w, band.h) * 1.05;
  const rays = 14;
  ctx.save();
  ctx.beginPath();
  ctx.rect(band.x, band.y, band.w, band.h);
  ctx.clip();
  for (let i = 0; i < rays; i++) {
    const a0 = Math.PI + (i * Math.PI) / rays;
    const a1 = Math.PI + ((i + 0.55) * Math.PI) / rays;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 122, 26, 0.30)' : 'rgba(255, 190, 60, 0.10)';
    ctx.fill();
  }
  ctx.restore();
}

// A dark city skyline with a few lit windows and two palm silhouettes,
// sitting on the bottom edge of the band.
function drawSkyline(ctx, band) {
  const base = band.y + band.h;
  const h = band.h * 0.16;
  ctx.save();
  ctx.fillStyle = INK;
  let x = band.x;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (x < band.x + band.w) {
    const bw = band.w * (0.05 + rnd() * 0.05);
    const bh = h * (0.35 + rnd() * 0.65);
    ctx.fillRect(x, base - bh, bw, bh);
    // a couple of lit windows
    if (rnd() > 0.45) {
      ctx.fillStyle = 'rgba(255, 190, 60, 0.9)';
      ctx.fillRect(x + bw * 0.3, base - bh * 0.7, Math.max(2, bw * 0.12), Math.max(2, bh * 0.12));
      ctx.fillStyle = INK;
    }
    x += bw + band.w * 0.008;
  }
  // palms: a bent trunk and a fan of fronds, drawn twice
  for (const px of [band.w * 0.06, band.w * 0.94]) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(2, band.h * 0.02);
    ctx.beginPath();
    ctx.moveTo(px, base);
    ctx.quadraticCurveTo(px + band.w * 0.01, base - h * 0.8, px + band.w * 0.02, base - h);
    ctx.stroke();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI * (0.15 + k * 0.17);
      ctx.beginPath();
      ctx.moveTo(px + band.w * 0.02, base - h);
      ctx.quadraticCurveTo(
        px + band.w * 0.02 + Math.cos(a) * h * 0.45,
        base - h + Math.sin(a) * h * 0.45,
        px + band.w * 0.02 + Math.cos(a) * h * 0.75,
        base - h + Math.sin(a) * h * 0.75 + h * 0.18,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPill(ctx, cx, cy, text, h) {
  ctx.font = `900 ${Math.round(h * 0.52)}px ${CONDENSED}`;
  const tw = ctx.measureText(text).width;
  const pad = h * 0.9;
  const w = tw + pad * 2;
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.save();
  ctx.fillStyle = VIOLET;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(1, h * 0.04);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd34d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', x + pad * 0.55, cy + h * 0.02);
  ctx.fillText('★', x + w - pad * 0.55, cy + h * 0.02);
  ctx.fillStyle = PAPER;
  ctx.fillText(text, cx, cy + h * 0.02);
  ctx.restore();
  return w;
}

// Twelve-point starburst with "EST. 2026" inside.
function drawStarburst(ctx, cx, cy, r, text) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const points = 12;
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.72;
    const a = (i * Math.PI) / points - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd34d';
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = `900 ${Math.round(r * 0.34)}px ${CONDENSED}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EST.', 0, -r * 0.16);
  ctx.fillText('2026', 0, r * 0.22);
  ctx.restore();
}

// Pink circle badge with "NEW" inside.
function drawNewBadge(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ff2e88';
  ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.strokeStyle = PAPER;
  ctx.stroke();
  ctx.fillStyle = PAPER;
  ctx.font = `900 ${Math.round(r * 0.62)}px ${CONDENSED}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NEW', 0, r * 0.03);
  ctx.restore();
}

// Load every distinct photo the state references (sample files or data: URLs)
// into a Map keyed by panel source string. Images are cached per URL.
const imageCache = new Map();

function loadOne(url) {
  if (imageCache.has(url)) return imageCache.get(url);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  imageCache.set(url, p);
  return p;
}

export async function loadImages(state) {
  const out = new Map();
  const jobs = state.panels.map(async (panel) => {
    const url = panelUrl(panel);
    const img = await loadOne(url);
    if (img) out.set(panel.src, img);
  });
  await Promise.all(jobs);
  return out;
}

// Paint the whole cover. `images` maps a panel source string to a loaded
// HTMLImageElement (or a data-URL image). Missing images get a dark gradient.
export function paintCover(ctx, W, H, state, images) {
  const grade = GRADES[state.grade] || GRADES.midnight;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  const { panels, band } = panelRects(state.layout, W, H);

  // Photo panels, each with its grade filter.
  panels.forEach((rect, i) => {
    const panel = state.panels[i];
    const img = images.get(panel.src);
    ctx.save();
    if (grade.filter) ctx.filter = grade.filter;
    if (img) drawPhoto(ctx, img, rect, panel);
    else {
      const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      g.addColorStop(0, '#1c1438');
      g.addColorStop(1, '#0b0b14');
      ctx.fillStyle = g;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = Math.max(1, W * 0.0015);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Grade wash over the photo area.
  const wash = ctx.createLinearGradient(0, 0, 0, band.y);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(1, grade.wash[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, band.y);

  // Title band: deep violet base, sunburst, skyline, then the lettering.
  const bandGrad = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  bandGrad.addColorStop(0, '#1d1340');
  bandGrad.addColorStop(0.55, '#2c1650');
  bandGrad.addColorStop(1, '#120a24');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  drawSunburst(ctx, band);
  drawSkyline(ctx, band);

  const pad = band.w * 0.03;
  const pillH = band.h * 0.20;
  drawPill(ctx, band.w / 2, band.y + band.h * 0.16, state.kicker || 'DARK GRID', pillH);

  const titlePx = fitFont(ctx, (state.title || '').toUpperCase(), band.w - pad * 2, band.h * 0.42, CONDENSED);
  ctx.font = `900 ${titlePx}px ${CONDENSED}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const titleY = band.y + band.h * 0.52;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, titlePx * 0.14);
  ctx.strokeText((state.title || '').toUpperCase(), band.w / 2, titleY);
  ctx.fillStyle = PAPER;
  ctx.fillText((state.title || '').toUpperCase(), band.w / 2, titleY);

  const subPx = fitFont(ctx, (state.subtitle || '').toUpperCase(), band.w - pad * 2, band.h * 0.13, CONDENSED);
  ctx.font = `900 ${subPx}px ${CONDENSED}`;
  ctx.fillStyle = TEAL;
  ctx.fillText((state.subtitle || '').toUpperCase(), band.w / 2, band.y + band.h * 0.80);

  // Badges: starburst on the hero panel, NEW on the last small panel.
  const hero = panels[0];
  const last = panels[4];
  const starR = Math.max(18, Math.min(hero.w, hero.h) * 0.13);
  drawStarburst(ctx, hero.x + hero.w - starR * 1.25, hero.y + starR * 1.25, starR, 'EST. 2026');
  const newR = Math.max(14, Math.min(last.w, last.h) * 0.16);
  drawNewBadge(ctx, last.x + last.w - newR * 1.3, last.y + last.h - newR * 1.3, newR);
}
