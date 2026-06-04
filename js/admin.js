import { EVENT_TYPE_IDS, ADMIN_THUMB_BATCH } from './config.js';
import { fileToOptimizedDataUrl } from './image-avif.js';
import { isImageFile } from './image-compress.js';
import {
  fetchGalleryList,
  fetchImagesByIds,
  fetchLogoRow,
  saveImage,
  uploadImageFile,
  updateImageTipo,
  deleteImage,
  saveLogo,
  imageSrc,
  imageDisplaySrc,
  eventLabel,
} from './api.js';

window.__ADMIN_READY__ = true;
document.getElementById('format-hint') &&
  (document.getElementById('format-hint').textContent = 'Carregando conversor…');

let images = [];
let logoId = null;
let bulkRunning = false;
let thumbObserver = null;
const thumbQueue = new Set();
let thumbLoading = false;

function toast(msg, isError) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function eventOptionsHtml(selected) {
  return EVENT_TYPE_IDS.map(
    (id) =>
      `<option value="${id}"${selected === id ? ' selected' : ''}>${eventLabel(id)}</option>`
  ).join('');
}

function setProgress(visible, text, pct) {
  const box = document.getElementById('upload-progress');
  if (!box) return;
  box.hidden = !visible;
  const label = document.getElementById('progress-text');
  const bar = document.getElementById('progress-bar');
  if (label) label.textContent = text || '';
  if (bar) bar.style.width = `${Math.min(100, Math.max(0, pct ?? 0))}%`;
}

function thumbHtml(img) {
  const src = imageDisplaySrc(imageSrc(img));
  if (!src) return '<div class="img-placeholder" aria-hidden="true"></div>';
  const safe = src.replace(/"/g, '&quot;');
  return `<img src="${safe}" alt="Foto #${img.id}" loading="lazy">`;
}

function renderGallery() {
  const g = document.getElementById('admin-gallery');
  if (!g) return;

  if (!images.length) {
    g.innerHTML = '<p class="empty">Nenhuma imagem cadastrada.</p>';
    return;
  }

  g.innerHTML = images
    .map((img) => {
      const tipo = img.tipo_evento || 'outros';
      const hasThumb = !!imageSrc(img);
      return `
        <article class="img-card" data-id="${img.id}"${hasThumb ? ' data-loaded="1"' : ''}>
          <div class="img-thumb">${thumbHtml(img)}</div>
          <div class="meta">
            <span class="img-id">#${img.id}</span>
            <label class="sr-only" for="tipo-${img.id}">Categoria</label>
            <select id="tipo-${img.id}" class="tipo-select" data-id="${img.id}" aria-label="Tipo de evento">
              ${eventOptionsHtml(tipo)}
            </select>
          </div>
          <div class="actions">
            <button type="button" class="btn-save" data-save="${img.id}">Salvar categoria</button>
            <button type="button" class="danger" data-del="${img.id}">Excluir</button>
          </div>
        </article>`;
    })
    .join('');

  g.querySelectorAll('[data-save]').forEach((btn) => {
    btn.addEventListener('click', () => saveTipoFromCard(btn.dataset.save));
  });

  g.querySelectorAll('.tipo-select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const card = sel.closest('.img-card');
      card?.classList.add('dirty');
    });
  });

  g.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.del;
      if (!confirm(`Excluir imagem #${id}?`)) return;
      try {
        await deleteImage(id);
        toast('Imagem excluída');
        await loadImages();
      } catch (e) {
        toast(e.message, true);
      }
    });
  });

  setupThumbObserver();
  g.querySelectorAll('.img-card').forEach((card) => thumbObserver.observe(card));
  preloadMissingThumbs();
}

function preloadMissingThumbs() {
  images.forEach((img) => {
    if (!imageSrc(img)) thumbQueue.add(String(img.id));
  });
  drainThumbQueue();
}

function setupThumbObserver() {
  thumbObserver?.disconnect();
  thumbObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.dataset.id;
        if (id && !e.target.dataset.loaded) thumbQueue.add(id);
      });
      drainThumbQueue();
    },
    { rootMargin: '120px' }
  );
}

async function drainThumbQueue() {
  if (thumbLoading || !thumbQueue.size) return;
  thumbLoading = true;
  const ids = [...thumbQueue].slice(0, ADMIN_THUMB_BATCH);
  ids.forEach((id) => thumbQueue.delete(id));

  try {
    const rows = await fetchImagesByIds(ids);
    rows.forEach((row) => {
      const card = document.querySelector(`.img-card[data-id="${row.id}"]`);
      if (!card || card.dataset.loaded) return;
      const src = imageSrc(row);
      const wrap = card.querySelector('.img-thumb');
      if (src && wrap) {
        const display = imageDisplaySrc(src);
        wrap.innerHTML = `<img src="${display.replace(/"/g, '&quot;')}" alt="Foto #${row.id}" loading="lazy">`;
        card.dataset.loaded = '1';
      } else if (wrap) {
        wrap.innerHTML = '<div class="img-placeholder img-placeholder--err" title="Imagem pesada ou inválida"></div>';
        card.dataset.loaded = '1';
      }
    });
  } catch (e) {
    ids.forEach((id) => {
      const card = document.querySelector(`.img-card[data-id="${id}"]`);
      if (card && !card.dataset.loaded) {
        const wrap = card.querySelector('.img-thumb');
        if (wrap) wrap.innerHTML = '<div class="img-placeholder img-placeholder--err"></div>';
        card.dataset.loaded = '1';
      }
    });
    console.warn('Miniatura:', e.message);
  } finally {
    thumbLoading = false;
    if (thumbQueue.size) drainThumbQueue();
  }
}

async function saveTipoFromCard(id) {
  const sel = document.getElementById(`tipo-${id}`);
  if (!sel) return;
  const btn = document.querySelector(`[data-save="${id}"]`);
  try {
    btn.disabled = true;
    await updateImageTipo(id, sel.value);
    const card = sel.closest('.img-card');
    card?.classList.remove('dirty');
    toast('Categoria atualizada');
    const row = images.find((i) => String(i.id) === String(id));
    if (row) row.tipo_evento = sel.value;
  } catch (e) {
    toast(e.message, true);
  } finally {
    btn.disabled = false;
  }
}

async function loadImages() {
  const g = document.getElementById('admin-gallery');
  if (g) g.innerHTML = '<p class="empty">Carregando fotos...</p>';
  images = await fetchGalleryList();
  const stat = document.getElementById('stat-count');
  if (stat) stat.textContent = images.length;
  renderGallery();
}

async function loadLogoSection() {
  try {
    const row = await fetchLogoRow();
    const preview = document.getElementById('logo-preview');
    if (row && preview) {
      logoId = row.id;
      preview.src = row.logo;
      preview.hidden = false;
    } else if (preview) {
      logoId = null;
      preview.hidden = true;
    }
  } catch (e) {
    toast('Erro ao carregar logo: ' + e.message, true);
  }
}

function setUploadBusy(busy) {
  bulkRunning = busy;
  const zone = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');
  const label = document.getElementById('btn-pick-photos');
  if (zone) zone.classList.toggle('busy', busy);
  if (input) input.disabled = busy;
  if (label) {
    if (busy) label.setAttribute('aria-disabled', 'true');
    else label.removeAttribute('aria-disabled');
  }
}

async function processFiles(fileList) {
  const files = [...fileList].filter(isImageFile);
  if (!files.length) {
    toast('Nenhuma imagem válida selecionada', true);
    return;
  }
  if (bulkRunning) {
    toast('Aguarde o envio atual terminar', true);
    return;
  }

  const tipo = document.getElementById('upload-tipo')?.value || 'outros';
  setUploadBusy(true);

  let ok = 0;
  let fail = 0;
  let lastErr = '';
  const total = files.length;

  try {
    for (let i = 0; i < total; i++) {
      const file = files[i];
      const pct = Math.round(((i + 0.15) / total) * 100);
      setProgress(true, `Enviando ${i + 1}/${total}: ${file.name || 'foto'}`, pct);

      try {
        await uploadImageFile(file, tipo);
        ok++;
      } catch (storageErr) {
        try {
          setProgress(true, `Convertendo ${i + 1}/${total}…`, pct);
          const { dataUrl } = await fileToOptimizedDataUrl(file);
          await saveImage(dataUrl, tipo);
          ok++;
        } catch (e) {
          fail++;
          lastErr = e.message || storageErr.message;
          console.error(file.name, e);
        }
      }

      setProgress(true, `Concluído ${i + 1}/${total}`, Math.round(((i + 1) / total) * 100));
    }

    await loadImages();
    if (ok) toast(`${ok} foto(s) enviada(s).`);
    if (fail) toast(`${fail} falhou(aram): ${lastErr}`, true);
  } finally {
    setUploadBusy(false);
    setProgress(false);
  }
}

function onFilesSelected(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  if (!window.__ADMIN_READY__) {
    alert('O painel ainda está carregando. Espere 2 segundos e tente de novo.');
    return;
  }
  toast(`${files.length} foto(s) selecionada(s)…`);
  processFiles(files).catch((err) => toast(err.message, true));
}

function bindFileInput(input) {
  if (!input) return;
  const handler = () => {
    const files = input.files;
    if (!files?.length) return;
    onFilesSelected(files);
    input.value = '';
  };
  input.addEventListener('change', handler);
  input.addEventListener('input', handler);
}

function bindUpload() {
  const zone = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');
  if (!input) return;

  bindFileInput(input);

  if (!zone) return;

  ['dragenter', 'dragover'].forEach((ev) => {
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer?.files?.length) {
      processFiles(e.dataTransfer.files).catch((err) => toast(err.message, true));
    }
  });
}

document.getElementById('btn-url')?.addEventListener('click', async () => {
  const val = document.getElementById('url-input')?.value.trim();
  if (!val) return toast('Informe uma URL', true);
  const tipo = document.getElementById('upload-tipo')?.value || 'outros';
  try {
    setProgress(true, 'Salvando URL...', 50);
    await saveImage(val, tipo);
    document.getElementById('url-input').value = '';
    toast('URL salva na galeria');
    await loadImages();
  } catch (err) {
    toast(err.message, true);
  } finally {
    setProgress(false);
  }
});

document.getElementById('logo-file')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const { dataUrl } = await fileToOptimizedDataUrl(file);
    await saveLogo(dataUrl, logoId);
    toast(logoId ? 'Logo atualizada' : 'Logo salva');
    await loadLogoSection();
  } catch (err) {
    toast(err.message, true);
  }
  e.target.value = '';
});

async function initFormatHint() {
  const hint = document.getElementById('format-hint');
  if (!hint) return;
  hint.textContent =
    'Fotos vão para o Supabase Storage (leve). Fotos antigas em base64 carregam aos poucos.';
}

const sel = document.getElementById('upload-tipo');
if (sel && !sel.options.length) sel.innerHTML = eventOptionsHtml('outros');

function boot() {
  bindUpload();
  initFormatHint();
  loadImages().catch((e) => toast('Erro ao carregar: ' + e.message, true));
  loadLogoSection();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
