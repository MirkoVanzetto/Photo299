// Photo299 - Trasformazione libera (Ctrl+T): sposta, scala, ruota, rifletti
'use strict';

P.transform = {
  active: false,
  s: null,

  // opts: { moveOnly, source: {canvas,x,y}, label, onCancel, onCommit }
  begin(opts = {}) {
    if (this.active) return;
    const layer = P.Doc.active(); if (!layer) return;
    if (!layer.visible && !opts.source) { P.util.toast('Il livello è nascosto'); return; }
    let src, x, y, base, fromSel = false;
    if (opts.source) {
      src = opts.source.canvas; x = opts.source.x; y = opts.source.y;
      base = P.util.cloneCanvas(layer.canvas);
    } else if (P.sel.active) {
      const ex = P.sel.extract(layer.canvas);
      src = ex.canvas; x = ex.x; y = ex.y;
      base = P.util.cloneCanvas(layer.canvas);
      P.sel.clearFrom(base);
      fromSel = true;
    } else {
      const b = P.util.contentBounds(layer.canvas);
      if (!b) { P.util.toast('Il livello è vuoto'); return; }
      src = P.util.makeCanvas(b.w, b.h);
      src.getContext('2d').drawImage(layer.canvas, -b.x, -b.y);
      x = b.x; y = b.y;
      base = P.util.makeCanvas(layer.canvas.width, layer.canvas.height);
    }
    const sw = src.width, sh = src.height;
    this.s = {
      layer, src, base, sw, sh, fromSel,
      cx: x + sw / 2, cy: y + sh / 2, w: sw, h: sh, angle: 0,
      origCx: x + sw / 2, origCy: y + sh / 2,
      moveOnly: !!opts.moveOnly, label: opts.label || (opts.moveOnly ? 'Sposta' : 'Trasformazione libera'),
      onCancel: opts.onCancel, onCommit: opts.onCommit, drag: null
    };
    this.active = true;
    P.render.override = { layerId: layer.id, draw: ctx => this.drawAll(ctx) };
    P.render.requestContent();
    P.ui.updateOptions();
  },

  drawTransformed(ctx) {
    const s = this.s;
    ctx.save();
    ctx.translate(s.cx, s.cy);
    ctx.rotate(s.angle);
    ctx.scale(s.w / s.sw, s.h / s.sh);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(s.src, -s.sw / 2, -s.sh / 2);
    ctx.restore();
  },

  drawAll(ctx) { ctx.drawImage(this.s.base, 0, 0); this.drawTransformed(ctx); },

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
    const s = this.s, z = P.view.zoom, tol = 8 / z;
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
      if (corner && !e.shiftKey) { // proporzionale di default (Maiusc = libero)
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
    const changed = s.cx !== s.origCx || s.cy !== s.origCy || s.w !== s.sw || s.h !== s.sh || s.angle !== 0;
    if (!changed && !s.onCommit) { this.cancel(); return; }
    const c = P.util.makeCanvas(s.layer.canvas.width, s.layer.canvas.height);
    this.drawAll(c.getContext('2d'));
    s.layer.canvas = c;
    P.Doc.markDirty(s.layer);
    if (s.fromSel) {
      if (s.moveOnly) P.sel.translate(s.cx - s.origCx, s.cy - s.origCy);
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
    P.render.requestContent();
    P.ui.updateOptions();
  },

  drawOverlay(ctx) {
    const s = this.s; if (!s) return;
    const v = P.view;
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => v.docToScreen(this.toWorld(a * s.w / 2, b * s.h / 2)));
    ctx.save();
    ctx.lineWidth = 1;
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
