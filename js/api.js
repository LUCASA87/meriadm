import { SUPABASE } from './config.js';
import { compressImageFile } from './image-compress.js';

const GALLERY_BUCKET = 'galeria';

function headers() {
  return {
    apikey: SUPABASE.anonKey,
    Authorization: `Bearer ${SUPABASE.anonKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export function imageSrc(record) {
  const v = String(
    record?.images ?? record?.image ?? record?.url ?? record?.image_url ?? ''
  ).trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('//')) return 'https:' + v;
  if (v.startsWith('data:image')) return v;
  if (v.includes('supabase.co/storage')) {
    return v.startsWith('http') ? v : 'https://' + v.replace(/^\/+/, '');
  }
  return '';
}

/** Miniatura menor (Storage) */
export function imageDisplaySrc(src) {
  if (!src) return '';
  if (!src.includes('supabase.co/storage/v1/object/public/')) return src;
  const render = src.replace('/object/public/', '/render/image/public/');
  return render + '?width=480&quality=75&resize=contain';
}

export async function fetchUrlImagesBulk() {
  const h = headers();
  const base = `${SUPABASE.url}/rest/v1/imagens?select=id,images,tipo_evento&order=id.desc`;
  const [r1, r2] = await Promise.all([
    fetch(`${base}&images=like.https://%25`, { headers: h }).then((r) => (r.ok ? r.json() : [])),
    fetch(`${base}&images=like.http://%25`, { headers: h }).then((r) => (r.ok ? r.json() : [])),
  ]);
  return [...r1, ...r2].filter((row) => imageSrc(row));
}

/** Lista leve (sem base64) — evita timeout no Supabase */
export async function fetchImagesMeta() {
  const res = await fetch(
    `${SUPABASE.url}/rest/v1/imagens?select=id,tipo_evento&order=id.desc`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(parseApiError(await res.text()));
  return res.json();
}

/** Meta + URLs do Storage (miniaturas imediatas no painel) */
export async function fetchGalleryList() {
  const [meta, urlRows] = await Promise.all([fetchImagesMeta(), fetchUrlImagesBulk()]);
  const byId = new Map(urlRows.map((r) => [r.id, r]));
  return meta.map((m) => byId.get(m.id) || { ...m, images: '' });
}

/** Busca fotos em lote (máx. ~4 por vez no admin) */
export async function fetchImagesByIds(ids) {
  const clean = ids.map(Number).filter((n) => n > 0);
  if (!clean.length) return [];
  const res = await fetch(
    `${SUPABASE.url}/rest/v1/imagens?select=id,images,tipo_evento&id=in.(${clean.join(',')})`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(parseApiError(await res.text()));
  return res.json();
}

export async function fetchImageById(id) {
  const rows = await fetchImagesByIds([id]);
  return rows[0] ?? null;
}

export async function uploadImageFile(file, tipoEvento) {
  const blob = await compressImageFile(file);
  const path = `fotos/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;
  const uploadUrl = `${SUPABASE.url}/storage/v1/object/${GALLERY_BUCKET}/${path}`;
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: SUPABASE.anonKey,
      Authorization: `Bearer ${SUPABASE.anonKey}`,
      'Content-Type': 'image/jpeg',
    },
    body: blob,
  });
  if (!res.ok) {
    const err = await res.text();
    if (/bucket|not found|404/i.test(err)) {
      throw new Error(
        'Storage não configurado. Rode supabase/setup-storage.sql no SQL Editor do Supabase.'
      );
    }
    throw new Error(parseApiError(err));
  }
  const publicUrl = `${SUPABASE.url}/storage/v1/object/public/${GALLERY_BUCKET}/${path}`;
  return saveImage(publicUrl, tipoEvento);
}

function parseApiError(text) {
  try {
    const j = JSON.parse(text);
    if (j.code === '57014') {
      return 'Timeout: fotos muito pesadas no banco. Exclua uploads antigos grandes ou use URLs externas.';
    }
    return j.message || text;
  } catch {
    return text;
  }
}

export async function fetchLogoRow() {
  const res = await fetch(
    `${SUPABASE.url}/rest/v1/logo?select=*&order=id.desc&limit=1`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(await res.text());
  const rows = await res.json();
  return rows[0] ?? null;
}

/** Insere na tabela `imagens` — mesmo lugar que o site lê */
export async function saveImage(data, tipoEvento) {
  const body = { images: data, tipo_evento: tipoEvento || 'outros' };
  const res = await fetch(`${SUPABASE.url}/rest/v1/imagens`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(parseApiError(await res.text()));
  return res.json();
}

export async function updateImageTipo(id, tipoEvento) {
  const res = await fetch(`${SUPABASE.url}/rest/v1/imagens?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify({ tipo_evento: tipoEvento }),
  });
  if (!res.ok) throw new Error(parseApiError(await res.text()));
  return res.json();
}

export async function deleteImage(id) {
  const res = await fetch(`${SUPABASE.url}/rest/v1/imagens?id=eq.${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(parseApiError(await res.text()));
}

export async function saveLogo(data, currentId) {
  if (currentId) {
    const res = await fetch(`${SUPABASE.url}/rest/v1/logo?id=eq.${currentId}`, {
      method: 'PATCH',
      headers: { ...headers(), Prefer: 'return=representation' },
      body: JSON.stringify({ logo: data }),
    });
    if (!res.ok) throw new Error(parseApiError(await res.text()));
    return res.json();
  }
  const res = await fetch(`${SUPABASE.url}/rest/v1/logo`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify({ logo: data }),
  });
  if (!res.ok) throw new Error(parseApiError(await res.text()));
  return res.json();
}

export function eventLabel(id) {
  const map = {
    aniversario: 'Aniversário',
    bebe: 'Chá de Bebê',
    casamento: 'Casamento',
    infantil: 'Infantil',
    corporativo: 'Corporativo',
    outros: 'Outros',
  };
  return map[id] || 'Outros';
}
