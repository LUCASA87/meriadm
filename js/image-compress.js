/**
 * Reduz fotos antes do upload (JPEG, max ~400 KB).
 */
export async function compressImageFile(file, opts = {}) {
  const maxW = opts.maxWidth ?? 1600;
  const maxH = opts.maxHeight ?? 1600;
  let quality = opts.quality ?? 0.82;
  const maxBytes = opts.maxBytes ?? 420000;

  if (!isImageFile(file)) {
    throw new Error('Arquivo inválido — escolha uma imagem.');
  }

  const bitmap = await loadBitmap(file);
  let w = bitmap.width;
  let h = bitmap.height;
  const scale = Math.min(1, maxW / w, maxH / h);
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.drawImage(bitmap.source, 0, 0, w, h);
  bitmap.close?.();

  let blob = await canvasToJpeg(canvas, quality);
  while (blob.size > maxBytes && quality > 0.52) {
    quality -= 0.07;
    blob = await canvasToJpeg(canvas, quality);
  }
  return blob;
}

export function isImageFile(file) {
  if (!file || !file.size) return false;
  if (file.type?.startsWith('image/')) return true;
  if (!file.type || file.type === 'application/octet-stream') return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(file.name || '');
}

async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const b = await createImageBitmap(file);
      return { source: b, width: b.width, height: b.height, close: () => b.close?.() };
    } catch {
      /* fallback */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Não foi possível ler a imagem'));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function canvasToJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao comprimir imagem'))),
      'image/jpeg',
      quality
    );
  });
}
