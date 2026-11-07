// Photo299 - strumenti, pattern di pennello e strumento testo
'use strict';

P.colors = { fg: '#000000', bg: '#ffffff' };

P.BRUSH_PATTERNS = [
  { id: 'round', label: 'Tondo' },
  { id: 'soft', label: 'Aerografo' },
  { id: 'square', label: 'Quadrato' },
  { id: 'calligraphy', label: 'Calligrafico' },
  { id: 'spray', label: 'Spray' },
  { id: 'chalk', label: 'Gesso' },
  { id: 'star', label: 'Stella' },
  { id: 'pixel', label: 'Pixel' }
];

P.FONTS = [
  'Segoe UI, sans-serif',
  'Arial, sans-serif',
  'Impact, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
  'Comic Sans MS, cursive'
];

P.settings = {
  brush: { size: 22, hardness: 85, opacity: 100, pattern: 'round' },
  eraser: { size: 40, hardness: 90, opacity: 100, pattern: 'round' },
  text: { font: 'Segoe UI, sans-serif', size: 54, bold: true, italic: false, align: 'left', strokeWidth: 0, strokeColor: '#000000' },
  tolerance: 32,
  contiguous: true,
  selMode: 'new',
  autoSelect: true
};

const ICONS = {
  move: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3"/></svg>',
  rect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 2"><rect x="4" y="5" width="16" height="14"/></svg>',
  ellipse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 2"><ellipse cx="12" cy="12" rx="9" ry="7"/></svg>',
  lasso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 17c-3-1-5-4-4-7 1-4 7-6 12-5s7 4 6 7-6 5-10 4"/><path d="M7 17c0 2 1 4 3 4"/><circle cx="8" cy="16" r="1.5"/></svg>',
  wand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20L15 9"/><path d="M17 3v3M17 12v3M13 7h-3M23 7h-3M14.5 4.5l-1.5-1.5M21 11l-1.5-1.5M19.5 4.5L21 3"/></svg>',
  crop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 2v16h16"/><path d="M2 6h16v16"/></svg>',
  brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18.5 2.5a2.1 2.1 0 013 3L11 16l-4-4z"/><path d="M7 12c-2 0-4 1.5-4 4 0 1.5-1 3-2 3 2 2 5 2 7 1s3-3 3-4z"/></svg>',
  eraser: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M16 3l5 5-11 11H5l-3-3z"/><path d="M9 10l5 5M5 19h15"/></svg>',
  magic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M14 5l5 5-9 9H6l-3-3z"/><path d="M19 2v3M17.5 3.5h3M22 7l-1 1"/></svg>',
  bucket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M10 3l8 8-7 7-8-8z"/><path d="M3 10h15"/><path d="M20 14s2 3 2 4.5a2 2 0 01-4 0c0-1.5 2-4.5 2-4.5z"/></svg>',
  text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M12 4v16"/><path d="M8 20h8"/></svg>',
  picker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l6 6M17 7l3-3a1.4 1.4 0 00-3-3l-3 3"/><path d="M15 9L5 19l-2 2 2-2v-3L13 7"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V5a1.5 1.5 0 013 0v6M11 11V3.5a1.5 1.5 0 013 0V11M14 11V5a1.5 1.5 0 013 0v7M17 9a1.5 1.5 0 013 0v5a8 8 0 01-8 8h-1a7 7 0 01-6-3l-3-5a1.5 1.5 0 012.5-1.6L8 15"/></svg>',
  zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10" cy="10" r="7"/><path d="M15 15l6 6M7 10h6M10 7v6"/></svg>'
};

// ---- Riempimento a macchia (usato da bacchetta, gomma magica, secchiello) ----
P.floodMask = function (img, w, h, sx, sy, tol, contiguous) {
  const d = img.data, mask = new Uint8Array(w * h);
  sx = Math.floor(sx); sy = Math.floor(sy);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return mask;
  const i0 = (sy * w + sx) * 4;
  const tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2], ta = d[i0 + 3];
  const match = p => {
    const j = p * 4, a = d[j + 3];
    if (ta === 0 && a === 0) return true;
    return Math.abs(d[j] - tr) <= tol && Math.abs(d[j + 1] - tg) <= tol && Math.abs(d[j + 2] - tb) <= tol && Math.abs(a - ta) <= tol;
  };
  if (!contiguous) { for (let p = 0; p < w * h; p++) if (match(p)) mask[p] = 1; return mask; }
  const stack = [sx, sy];
  while (stack.length) {
    const y = stack.pop(), x0 = stack.pop();
    let x = x0;
    while (x >= 0 && !mask[y * w + x] && match(y * w + x)) x--;
    x++;
    let up = false, down = false;
    while (x < w && !mask[y * w + x] && match(y * w + x)) {
      mask[y * w + x] = 1;
      if (y > 0) { const m = !mask[(y - 1) * w + x] && match((y - 1) * w + x); if (m && !up) { stack.push(x, y - 1); up = true; } else if (!m) up = false; }
      if (y < h - 1) { const m = !mask[(y + 1) * w + x] && match((y + 1) * w + x); if (m && !down) { stack.push(x, y + 1); down = true; } else if (!m) down = false; }
      x++;
    }
  }
  return mask;
};

function selModeFromEvent(e) {
  if (e.shiftKey && e.altKey) return 'intersect';
  if (e.shiftKey) return 'add';
  if (e.altKey) return 'sub';
  return P.settings.selMode;
}

function selMaskData() {
  if (!P.sel.active) return null;
  const m = P.sel.mask; return m.getContext('2d').getImageData(0, 0, m.width, m.height).data;
}

function requireLayer() {
  const l = P.Doc.active();
  if (!l) return null;
  if (!l.visible) { P.util.toast('Il livello attivo è nascosto'); return null; }
  return l;
}

// ---- Generatore di punte e pattern del pennello ----
const dabCache = new Map();

function buildStarPath(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
}

function getDab(size, hardness, color, pattern = 'round') {
  // Per spray e gesso non usiamo cache statica perché hanno texture stocastica viva
  const dynamic = pattern === 'spray' || pattern === 'chalk';
  const key = `${size}|${hardness}|${color}|${pattern}`;
  if (!dynamic && dabCache.has(key)) return dabCache.get(key);
  if (dabCache.size > 240) dabCache.clear();

  const d = Math.max(1, Math.ceil(size));
  const c = P.util.makeCanvas(d, d);
  const ctx = c.getContext('2d');
  const r = size / 2;
  const cx = d / 2, cy = d / 2;
  const { r: R, g: G, b: B } = P.util.hexToRgb(color);

  if (pattern === 'pixel') {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, d, d);
  } else if (pattern === 'square') {
    ctx.fillStyle = color;
    if (hardness >= 95 || size <= 3) {
      ctx.fillRect(0, 0, d, d);
    } else {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * Math.SQRT2);
      g.addColorStop(0, `rgba(${R},${G},${B},1)`);
      g.addColorStop(Math.min(0.95, hardness / 100), `rgba(${R},${G},${B},1)`);
      g.addColorStop(1, `rgba(${R},${G},${B},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, d, d);
    }
  } else if (pattern === 'calligraphy') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4); // angolo penna calligrafica 45°
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(1, r), Math.max(0.8, r * 0.24), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (pattern === 'star') {
    ctx.fillStyle = color;
    buildStarPath(ctx, cx, cy, 5, Math.max(1, r), Math.max(0.5, r * 0.45));
    ctx.fill();
  } else if (pattern === 'spray') {
    ctx.fillStyle = color;
    const count = Math.max(8, Math.round(size * size * 0.16));
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.7) * r;
      const px = cx + Math.cos(ang) * dist;
      const py = cy + Math.sin(ang) * dist;
      ctx.fillRect(px, py, 1.3, 1.3);
    }
  } else if (pattern === 'chalk') {
    const img = ctx.createImageData(d, d);
    const data = img.data;
    for (let y = 0; y < d; y++) {
      for (let x = 0; x < d; x++) {
        const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (dist <= r) {
          const edge = 1 - Math.pow(dist / Math.max(1, r), 1.8);
          if (Math.random() < edge * 0.72) {
            const idx = (y * d + x) * 4;
            data[idx] = R; data[idx + 1] = G; data[idx + 2] = B;
            data[idx + 3] = Math.round(255 * (0.45 + Math.random() * 0.55));
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  } else if (pattern === 'soft') {
    // Aerografo molto morbido
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${R},${G},${B},0.55)`);
    g.addColorStop(0.4, `rgba(${R},${G},${B},0.22)`);
    g.addColorStop(1, `rgba(${R},${G},${B},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, d, d);
  } else {
    // 'round' (default)
    if (hardness >= 99 || size <= 2) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
    } else {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${R},${G},${B},1)`);
      g.addColorStop(Math.min(0.99, hardness / 100), `rgba(${R},${G},${B},1)`);
      g.addColorStop(1, `rgba(${R},${G},${B},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, d, d);
    }
  }

  if (!dynamic) dabCache.set(key, c);
  return c;
}

// ---- Pennello e Gomma ----
function makePaintTool(id, name, key, mode) {
  return {
    id, name, key, icon: ICONS[mode === 'erase' ? 'eraser' : 'brush'], cursor: 'none',
    get opts() { return mode === 'erase' ? P.settings.eraser : P.settings.brush; },
    stroke: null, last: null, lastEnd: null, rest: 0,
    dab(x, y, pressure) {
      const o = this.opts;
      const size = Math.max(1, Math.round(o.size * pressure));
      const pat = o.pattern || 'round';
      const img = getDab(size, o.hardness, mode === 'erase' ? '#000000' : P.colors.fg, pat);
      const ctx = this.stroke.getContext('2d');
      const px = pat === 'pixel' ? Math.floor(x - img.width / 2) : (x - img.width / 2);
      const py = pat === 'pixel' ? Math.floor(y - img.height / 2) : (y - img.height / 2);
      ctx.drawImage(img, px, py);
      if (P.sel.active) {
        const bx = Math.max(0, Math.floor(px) - 2), by = Math.max(0, Math.floor(py) - 2);
        const bw = Math.min(this.stroke.width - bx, img.width + 4), bh = Math.min(this.stroke.height - by, img.height + 4);
        if (bw > 0 && bh > 0) {
          ctx.globalCompositeOperation = 'destination-in';
          ctx.drawImage(P.sel.mask, bx, by, bw, bh, bx, by, bw, bh);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    },
    segment(a, b, pressure) {
      const pat = this.opts.pattern || 'round';
      const spacingFactor = pat === 'calligraphy' ? 0.06 : pat === 'pixel' ? 0.25 : 0.1;
      const step = Math.max(0.5, this.opts.size * pressure * spacingFactor);
      const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
      if (dist <= 0.001) return;
      let t = step - this.rest;
      while (t <= dist) {
        this.dab(a.x + dx * t / dist, a.y + dy * t / dist, pressure);
        t += step;
      }
      this.rest = dist - (t - step);
    },
    pressure(e) {
      return (e && e.pointerType === 'pen' && e.pressure > 0) ? Math.max(0.08, e.pressure) : 1;
    },
    down(pt, e) {
      const layer = requireLayer(); if (!layer) return;
      // Se era un livello di testo e ci si dipinge sopra, diventa livello raster normale
      if (layer.textData) layer.textData = null;
      const d = P.doc;
      this.layer = layer;
      this.stroke = P.util.makeCanvas(d.width, d.height);
      this.rest = 0;
      const pr = this.pressure(e);
      if (e && e.shiftKey && this.lastEnd) {
        this.dab(this.lastEnd.x, this.lastEnd.y, pr);
        this.segment(this.lastEnd, pt, pr);
      } else {
        this.dab(pt.x, pt.y, pr);
      }
      this.last = { x: pt.x, y: pt.y };
      const alpha = this.opts.opacity / 100;
      P.render.override = {
        layerId: layer.id,
        draw: ctx => {
          ctx.drawImage(layer.canvas, 0, 0);
          ctx.globalAlpha = alpha;
          ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
          ctx.drawImage(this.stroke, 0, 0);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
      };
      P.render.requestContent();
    },
    move(pt, e) {
      P.render.request();
      if (!this.stroke || !this.last) return;
      const pr = this.pressure(e);
      let pts = [pt];
      if (e && typeof e.getCoalescedEvents === 'function') {
        const coalesced = e.getCoalescedEvents();
        if (coalesced && coalesced.length > 1) {
          pts = coalesced.map(ev => P.view.eventToDoc(ev));
        }
      }
      for (const p of pts) {
        this.segment(this.last, p, pr);
        this.last = { x: p.x, y: p.y };
      }
      P.render.requestContent();
    },
    up(pt) {
      if (!this.stroke) return;
      const ctx = this.layer.canvas.getContext('2d');
      ctx.globalAlpha = this.opts.opacity / 100;
      ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
      ctx.drawImage(this.stroke, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      P.Doc.markDirty(this.layer);
      this.stroke = null;
      this.last = null;
      P.render.override = null;
      if (pt) this.lastEnd = { x: pt.x, y: pt.y };
      P.history.commit(mode === 'erase' ? 'Gomma' : 'Pennello');
    },
    cancel() {
      if (this.stroke) {
        this.stroke = null;
        this.last = null;
        P.render.override = null;
        P.render.requestContent();
      }
    },
    overlay(ctx) {
      const pt = P.view.mouseDoc; if (!pt || !P.view.mouseIn) return;
      const p = P.view.docToScreen(pt);
      const r = Math.max(1, this.opts.size * P.view.zoom / 2);
      const pat = this.opts.pattern || 'round';
      ctx.save();
      ctx.beginPath();
      if (pat === 'square' || pat === 'pixel') {
        ctx.rect(p.x - r, p.y - r, r * 2, r * 2);
      } else if (pat === 'calligraphy') {
        ctx.translate(p.x, p.y);
        ctx.rotate(-Math.PI / 4);
        ctx.ellipse(0, 0, r, Math.max(1, r * 0.24), 0, 0, Math.PI * 2);
      } else {
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      }
      ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
      if (r < 4) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.beginPath();
        ctx.moveTo(p.x - 5, p.y); ctx.lineTo(p.x + 5, p.y);
        ctx.moveTo(p.x, p.y - 5); ctx.lineTo(p.x, p.y + 5);
        ctx.stroke();
        ctx.restore();
      }
    }
  };
}

// ---- Strumenti di selezione a forma ----
function makeShapeSelectTool(id, name, key, type, icon) {
  return {
    id, name, key, icon, cursor: 'crosshair',
    start: null, cur: null, pts: null, mode: 'new', downScreen: null,
    down(pt, e) {
      this.mode = selModeFromEvent(e);
      this.start = pt; this.cur = pt; this.pts = [pt];
      this.downScreen = { x: e.clientX, y: e.clientY };
    },
    constrained(e) {
      let b = this.cur;
      if (type !== 'lasso' && e && e.shiftKey && this.mode === 'new') {
        const s = Math.max(Math.abs(b.x - this.start.x), Math.abs(b.y - this.start.y));
        b = { x: this.start.x + Math.sign(b.x - this.start.x || 1) * s, y: this.start.y + Math.sign(b.y - this.start.y || 1) * s };
      }
      return b;
    },
    move(pt, e) {
      if (!this.start) return;
      this.cur = pt; this.lastE = e;
      if (type === 'lasso') this.pts.push(pt);
      P.render.request();
    },
    up(pt, e) {
      if (!this.start) return;
      this.cur = pt;
      const moved = Math.hypot(e.clientX - this.downScreen.x, e.clientY - this.downScreen.y) > 3;
      if (!moved || (type === 'lasso' && this.pts.length < 3)) {
        // Clic singolo senza trascinamento -> deseleziona immediatamente!
        P.sel.clear();
        P.util.status('Selezione annullata');
      } else {
        const shape = type === 'lasso' ? P.sel.shapeCanvas('poly', this.pts) : P.sel.shapeCanvas(type, [this.start, this.constrained(e)]);
        P.sel.apply(shape, this.mode);
      }
      this.start = null; this.pts = null;
      P.render.request();
    },
    cancel() { this.start = null; this.pts = null; P.render.request(); },
    overlay(ctx) {
      if (!this.start) return;
      const v = P.view;
      ctx.save();
      ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath();
      if (type === 'lasso') {
        this.pts.forEach((p, i) => { const s = v.docToScreen(p); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); });
      } else {
        const a = v.docToScreen(this.start), b = v.docToScreen(this.constrained(this.lastE));
        if (type === 'rect') ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y);
        else ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
      }
      ctx.strokeStyle = '#000'; ctx.stroke();
      ctx.lineDashOffset = 4; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.restore();
    }
  };
}

P.tools = {
  list: [],
  current: null,
  byId(id) { return this.list.find(t => t.id === id); },
  select(id) {
    const t = this.byId(id); if (!t) return;
    if (this.current && this.current.cancel) this.current.cancel();
    if (this.current && this.current.deactivate) this.current.deactivate();
    this.current = t;
    P.view.setCursor(t.cursor);
    P.ui.updateToolbar(); P.ui.updateOptions(); P.render.request();
  }
};

P.tools.list = [
  {
    id: 'move', name: 'Sposta e Seleziona Livelli', key: 'V', icon: ICONS.move, cursor: 'move',
    down(pt, e) {
      if (!P.doc) return;
      // Se non c'è una selezione pixel attiva, permette di selezionare i livelli cliccandoli sul canvas
      if (!P.sel.active && (e.ctrlKey || e.metaKey || P.settings.autoSelect)) {
        const hitLayer = P.Doc.layerAtPoint(pt.x, pt.y);
        if (hitLayer) {
          if (e.ctrlKey || e.metaKey) {
            P.Doc.selectLayer(hitLayer.id, { toggle: true });
            P.ui.updateLayers();
          } else if (!P.Doc.isSelected(hitLayer.id)) {
            P.Doc.selectLayer(hitLayer.id);
            P.ui.updateLayers();
          }
        }
      }
      if (!requireLayer()) return;
      P.transform.begin({ moveOnly: true });
      if (P.transform.active) P.transform.down(pt);
    },
    move() {}, up() {}
  },
  makeShapeSelectTool('rect', 'Selezione rettangolare', 'M', 'rect', ICONS.rect),
  makeShapeSelectTool('ellipse', 'Selezione ellittica', 'Shift+M', 'ellipse', ICONS.ellipse),
  makeShapeSelectTool('lasso', 'Lazo', 'L', 'lasso', ICONS.lasso),
  {
    id: 'wand', name: 'Bacchetta magica', key: 'W', icon: ICONS.wand, cursor: 'crosshair',
    down(pt, e) {
      const l = P.Doc.active(); if (!l) return;
      const d = P.doc;
      if (pt.x < 0 || pt.y < 0 || pt.x >= d.width || pt.y >= d.height) {
        P.sel.clear();
        return;
      }
      const img = l.canvas.getContext('2d').getImageData(0, 0, d.width, d.height);
      const m = P.floodMask(img, d.width, d.height, pt.x, pt.y, P.settings.tolerance, P.settings.contiguous);
      P.sel.apply(P.sel.fromMaskArray(m, d.width, d.height), selModeFromEvent(e));
    },
    move() {}, up() {}
  },
  {
    id: 'crop', name: 'Taglierina (ritaglia)', key: 'C', icon: ICONS.crop, cursor: 'crosshair',
    rect: null, start: null,
    down(pt) { this.start = { x: Math.round(pt.x), y: Math.round(pt.y) }; this.rect = null; },
    move(pt) {
      if (!this.start) return;
      const d = P.doc;
      const x1 = P.util.clamp(Math.round(pt.x), 0, d.width), y1 = P.util.clamp(Math.round(pt.y), 0, d.height);
      const x0 = P.util.clamp(this.start.x, 0, d.width), y0 = P.util.clamp(this.start.y, 0, d.height);
      this.rect = { x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) };
      P.render.request();
    },
    up() { this.start = null; if (this.rect && (this.rect.w < 2 || this.rect.h < 2)) this.rect = null; P.ui.updateOptions(); P.render.request(); },
    apply() { if (this.rect) { P.cmd.cropTo(this.rect); this.rect = null; P.ui.updateOptions(); } },
    cancel() { this.rect = null; this.start = null; P.ui.updateOptions(); P.render.request(); },
    deactivate() { this.cancel(); },
    overlay(ctx) {
      if (!this.rect) return;
      const v = P.view, r = this.rect;
      const a = v.docToScreen({ x: r.x, y: r.y }), b = v.docToScreen({ x: r.x + r.w, y: r.y + r.h });
      const o = v.docToScreen({ x: 0, y: 0 }), e = v.docToScreen({ x: P.doc.width, y: P.doc.height });
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.beginPath(); ctx.rect(o.x, o.y, e.x - o.x, e.y - o.y); ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y); ctx.fill('evenodd');
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(a.x + .5, a.y + .5, b.x - a.x, b.y - a.y);
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      for (let i = 1; i < 3; i++) {
        const x = a.x + (b.x - a.x) * i / 3, y = a.y + (b.y - a.y) * i / 3;
        ctx.beginPath(); ctx.moveTo(x, a.y); ctx.lineTo(x, b.y); ctx.moveTo(a.x, y); ctx.lineTo(b.x, y); ctx.stroke();
      }
      ctx.fillStyle = '#fff'; ctx.font = '11px Segoe UI, sans-serif';
      ctx.fillText(`${r.w} × ${r.h}  — Invio per applicare`, a.x + 4, a.y - 6);
      ctx.restore();
    }
  },
  { sep: true },
  makePaintTool('brush', 'Pennello', 'B', 'paint'),
  makePaintTool('eraser', 'Gomma', 'E', 'erase'),
  {
    id: 'magic', name: 'Gomma magica', key: 'Shift+E', icon: ICONS.magic, cursor: 'crosshair',
    down(pt) {
      const l = requireLayer(); if (!l) return;
      if (l.textData) l.textData = null;
      const d = P.doc, ctx = l.canvas.getContext('2d');
      const img = ctx.getImageData(0, 0, d.width, d.height);
      const m = P.floodMask(img, d.width, d.height, pt.x, pt.y, P.settings.tolerance, P.settings.contiguous);
      const sm = selMaskData();
      let n = 0;
      for (let p = 0; p < m.length; p++) if (m[p] && (!sm || sm[p * 4 + 3] > 127)) { img.data[p * 4 + 3] = 0; n++; }
      if (!n) return;
      ctx.putImageData(img, 0, 0);
      P.Doc.markDirty(l);
      P.history.commit('Gomma magica');
    },
    move() {}, up() {}
  },
  {
    id: 'bucket', name: 'Secchiello', key: 'G', icon: ICONS.bucket, cursor: 'crosshair',
    down(pt) {
      const l = requireLayer(); if (!l) return;
      if (l.textData) l.textData = null;
      const d = P.doc, ctx = l.canvas.getContext('2d');
      const img = ctx.getImageData(0, 0, d.width, d.height);
      const m = P.floodMask(img, d.width, d.height, pt.x, pt.y, P.settings.tolerance, P.settings.contiguous);
      const sm = selMaskData();
      const { r, g, b } = P.util.hexToRgb(P.colors.fg);
      let n = 0;
      for (let p = 0; p < m.length; p++) if (m[p] && (!sm || sm[p * 4 + 3] > 127)) { const j = p * 4; img.data[j] = r; img.data[j + 1] = g; img.data[j + 2] = b; img.data[j + 3] = 255; n++; }
      if (!n) return;
      ctx.putImageData(img, 0, 0);
      P.Doc.markDirty(l);
      P.history.commit('Secchiello');
    },
    move() {}, up() {}
  },
  {
    id: 'text', name: 'Testo', key: 'T', icon: ICONS.text, cursor: 'text',
    down(pt) {
      if (!P.doc) return;
      // Controlla se l'utente ha cliccato su un livello di testo esistente per modificarlo
      const hit = P.Doc.layerAtPoint(pt.x, pt.y);
      if (hit && hit.textData) {
        P.Doc.selectLayer(hit.id);
        P.ui.updateLayers();
        P.dialog.textEditor({ layer: hit });
      } else {
        P.dialog.textEditor({ x: Math.round(pt.x), y: Math.round(pt.y) });
      }
    },
    move() {}, up() {}
  },
  {
    id: 'picker', name: 'Contagocce', key: 'I', icon: ICONS.picker, cursor: 'crosshair',
    comp: null,
    sample(pt, e) {
      const d = P.doc; const x = Math.floor(pt.x), y = Math.floor(pt.y);
      if (x < 0 || y < 0 || x >= d.width || y >= d.height) return;
      const px = this.comp.getContext('2d').getImageData(x, y, 1, 1).data;
      if (px[3] === 0) return;
      const hex = P.util.rgbToHex(px[0], px[1], px[2]);
      if (e.altKey) P.colors.bg = hex; else P.colors.fg = hex;
      P.ui.updateColors();
    },
    down(pt, e) { this.comp = P.Doc.composite(); this.sample(pt, e); this.dragging = true; },
    move(pt, e) { if (this.dragging) this.sample(pt, e); },
    up() { this.dragging = false; this.comp = null; }
  },
  { sep: true },
  {
    id: 'hand', name: 'Mano', key: 'H', icon: ICONS.hand, cursor: 'grab',
    down() {}, move() {}, up() {}
  },
  {
    id: 'zoom', name: 'Zoom', key: 'Z', icon: ICONS.zoom, cursor: 'zoom-in',
    down(pt, e) { const s = P.view.docToScreen(pt); P.view.zoomAt(e.altKey ? 1 / 1.5 : 1.5, s.x, s.y); },
    move() {}, up() {}
  }
];
