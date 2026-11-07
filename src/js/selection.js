// Photo299 - selezione basata su maschera, con contorno "formiche in marcia"
'use strict';

P.sel = {
  active: false,
  mask: null,      // canvas grande quanto il documento, alfa = selezionato
  bounds: null,    // {x,y,w,h}
  edges: null,     // Path2D del contorno in coordinate documento

  clear(silent) {
    this.active = false; this.mask = null; this.bounds = null; this.edges = null;
    if (!silent) P.render.request();
  },

  shapeCanvas(type, pts) {
    const d = P.doc;
    const c = P.util.makeCanvas(d.width, d.height);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    if (type === 'rect') {
      const [a, b] = pts;
      ctx.rect(Math.round(Math.min(a.x, b.x)), Math.round(Math.min(a.y, b.y)), Math.round(Math.abs(b.x - a.x)), Math.round(Math.abs(b.y - a.y)));
    } else if (type === 'ellipse') {
      const [a, b] = pts;
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      ctx.ellipse(cx, cy, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
    } else {
      pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.closePath();
    }
    ctx.fill();
    return c;
  },

  // mode: 'new' | 'add' | 'sub' | 'intersect'
  apply(shape, mode = 'new') {
    if (mode === 'new' || !this.active) {
      if (mode === 'sub' || mode === 'intersect') { if (!this.active) return; }
      this.mask = shape;
    } else {
      const ctx = this.mask.getContext('2d');
      ctx.globalCompositeOperation = mode === 'add' ? 'source-over' : mode === 'sub' ? 'destination-out' : 'destination-in';
      ctx.drawImage(shape, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
    this.update();
  },

  fromMaskArray(arr, w, h) {
    const c = P.util.makeCanvas(w, h);
    const ctx = c.getContext('2d');
    const id = ctx.createImageData(w, h);
    for (let i = 0; i < arr.length; i++) if (arr[i]) { const j = i * 4; id.data[j] = id.data[j + 1] = id.data[j + 2] = 255; id.data[j + 3] = 255; }
    ctx.putImageData(id, 0, 0);
    return c;
  },

  selectAll() {
    const d = P.doc; if (!d) return;
    const c = P.util.makeCanvas(d.width, d.height);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, d.width, d.height);
    this.mask = c; this.update();
  },

  invert() {
    const d = P.doc; if (!d) return;
    const c = P.util.makeCanvas(d.width, d.height);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, d.width, d.height);
    if (this.active) { ctx.globalCompositeOperation = 'destination-out'; ctx.drawImage(this.mask, 0, 0); }
    this.mask = c; this.update();
  },

  translate(dx, dy) {
    if (!this.active) return;
    const c = P.util.makeCanvas(this.mask.width, this.mask.height);
    c.getContext('2d').drawImage(this.mask, Math.round(dx), Math.round(dy));
    this.mask = c; this.update();
  },

  // Ricalcola limiti e contorno a partire dalla maschera
  update() {
    const m = this.mask;
    if (!m) return this.clear();
    const w = m.width, h = m.height;
    const data = m.getContext('2d').getImageData(0, 0, w, h).data;
    const inside = new Uint8Array(w * h);
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let i = 0, p = 0; i < inside.length; i++, p += 4) {
      if (data[p + 3] > 127) {
        inside[i] = 1;
        const x = i % w, y = (i / w) | 0;
        if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) return this.clear();
    this.active = true;
    this.bounds = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    // contorni: segmenti orizzontali e verticali uniti in tratti
    const path = new Path2D();
    const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) ? inside[y * w + x] : 0;
    for (let y = minY; y <= maxY + 1; y++) {
      let start = -1;
      for (let x = minX; x <= maxX + 1; x++) {
        const edge = x <= maxX && at(x, y - 1) !== at(x, y);
        if (edge && start < 0) start = x;
        if (!edge && start >= 0) { path.moveTo(start, y); path.lineTo(x, y); start = -1; }
      }
    }
    for (let x = minX; x <= maxX + 1; x++) {
      let start = -1;
      for (let y = minY; y <= maxY + 1; y++) {
        const edge = y <= maxY && at(x - 1, y) !== at(x, y);
        if (edge && start < 0) start = y;
        if (!edge && start >= 0) { path.moveTo(x, start); path.lineTo(x, y); start = -1; }
      }
    }
    this.edges = path;
    P.render.request();
  },

  // Copia del contenuto di un canvas limitato alla selezione (ritagliato ai limiti)
  extract(src) {
    const b = this.active ? this.bounds : { x: 0, y: 0, w: src.width, h: src.height };
    const c = P.util.makeCanvas(b.w, b.h);
    const ctx = c.getContext('2d');
    ctx.drawImage(src, -b.x, -b.y);
    if (this.active) { ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(this.mask, -b.x, -b.y); }
    return { canvas: c, x: b.x, y: b.y };
  },

  // Cancella dal canvas l'area selezionata
  clearFrom(canvas) {
    const ctx = canvas.getContext('2d');
    if (this.active) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(this.mask, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    } else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};
