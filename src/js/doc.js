// Photo299 - modello del documento, livelli e selezione multipla
'use strict';

P.doc = null;

P.Doc = {
  createLayer(name, w, h) {
    const canvas = P.util.makeCanvas(w, h);
    return {
      id: P.util.uid(),
      name,
      visible: true,
      opacity: 1,
      canvas,
      dirty: true,
      snap: null,
      thumbDirty: true,
      textData: null // metadati opzionali se livello di testo
    };
  },

  create(width, height, background = '#ffffff', name = 'Senza titolo') {
    const doc = {
      id: P.util.uid(),
      name,
      width,
      height,
      layers: [],
      activeId: null,
      selectedIds: [],
      filePath: null
    };
    const bg = P.Doc.createLayer('Sfondo', width, height);
    if (background && background !== 'transparent') {
      const c = bg.canvas.getContext('2d');
      c.fillStyle = background;
      c.fillRect(0, 0, width, height);
    }
    doc.layers.push(bg);
    doc.activeId = bg.id;
    doc.selectedIds = [bg.id];
    return doc;
  },

  ensureSelection() {
    const d = P.doc;
    if (!d || !d.layers.length) return;
    if (!Array.isArray(d.selectedIds)) d.selectedIds = [];
    const valid = new Set(d.layers.map(l => l.id));
    d.selectedIds = d.selectedIds.filter(id => valid.has(id));
    if (!valid.has(d.activeId)) {
      d.activeId = d.selectedIds[d.selectedIds.length - 1] || d.layers[d.layers.length - 1].id;
    }
    if (!d.selectedIds.includes(d.activeId)) {
      d.selectedIds.push(d.activeId);
    }
  },

  active() {
    const d = P.doc;
    if (!d) return null;
    this.ensureSelection();
    return d.layers.find(l => l.id === d.activeId) || d.layers[d.layers.length - 1] || null;
  },

  activeIndex() {
    const d = P.doc;
    return d ? d.layers.findIndex(l => l.id === d.activeId) : -1;
  },

  // Restituisce i livelli selezionati nell'ordine dallo sfondo verso il primo piano
  selectedLayers() {
    const d = P.doc;
    if (!d) return [];
    this.ensureSelection();
    const sel = new Set(d.selectedIds);
    const list = d.layers.filter(l => sel.has(l.id));
    return list.length ? list : (this.active() ? [this.active()] : []);
  },

  isSelected(id) {
    const d = P.doc;
    if (!d) return false;
    this.ensureSelection();
    return d.selectedIds.includes(id) || d.activeId === id;
  },

  selectLayer(id, opts = {}) {
    const d = P.doc;
    if (!d) return;
    this.ensureSelection();
    if (opts.toggle) {
      // Ctrl+clic: aggiunge o rimuove dalla selezione multipla
      if (d.selectedIds.includes(id)) {
        if (d.selectedIds.length > 1) {
          d.selectedIds = d.selectedIds.filter(x => x !== id);
          if (d.activeId === id) d.activeId = d.selectedIds[d.selectedIds.length - 1];
        }
      } else {
        d.selectedIds.push(id);
        d.activeId = id;
      }
    } else if (opts.range && d.activeId) {
      // Maiusc+clic: seleziona intervallo tra activeId e id
      const i0 = d.layers.findIndex(l => l.id === d.activeId);
      const i1 = d.layers.findIndex(l => l.id === id);
      if (i0 >= 0 && i1 >= 0) {
        const a = Math.min(i0, i1), b = Math.max(i0, i1);
        const ids = new Set(d.selectedIds);
        for (let i = a; i <= b; i++) ids.add(d.layers[i].id);
        d.selectedIds = [...ids];
        d.activeId = id;
      }
    } else {
      d.activeId = id;
      d.selectedIds = [id];
    }
    this.ensureSelection();
  },

  // Trova il livello più in alto che ha un pixel non trasparente nel punto (x, y)
  layerAtPoint(x, y) {
    const d = P.doc;
    if (!d) return null;
    const ix = Math.floor(x), iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= d.width || iy >= d.height) return null;
    for (let i = d.layers.length - 1; i >= 0; i--) {
      const l = d.layers[i];
      if (!l.visible || l.opacity <= 0) continue;
      const a = l.canvas.getContext('2d').getImageData(ix, iy, 1, 1).data[3];
      if (a > 10) return l;
    }
    return null;
  },

  addLayer(name, canvas) {
    const d = P.doc;
    const l = P.Doc.createLayer(name || ('Livello ' + d.layers.length), d.width, d.height);
    if (canvas) l.canvas.getContext('2d').drawImage(canvas, 0, 0);
    const idx = P.Doc.activeIndex();
    d.layers.splice(idx + 1, 0, l);
    d.activeId = l.id;
    d.selectedIds = [l.id];
    return l;
  },

  // Renderizza o aggiorna un livello di testo a partire da l.textData
  renderTextLayer(l) {
    if (!l || !l.textData) return;
    const td = l.textData;
    const ctx = l.canvas.getContext('2d');
    ctx.clearRect(0, 0, l.canvas.width, l.canvas.height);
    if (!td.text || !td.text.trim()) {
      this.markDirty(l);
      return;
    }
    ctx.save();
    const style = `${td.italic ? 'italic ' : ''}${td.bold ? 'bold ' : ''}${td.size || 48}px ${td.font || 'Segoe UI, sans-serif'}`;
    ctx.font = style;
    ctx.textBaseline = 'top';
    const lines = td.text.split(/\r?\n/);
    const lineHeight = Math.round((td.size || 48) * 1.22);
    const widths = lines.map(line => ctx.measureText(line).width);
    const maxW = Math.max(1, ...widths);

    lines.forEach((line, idx) => {
      let lx = td.x;
      if (td.align === 'center') lx = td.x + (maxW - widths[idx]) / 2;
      else if (td.align === 'right') lx = td.x + (maxW - widths[idx]);
      const ly = td.y + idx * lineHeight;

      if (td.strokeWidth > 0) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = td.strokeWidth * 2;
        ctx.strokeStyle = td.strokeColor || '#000000';
        ctx.strokeText(line, lx, ly);
      }
      ctx.fillStyle = td.color || '#ffffff';
      ctx.fillText(line, lx, ly);
    });
    ctx.restore();
    this.markDirty(l);
  },

  markDirty(layer) {
    if (layer) {
      layer.dirty = true;
      layer.thumbDirty = true;
    }
  },

  // Composito di tutti i livelli visibili
  composite(bgColor) {
    const d = P.doc;
    const c = P.util.makeCanvas(d.width, d.height);
    const ctx = c.getContext('2d');
    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, d.width, d.height);
    }
    for (const l of d.layers) {
      if (!l.visible || l.opacity <= 0) continue;
      ctx.globalAlpha = l.opacity;
      ctx.drawImage(l.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
    return c;
  },

  // Sostituisce il canvas di tutti i livelli con una funzione di trasformazione
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
    d.width = newW;
    d.height = newH;
  }
};
