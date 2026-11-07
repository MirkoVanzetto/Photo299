// Photo299 - modello del documento e dei livelli
'use strict';

P.doc = null;

P.Doc = {
  createLayer(name, w, h) {
    const canvas = P.util.makeCanvas(w, h);
    return { id: P.util.uid(), name, visible: true, opacity: 1, canvas, dirty: true, snap: null, thumbDirty: true };
  },

  create(width, height, background = '#ffffff', name = 'Senza titolo') {
    const doc = { id: P.util.uid(), name, width, height, layers: [], activeId: null, filePath: null };
    const bg = P.Doc.createLayer('Sfondo', width, height);
    if (background && background !== 'transparent') {
      const c = bg.canvas.getContext('2d'); c.fillStyle = background; c.fillRect(0, 0, width, height);
    }
    doc.layers.push(bg);
    doc.activeId = bg.id;
    return doc;
  },

  active() {
    const d = P.doc; if (!d) return null;
    return d.layers.find(l => l.id === d.activeId) || d.layers[d.layers.length - 1] || null;
  },
  activeIndex() { const d = P.doc; return d ? d.layers.findIndex(l => l.id === d.activeId) : -1; },

  addLayer(name, canvas) {
    const d = P.doc;
    const l = P.Doc.createLayer(name || ('Livello ' + (d.layers.length)), d.width, d.height);
    if (canvas) l.canvas.getContext('2d').drawImage(canvas, 0, 0);
    const idx = P.Doc.activeIndex();
    d.layers.splice(idx + 1, 0, l);
    d.activeId = l.id;
    return l;
  },

  markDirty(layer) { if (layer) { layer.dirty = true; layer.thumbDirty = true; } },

  // Composito di tutti i livelli visibili
  composite(bgColor) {
    const d = P.doc;
    const c = P.util.makeCanvas(d.width, d.height);
    const ctx = c.getContext('2d');
    if (bgColor) { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, d.width, d.height); }
    for (const l of d.layers) {
      if (!l.visible || l.opacity <= 0) continue;
      ctx.globalAlpha = l.opacity;
      ctx.drawImage(l.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
    return c;
  },

  // Sostituisce il canvas di tutti i livelli con una funzione di trasformazione (es. ridimensiona)
  mapLayers(newW, newH, drawFn) {
    const d = P.doc;
    for (const l of d.layers) {
      const nc = P.util.makeCanvas(newW, newH);
      const ctx = nc.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      drawFn(ctx, l.canvas, l);
      l.canvas = nc;
      P.Doc.markDirty(l);
    }
    d.width = newW; d.height = newH;
  }
};
