// Photo299 - vista (zoom/pan) e rendering
'use strict';

P.view = {
  zoom: 1, panX: 0, panY: 0,
  canvas: null, el: null,
  mouseDoc: null, mouseIn: false,
  W() { return this.el.clientWidth; },
  H() { return this.el.clientHeight; },
  docToScreen(p) { return { x: p.x * this.zoom + this.panX, y: p.y * this.zoom + this.panY }; },
  screenToDoc(x, y) { return { x: (x - this.panX) / this.zoom, y: (y - this.panY) / this.zoom }; },
  eventToDoc(e) {
    const r = this.canvas.getBoundingClientRect();
    return this.screenToDoc(e.clientX - r.left, e.clientY - r.top);
  },
  setZoom(z, sx, sy) {
    z = P.util.clamp(z, 0.02, 64);
    if (sx == null) { sx = this.W() / 2; sy = this.H() / 2; }
    const d = this.screenToDoc(sx, sy);
    this.zoom = z;
    this.panX = sx - d.x * z; this.panY = sy - d.y * z;
    P.render.request(); P.ui.updateStatus();
  },
  zoomAt(f, sx, sy) { this.setZoom(this.zoom * f, sx, sy); },
  fit(maxZoom = Infinity) {
    const d = P.doc; if (!d) return;
    const z = Math.min((this.W() - 60) / d.width, (this.H() - 60) / d.height, maxZoom);
    this.zoom = Math.max(0.02, z);
    this.panX = Math.round((this.W() - d.width * this.zoom) / 2);
    this.panY = Math.round((this.H() - d.height * this.zoom) / 2);
    P.render.request(); P.ui.updateStatus();
  },
  actualSize() { this.setZoom(1); },
  setCursor(c) { this.canvas.style.cursor = c || 'default'; }
};

P.render = {
  override: null,
  comp: null,
  scratch: null,
  contentDirty: true,
  scheduled: false,
  antsOffset: 0,
  checker: null,

  request() {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => { this.scheduled = false; this.frame(); });
  },
  requestContent() { this.contentDirty = true; this.request(); },

  buildComposite() {
    const d = P.doc;
    if (!this.comp || this.comp.width !== d.width || this.comp.height !== d.height) {
      this.comp = P.util.makeCanvas(d.width, d.height);
      this.scratch = P.util.makeCanvas(d.width, d.height);
    }
    const ctx = this.comp.getContext('2d');
    ctx.clearRect(0, 0, d.width, d.height);
    for (const l of d.layers) {
      if (!l.visible) continue;
      ctx.globalAlpha = l.opacity;
      if (this.override && this.override.layerId === l.id) {
        const sc = this.scratch.getContext('2d');
        sc.clearRect(0, 0, d.width, d.height);
        this.override.draw(sc);
        ctx.drawImage(this.scratch, 0, 0);
      } else ctx.drawImage(l.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
    this.contentDirty = false;
  },

  getChecker(ctx) {
    if (!this.checker) {
      const c = P.util.makeCanvas(16, 16), x = c.getContext('2d');
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#cccccc'; x.fillRect(0, 0, 8, 8); x.fillRect(8, 8, 8, 8);
      this.checker = ctx.createPattern(c, 'repeat');
    }
    return this.checker;
  },

  frame() {
    const v = P.view, cv = v.canvas, dpr = window.devicePixelRatio || 1;
    const W = v.W(), H = v.H();
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#141518'; ctx.fillRect(0, 0, W, H);
    const d = P.doc;
    document.getElementById('empty-hint').classList.toggle('hidden', !!d);
    if (!d) return;
    if (this.contentDirty) this.buildComposite();
    const x = v.panX, y = v.panY, w = d.width * v.zoom, h = d.height * v.zoom;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.fillStyle = this.getChecker(ctx); ctx.fillRect(x, y, w, h);
    ctx.imageSmoothingEnabled = v.zoom < 1;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.comp, x, y, w, h);

    // formiche in marcia
    if (P.sel.active && P.sel.edges) {
      ctx.save();
      ctx.setTransform(dpr * v.zoom, 0, 0, dpr * v.zoom, dpr * v.panX, dpr * v.panY);
      ctx.lineWidth = 1 / v.zoom;
      ctx.setLineDash([4 / v.zoom, 4 / v.zoom]);
      ctx.lineDashOffset = -this.antsOffset / v.zoom;
      ctx.strokeStyle = '#000'; ctx.stroke(P.sel.edges);
      ctx.lineDashOffset = (-this.antsOffset + 4) / v.zoom;
      ctx.strokeStyle = '#fff'; ctx.stroke(P.sel.edges);
      ctx.restore();
    }

    const t = P.tools.current;
    if (t && t.overlay && !P.transform.active) t.overlay(ctx);
    if (P.transform.active) P.transform.drawOverlay(ctx);
  }
};

setInterval(() => {
  if (P.sel.active) { P.render.antsOffset = (P.render.antsOffset + 1) % 8; P.render.request(); }
}, 120);
