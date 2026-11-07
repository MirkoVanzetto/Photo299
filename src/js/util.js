// Photo299 - utilità comuni
'use strict';
window.P = window.P || {};

P.util = {
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },
  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
  makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  },
  cloneCanvas(src) {
    const c = P.util.makeCanvas(src.width, src.height);
    c.getContext('2d').drawImage(src, 0, 0);
    return c;
  },
  ctx(c) { return c.getContext('2d', { willReadFrequently: false }); },
  hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  },
  rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''); },
  canvasToBlob(c, type = 'image/png', q) {
    return new Promise(res => c.toBlob(b => res(b), type, q));
  },
  blobToImage(blob) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = e => { URL.revokeObjectURL(url); rej(e); };
      img.src = url;
    });
  },
  srcToImage(src) {
    return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = src; });
  },
  base64ToBytes(b64) {
    const bin = atob(b64); const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  },
  mimeFromName(name) {
    const e = name.toLowerCase().split('.').pop();
    return { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp' }[e] || 'application/octet-stream';
  },
  // Rettangolo che contiene i pixel non trasparenti (null se vuoto)
  contentBounds(canvas) {
    const w = canvas.width, h = canvas.height;
    const d = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      const row = y * w * 4;
      for (let x = 0; x < w; x++) {
        if (d[row + x * 4 + 3] !== 0) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null;
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  },
  debounce(fn, ms) {
    let t = null;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  },
  toast(msg, ms = 2200) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    document.getElementById('toast-root').appendChild(el);
    setTimeout(() => el.remove(), ms);
  },
  status(msg) { document.getElementById('status-msg').textContent = msg || ''; }
};
