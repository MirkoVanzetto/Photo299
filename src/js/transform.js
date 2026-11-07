// Photo299 - Trasformazione libera (Ctrl+T) e spostamento anche su più livelli selezionati
'use strict';

P.transform = {
  active: false,
  s: null,

  // opts: { moveOnly, source: {canvas,x,y}, label, onCancel, onCommit }
  begin(opts = {}) {
    if (this.active) return;
    const d = P.doc; if (!d) return;
    const activeLayer = P.Doc.active(); if (!activeLayer) return;

    let items = []; // [{ layer, src, base }]
    let x = 0, y = 0, sw = 0, sh = 0, fromSel = false;

    if (opts.source) {
      if (!activeLayer.visible) { P.util.toast('Il livello è nascosto'); return; }
      const src = opts.source.canvas;
      x = opts.source.x; y = opts.source.y; sw = src.width; sh = src.height;
      items.push({ layer: activeLayer, src, base: P.util.cloneCanvas(activeLayer.canvas) });
    } else if (P.sel.active) {
      const selLayers = P.Doc.selectedLayers().filter(l => l.visible);
      if (!selLayers.length) { P.util.toast('I livelli selezionati sono nascosti'); return; }
      const b = P.sel.bounds;
      x = b.x; y = b.y; sw = b.w; sh = b.h;
      fromSel = true;
      for (const l of selLayers) {
        const ex = P.sel.extract(l.canvas);
        const base = P.util.cloneCanvas(l.canvas);
        P.sel.clearFrom(base);
        items.push({ layer: l, src: ex.canvas, base });
      }
    } else {
      const selLayers = P.Doc.selectedLayers().filter(l => l.visible);
      if (!selLayers.length) { P.util.toast('I livelli selezionati sono nascosti'); return; }
      // Calcola il bounding box unione di tutti i livelli selezionati
      let minX = d.width, minY = d.height, maxX = -1, maxY = -1;
      for (const l of selLayers) {
        const b = P.util.contentBounds(l.canvas);
        if (b) {
          if (b.x < minX) minX = b.x;
          if (b.y < minY) minY = b.y;
          if (b.x + b.w > maxX) maxX = b.x + b.w;
          if (b.y + b.h > maxY) maxY = b.y + b.h;
        }
      }
      if (maxX < 0) { P.util.toast('I livelli selezionati sono vuoti'); return; }
      x = minX; y = minY; sw = maxX - minX; sh = maxY - minY;
      for (const l of selLayers) {
        const src = P.util.makeCanvas(sw, sh);
        src.getContext('2d').drawImage(l.canvas, -x, -y);
        const base = P.util.makeCanvas(l.canvas.width, l.canvas.height);
        items.push({ layer: l, src, base });
      }
    }

    this.s = {
      items, sw, sh, fromSel,
      cx: x + sw / 2, cy: y + sh / 2, w: sw, h: sh, angle: 0,
      origCx: x + sw / 2, origCy: y + sh / 2,
      moveOnly: !!opts.moveOnly,
      label: opts.label || (opts.moveOnly ? 'Sposta' : 'Trasformazione libera'),
      onCancel: opts.onCancel,
      onCommit: opts.onCommit,
      drag: null
    };
    this.active = true;
    const ovMap = new Map();
    for (const it of items) {
      ovMap.set(it.layer.id, ctx => this.drawItem(ctx, it));
    }
    P.render.overrides = ovMap;
    P.render.requestContent();
    P.ui.updateOptions();
  },

  drawItem(ctx, it) {
    const s = this.s;
    ctx.drawImage(it.base, 0, 0);
    ctx.save();
    ctx.translate(s.cx, s.cy);
    ctx.rotate(s.angle);
    ctx.scale(s.w / s.sw, s.h / s.sh);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(it.src, -s.sw / 2, -s.sh / 2);
    ctx.restore();
  },

  toLocal(pt, st = this.s) {
    const dx = pt.x - st.cx, dy = pt.y - st.cy, c = Math.cos(st.angle), s = Math.sin(st.angle);
    return { x: dx * c + dy * s, y: -dx * s + dy * c };
  },
  toWorld(lx, ly, st = this.s) {
    const c = Math.cos(st.angle), s = Math.sin(st.angle);
    return { x: st.cx + lx * c - ly * s, y: st.cy + lx * s + ly * c };
  },

  handles() {
    const s = this.s, out = [];
    for (const hy of [-1, 0, 1]) for (const hx of [-1, 0, 1]) {
      if (!hx && !hy) continue;
      out.push({ hx, hy, ...this.toWorld(hx * s.w / 2, hy * s.h / 2) });
    }
    return out;
  },

  hitTest(pt) {
    const s = this.s, z = P.view.zoom, tol = 9 / z;
    if (!s.moveOnly) {
      for (const h of this.handles()) if (Math.hypot(h.x - pt.x, h.y - pt.y) <= tol) return { type: 'scale', hx: h.hx, hy: h.hy };
    }
    const l = this.toLocal(pt);
    if (Math.abs(l.x) <= Math.abs(s.w) / 2 && Math.abs(l.y) <= Math.abs(s.h) / 2) return { type: 'move' };
    return s.moveOnly ? { type: 'move' } : { type: 'rotate' };
  },

  cursorFor(hit) {
    if (!hit) return 'default';
    if (hit.type === 'move') return 'move';
    if (hit.type === 'rotate') return 'alias';
    const s = this.s;
    let a = Math.atan2(hit.hy * s.h, hit.hx * s.w) + s.angle;
    a = ((a * 180 / Math.PI) % 180 + 180) % 180;
    if (a < 22.5 || a >= 157.5) return 'ew-resize';
    if (a < 67.5) return 'nwse-resize';
    if (a < 112.5) return 'ns-resize';
    return 'nesw-resize';
  },

  down(pt) {
    const s = this.s;
    const hit = this.hitTest(pt);
    s.drag = { ...hit, start: pt, st: { cx: s.cx, cy: s.cy, w: s.w, h: s.h, angle: s.angle } };
  },

  move(pt, e) {
    const s = this.s, d = s.drag;
    if (!d) { P.view.setCursor(this.cursorFor(this.hitTest(pt))); return; }
    const st = d.st;
    if (d.type === 'move') {
      let dx = pt.x - d.start.x, dy = pt.y - d.start.y;
      if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      s.cx = st.cx + dx; s.cy = st.cy + dy;
    } else if (d.type === 'rotate') {
      const a0 = Math.atan2(d.start.y - st.cy, d.start.x - st.cx);
      const a1 = Math.atan2(pt.y - st.cy, pt.x - st.cx);
      let a = st.angle + a1 - a0;
      if (e.shiftKey) { const step = Math.PI / 12; a = Math.round(a / step) * step; }
      s.angle = a;
    } else if (d.type === 'scale') {
      const { hx, hy } = d;
      const M = this.toLocal(pt, st);
      const A = { x: -hx * st.w / 2, y: -hy * st.h / 2 };
      let nw = hx ? (M.x - A.x) * hx : st.w;
      let nh = hy ? (M.y - A.y) * hy : st.h;
      const corner = hx && hy;
      if (corner && !e.shiftKey) {
        const sx = nw / st.w, sy = nh / st.h;
        const k = Math.abs(sx) > Math.abs(sy) ? sx : sy;
        nw = st.w * k; nh = st.h * k;
      }
      if (Math.abs(nw) < 1) nw = nw < 0 ? -1 : 1;
      if (Math.abs(nh) < 1) nh = nh < 0 ? -1 : 1;
      const ox = hx ? A.x + hx * nw / 2 : 0;
      const oy = hy ? A.y + hy * nh / 2 : 0;
      const c = Math.cos(st.angle), sn = Math.sin(st.angle);
      s.cx = st.cx + ox * c - oy * sn;
      s.cy = st.cy + ox * sn + oy * c;
      s.w = nw; s.h = nh;
    }
    P.render.requestContent();
    P.ui.updateTransformFields();
  },

  up() {
    if (!this.s) return;
    this.s.drag = null;
    if (this.s.moveOnly) this.commit();
  },

  setValues({ wPct, hPct, angleDeg }) {
    const s = this.s; if (!s) return;
    if (wPct != null) s.w = s.sw * wPct / 100 * Math.sign(s.w || 1);
    if (hPct != null) s.h = s.sh * hPct / 100 * Math.sign(s.h || 1);
    if (angleDeg != null) s.angle = angleDeg * Math.PI / 180;
    P.render.requestContent();
  },
  flip(axis) {
    const s = this.s; if (!s) return;
    if (axis === 'h') s.w = -s.w; else s.h = -s.h;
    P.render.requestContent();
  },
  rotateBy(deg) { const s = this.s; if (!s) return; s.angle += deg * Math.PI / 180; P.render.requestContent(); P.ui.updateTransformFields(); },

  commit() {
    const s = this.s; if (!s) return;
    const dx = s.cx - s.origCx, dy = s.cy - s.origCy;
    const changed = dx !== 0 || dy !== 0 || s.w !== s.sw || s.h !== s.sh || s.angle !== 0;
    if (!changed && !s.onCommit) { this.cancel(); return; }
    for (const it of s.items) {
      const c = P.util.makeCanvas(it.layer.canvas.width, it.layer.canvas.height);
      this.drawItem(c.getContext('2d'), it);
      it.layer.canvas = c;
      // Se è solo spostamento, aggiorna anche la posizione del testo modificabile
      if (it.layer.textData && !s.fromSel) {
        if (s.w === s.sw && s.h === s.sh && s.angle === 0) {
          it.layer.textData.x = Math.round(it.layer.textData.x + dx);
          it.layer.textData.y = Math.round(it.layer.textData.y + dy);
        } else {
          // Rasterizzato dopo rotazione/scala libera
          it.layer.textData = null;
        }
      }
      P.Doc.markDirty(it.layer);
    }
    if (s.fromSel) {
      if (s.moveOnly) P.sel.translate(dx, dy);
      else P.sel.clear(true);
    }
    const label = s.label, cb = s.onCommit;
    this.end();
    if (cb) cb();
    P.history.commit(label);
  },

  cancel() {
    const s = this.s; if (!s) return;
    const cb = s.onCancel;
    this.end();
    if (cb) cb();
    P.render.requestContent();
  },

  end() {
    this.active = false; this.s = null;
    P.render.override = null;
    P.render.overrides = null;
    P.render.requestContent();
    P.ui.updateOptions();
  },

  drawOverlay(ctx) {
    const s = this.s; if (!s) return;
    const v = P.view;
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => v.docToScreen(this.toWorld(a * s.w / 2, b * s.h / 2)));
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#3d8bfd';
    ctx.beginPath();
    corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath(); ctx.stroke();
    if (!s.moveOnly) {
      for (const h of this.handles()) {
        const p = v.docToScreen(h);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1f5fbf';
        ctx.fillRect(p.x - 4, p.y - 4, 8, 8); ctx.strokeRect(p.x - 4.5, p.y - 4.5, 9, 9);
      }
      const c = v.docToScreen({ x: s.cx, y: s.cy });
      ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI * 2); ctx.strokeStyle = '#fff'; ctx.stroke();
    }
    ctx.restore();
  }
};
