import { IMAGE_UPLOAD } from './config.js';

let avifEncodeSupported;

export async function supportsAvifEncode() {
  if (avifEncodeSupported !== undefined) return avifEncodeSupported;
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  avifEncodeSupported = await new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob?.type === 'image/avif'),
      'image/avif',
      0.5
    );
  });
  return avifEncodeSupported;
}

/**
 * Converte arquivo de imagem para data URL AVIF (ou WebP se o navegador não suportar AVIF).
 */
export async function fileToOptimizedDataUrl(file) {
  const bitmap = await loadBitmap(file);
  const maxSide = IMAGE_UPLOAD.maxSide;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height, 1));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: true });
  ctx.drawImage(bitmap.source, 0, 0, w, h);
  bitmap.close?.();

  const useAvif = await supportsAvifEncode();
  const mime = useAvif ? 'image/avif' : 'image/webp';
  const quality = useAvif ? IMAGE_UPLOAD.avifQuality : IMAGE_UPLOAD.webpQuality;

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao converter a imagem'))),
      mime,
      quality
    );
  });

  const dataUrl = await blobToDataUrl(blob);
  const kb = Math.round((dataUrl.length * 3) / 4 / 1024);
  return { dataUrl, mime, kb, useAvif };
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
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
