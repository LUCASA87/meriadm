var AdminMeri = (() => {
  // js/config.js
  var SUPABASE = {
    url: "https://wngweuxabbsqdjhuqxoq.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZ3dldXhhYmJzcWRqaHVxeG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDI5OTAsImV4cCI6MjA5NTU3ODk5MH0.uLRCCtDrbjJLE3B-tnZcQ9zwRsfO6Z_3CkSb5j6vCps"
  };
  var EVENT_TYPES = [
    { id: "aniversario", label: "Anivers\xE1rio" },
    { id: "bebe", label: "Ch\xE1 de Beb\xEA" },
    { id: "casamento", label: "Casamento" },
    { id: "infantil", label: "Infantil" },
    { id: "corporativo", label: "Corporativo" },
    { id: "outros", label: "Outros" }
  ];
  var EVENT_TYPE_IDS = EVENT_TYPES.map((t) => t.id);
  var IMAGE_UPLOAD = {
    maxSide: 1280,
    avifQuality: 0.55,
    webpQuality: 0.72
  };
  var ADMIN_THUMB_BATCH = 3;

  // js/image-avif.js
  var avifEncodeSupported;
  async function supportsAvifEncode() {
    if (avifEncodeSupported !== void 0) return avifEncodeSupported;
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    avifEncodeSupported = await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob?.type === "image/avif"),
        "image/avif",
        0.5
      );
    });
    return avifEncodeSupported;
  }
  async function fileToOptimizedDataUrl(file) {
    const bitmap = await loadBitmap(file);
    const maxSide = IMAGE_UPLOAD.maxSide;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height, 1));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { alpha: true });
    ctx.drawImage(bitmap.source, 0, 0, w, h);
    bitmap.close?.();
    const useAvif = await supportsAvifEncode();
    const mime = useAvif ? "image/avif" : "image/webp";
    const quality = useAvif ? IMAGE_UPLOAD.avifQuality : IMAGE_UPLOAD.webpQuality;
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => b ? resolve(b) : reject(new Error("Falha ao converter a imagem")),
        mime,
        quality
      );
    });
    const dataUrl = await blobToDataUrl(blob);
    const kb = Math.round(dataUrl.length * 3 / 4 / 1024);
    return { dataUrl, mime, kb, useAvif };
  }
  async function loadBitmap(file) {
    if (typeof createImageBitmap === "function") {
      try {
        const b = await createImageBitmap(file);
        return { source: b, width: b.width, height: b.height, close: () => b.close?.() };
      } catch {
      }
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("N\xE3o foi poss\xEDvel ler a imagem"));
        el.src = url;
      });
      return {
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        close: () => URL.revokeObjectURL(url)
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

  // js/image-compress.js
  async function compressImageFile(file, opts = {}) {
    const maxW = opts.maxWidth ?? 1600;
    const maxH = opts.maxHeight ?? 1600;
    let quality = opts.quality ?? 0.82;
    const maxBytes = opts.maxBytes ?? 42e4;
    if (!isImageFile(file)) {
      throw new Error("Arquivo inv\xE1lido \u2014 escolha uma imagem.");
    }
    const bitmap = await loadBitmap2(file);
    let w = bitmap.width;
    let h = bitmap.height;
    const scale = Math.min(1, maxW / w, maxH / h);
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.drawImage(bitmap.source, 0, 0, w, h);
    bitmap.close?.();
    let blob = await canvasToJpeg(canvas, quality);
    while (blob.size > maxBytes && quality > 0.52) {
      quality -= 0.07;
      blob = await canvasToJpeg(canvas, quality);
    }
    return blob;
  }
  function isImageFile(file) {
    if (!file || !file.size) return false;
    if (file.type?.startsWith("image/")) return true;
    if (!file.type || file.type === "application/octet-stream") return true;
    return /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(file.name || "");
  }
  async function loadBitmap2(file) {
    if (typeof createImageBitmap === "function") {
      try {
        const b = await createImageBitmap(file);
        return { source: b, width: b.width, height: b.height, close: () => b.close?.() };
      } catch {
      }
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("N\xE3o foi poss\xEDvel ler a imagem"));
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
        (b) => b ? resolve(b) : reject(new Error("Falha ao comprimir imagem")),
        "image/jpeg",
        quality
      );
    });
  }

  // js/api.js
  var GALLERY_BUCKET = "galeria";
  function headers() {
    return {
      apikey: SUPABASE.anonKey,
      Authorization: `Bearer ${SUPABASE.anonKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    };
  }
  function imageSrc(record) {
    const v = String(
      record?.images ?? record?.image ?? record?.url ?? record?.image_url ?? ""
    ).trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    if (v.startsWith("//")) return "https:" + v;
    if (v.startsWith("data:image")) return v;
    if (v.includes("supabase.co/storage")) {
      return v.startsWith("http") ? v : "https://" + v.replace(/^\/+/, "");
    }
    return "";
  }
  function imageDisplaySrc(src) {
    if (!src) return "";
    if (!src.includes("supabase.co/storage/v1/object/public/")) return src;
    const render = src.replace("/object/public/", "/render/image/public/");
    return render + "?width=480&quality=75&resize=contain";
  }
  async function fetchUrlImagesBulk() {
    const h = headers();
    const base = `${SUPABASE.url}/rest/v1/imagens?select=id,images,tipo_evento&order=id.desc`;
    const [r1, r2] = await Promise.all([
      fetch(`${base}&images=like.https://%25`, { headers: h }).then((r) => r.ok ? r.json() : []),
      fetch(`${base}&images=like.http://%25`, { headers: h }).then((r) => r.ok ? r.json() : [])
    ]);
    return [...r1, ...r2].filter((row) => imageSrc(row));
  }
  async function fetchImagesMeta() {
    const res = await fetch(
      `${SUPABASE.url}/rest/v1/imagens?select=id,tipo_evento&order=id.desc`,
      { headers: headers() }
    );
    if (!res.ok) throw new Error(parseApiError(await res.text()));
    return res.json();
  }
  async function fetchGalleryList() {
    const [meta, urlRows] = await Promise.all([fetchImagesMeta(), fetchUrlImagesBulk()]);
    const byId = new Map(urlRows.map((r) => [r.id, r]));
    return meta.map((m) => byId.get(m.id) || { ...m, images: "" });
  }
  async function fetchImagesByIds(ids) {
    const clean = ids.map(Number).filter((n) => n > 0);
    if (!clean.length) return [];
    const res = await fetch(
      `${SUPABASE.url}/rest/v1/imagens?select=id,images,tipo_evento&id=in.(${clean.join(",")})`,
      { headers: headers() }
    );
    if (!res.ok) throw new Error(parseApiError(await res.text()));
    return res.json();
  }
  async function uploadImageFile(file, tipoEvento) {
    const blob = await compressImageFile(file);
    const path = `fotos/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;
    const uploadUrl = `${SUPABASE.url}/storage/v1/object/${GALLERY_BUCKET}/${path}`;
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: SUPABASE.anonKey,
        Authorization: `Bearer ${SUPABASE.anonKey}`,
        "Content-Type": "image/jpeg"
      },
      body: blob
    });
    if (!res.ok) {
      const err = await res.text();
      if (/bucket|not found|404/i.test(err)) {
        throw new Error(
          "Storage n\xE3o configurado. Rode supabase/setup-storage.sql no SQL Editor do Supabase."
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
      if (j.code === "57014") {
        return "Timeout: fotos muito pesadas no banco. Exclua uploads antigos grandes ou use URLs externas.";
      }
      return j.message || text;
    } catch {
      return text;
    }
  }
  async function fetchLogoRow() {
    const res = await fetch(
      `${SUPABASE.url}/rest/v1/logo?select=*&order=id.desc&limit=1`,
      { headers: headers() }
    );
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    return rows[0] ?? null;
  }
  async function saveImage(data, tipoEvento) {
    const body = { images: data, tipo_evento: tipoEvento || "outros" };
    const res = await fetch(`${SUPABASE.url}/rest/v1/imagens`, {
      method: "POST",
      headers: { ...headers(), Prefer: "return=representation" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(parseApiError(await res.text()));
    return res.json();
  }
  async function updateImageTipo(id, tipoEvento) {
    const res = await fetch(`${SUPABASE.url}/rest/v1/imagens?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers(), Prefer: "return=representation" },
      body: JSON.stringify({ tipo_evento: tipoEvento })
    });
    if (!res.ok) throw new Error(parseApiError(await res.text()));
    return res.json();
  }
  async function deleteImage(id) {
    const res = await fetch(`${SUPABASE.url}/rest/v1/imagens?id=eq.${id}`, {
      method: "DELETE",
      headers: headers()
    });
    if (!res.ok) throw new Error(parseApiError(await res.text()));
  }
  async function saveLogo(data, currentId) {
    if (currentId) {
      const res2 = await fetch(`${SUPABASE.url}/rest/v1/logo?id=eq.${currentId}`, {
        method: "PATCH",
        headers: { ...headers(), Prefer: "return=representation" },
        body: JSON.stringify({ logo: data })
      });
      if (!res2.ok) throw new Error(parseApiError(await res2.text()));
      return res2.json();
    }
    const res = await fetch(`${SUPABASE.url}/rest/v1/logo`, {
      method: "POST",
      headers: { ...headers(), Prefer: "return=representation" },
      body: JSON.stringify({ logo: data })
    });
    if (!res.ok) throw new Error(parseApiError(await res.text()));
    return res.json();
  }
  function eventLabel(id) {
    const map = {
      aniversario: "Anivers\xE1rio",
      bebe: "Ch\xE1 de Beb\xEA",
      casamento: "Casamento",
      infantil: "Infantil",
      corporativo: "Corporativo",
      outros: "Outros"
    };
    return map[id] || "Outros";
  }

  // js/admin.js
  window.__ADMIN_READY__ = true;
  document.getElementById("format-hint") && (document.getElementById("format-hint").textContent = "Carregando conversor\u2026");
  var images = [];
  var logoId = null;
  var bulkRunning = false;
  var thumbObserver = null;
  var thumbQueue = /* @__PURE__ */ new Set();
  var thumbLoading = false;
  function toast(msg, isError) {
    const el = document.createElement("div");
    el.className = "toast" + (isError ? " error" : "");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4e3);
  }
  function eventOptionsHtml(selected) {
    return EVENT_TYPE_IDS.map(
      (id) => `<option value="${id}"${selected === id ? " selected" : ""}>${eventLabel(id)}</option>`
    ).join("");
  }
  function setProgress(visible, text, pct) {
    const box = document.getElementById("upload-progress");
    if (!box) return;
    box.hidden = !visible;
    const label = document.getElementById("progress-text");
    const bar = document.getElementById("progress-bar");
    if (label) label.textContent = text || "";
    if (bar) bar.style.width = `${Math.min(100, Math.max(0, pct ?? 0))}%`;
  }
  function thumbHtml(img) {
    const src = imageDisplaySrc(imageSrc(img));
    if (!src) return '<div class="img-placeholder" aria-hidden="true"></div>';
    const safe = src.replace(/"/g, "&quot;");
    return `<img src="${safe}" alt="Foto #${img.id}" loading="lazy">`;
  }
  function renderGallery() {
    const g = document.getElementById("admin-gallery");
    if (!g) return;
    if (!images.length) {
      g.innerHTML = '<p class="empty">Nenhuma imagem cadastrada.</p>';
      return;
    }
    g.innerHTML = images.map((img) => {
      const tipo = img.tipo_evento || "outros";
      const hasThumb = !!imageSrc(img);
      return `
        <article class="img-card" data-id="${img.id}"${hasThumb ? ' data-loaded="1"' : ""}>
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
    }).join("");
    g.querySelectorAll("[data-save]").forEach((btn) => {
      btn.addEventListener("click", () => saveTipoFromCard(btn.dataset.save));
    });
    g.querySelectorAll(".tipo-select").forEach((sel2) => {
      sel2.addEventListener("change", () => {
        const card = sel2.closest(".img-card");
        card?.classList.add("dirty");
      });
    });
    g.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.del;
        if (!confirm(`Excluir imagem #${id}?`)) return;
        try {
          await deleteImage(id);
          toast("Imagem exclu\xEDda");
          await loadImages();
        } catch (e) {
          toast(e.message, true);
        }
      });
    });
    setupThumbObserver();
    g.querySelectorAll(".img-card").forEach((card) => thumbObserver.observe(card));
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
      { rootMargin: "120px" }
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
        const wrap = card.querySelector(".img-thumb");
        if (src && wrap) {
          const display = imageDisplaySrc(src);
          wrap.innerHTML = `<img src="${display.replace(/"/g, "&quot;")}" alt="Foto #${row.id}" loading="lazy">`;
          card.dataset.loaded = "1";
        } else if (wrap) {
          wrap.innerHTML = '<div class="img-placeholder img-placeholder--err" title="Imagem pesada ou inv\xE1lida"></div>';
          card.dataset.loaded = "1";
        }
      });
    } catch (e) {
      ids.forEach((id) => {
        const card = document.querySelector(`.img-card[data-id="${id}"]`);
        if (card && !card.dataset.loaded) {
          const wrap = card.querySelector(".img-thumb");
          if (wrap) wrap.innerHTML = '<div class="img-placeholder img-placeholder--err"></div>';
          card.dataset.loaded = "1";
        }
      });
      console.warn("Miniatura:", e.message);
    } finally {
      thumbLoading = false;
      if (thumbQueue.size) drainThumbQueue();
    }
  }
  async function saveTipoFromCard(id) {
    const sel2 = document.getElementById(`tipo-${id}`);
    if (!sel2) return;
    const btn = document.querySelector(`[data-save="${id}"]`);
    try {
      btn.disabled = true;
      await updateImageTipo(id, sel2.value);
      const card = sel2.closest(".img-card");
      card?.classList.remove("dirty");
      toast("Categoria atualizada");
      const row = images.find((i) => String(i.id) === String(id));
      if (row) row.tipo_evento = sel2.value;
    } catch (e) {
      toast(e.message, true);
    } finally {
      btn.disabled = false;
    }
  }
  async function loadImages() {
    const g = document.getElementById("admin-gallery");
    if (g) g.innerHTML = '<p class="empty">Carregando fotos...</p>';
    images = await fetchGalleryList();
    const stat = document.getElementById("stat-count");
    if (stat) stat.textContent = images.length;
    renderGallery();
  }
  async function loadLogoSection() {
    try {
      const row = await fetchLogoRow();
      const preview = document.getElementById("logo-preview");
      if (row && preview) {
        logoId = row.id;
        preview.src = row.logo;
        preview.hidden = false;
      } else if (preview) {
        logoId = null;
        preview.hidden = true;
      }
    } catch (e) {
      toast("Erro ao carregar logo: " + e.message, true);
    }
  }
  function setUploadBusy(busy) {
    bulkRunning = busy;
    const zone = document.getElementById("upload-zone");
    const input = document.getElementById("file-input");
    const label = document.getElementById("btn-pick-photos");
    if (zone) zone.classList.toggle("busy", busy);
    if (input) input.disabled = busy;
    if (label) {
      if (busy) label.setAttribute("aria-disabled", "true");
      else label.removeAttribute("aria-disabled");
    }
  }
  async function processFiles(fileList) {
    const files = [...fileList].filter(isImageFile);
    if (!files.length) {
      toast("Nenhuma imagem v\xE1lida selecionada", true);
      return;
    }
    if (bulkRunning) {
      toast("Aguarde o envio atual terminar", true);
      return;
    }
    const tipo = document.getElementById("upload-tipo")?.value || "outros";
    setUploadBusy(true);
    let ok = 0;
    let fail = 0;
    let lastErr = "";
    const total = files.length;
    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        const pct = Math.round((i + 0.15) / total * 100);
        setProgress(true, `Enviando ${i + 1}/${total}: ${file.name || "foto"}`, pct);
        try {
          await uploadImageFile(file, tipo);
          ok++;
        } catch (storageErr) {
          try {
            setProgress(true, `Convertendo ${i + 1}/${total}\u2026`, pct);
            const { dataUrl } = await fileToOptimizedDataUrl(file);
            await saveImage(dataUrl, tipo);
            ok++;
          } catch (e) {
            fail++;
            lastErr = e.message || storageErr.message;
            console.error(file.name, e);
          }
        }
        setProgress(true, `Conclu\xEDdo ${i + 1}/${total}`, Math.round((i + 1) / total * 100));
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
      alert("O painel ainda est\xE1 carregando. Espere 2 segundos e tente de novo.");
      return;
    }
    toast(`${files.length} foto(s) selecionada(s)\u2026`);
    processFiles(files).catch((err) => toast(err.message, true));
  }
  function bindFileInput(input) {
    if (!input) return;
    const handler = () => {
      const files = input.files;
      if (!files?.length) return;
      onFilesSelected(files);
      input.value = "";
    };
    input.addEventListener("change", handler);
    input.addEventListener("input", handler);
  }
  function bindUpload() {
    const zone = document.getElementById("upload-zone");
    const input = document.getElementById("file-input");
    if (!input) return;
    bindFileInput(input);
    if (!zone) return;
    ["dragenter", "dragover"].forEach((ev) => {
      zone.addEventListener(ev, (e) => {
        e.preventDefault();
        zone.classList.add("dragover");
      });
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("dragover");
      if (e.dataTransfer?.files?.length) {
        processFiles(e.dataTransfer.files).catch((err) => toast(err.message, true));
      }
    });
  }
  document.getElementById("btn-url")?.addEventListener("click", async () => {
    const val = document.getElementById("url-input")?.value.trim();
    if (!val) return toast("Informe uma URL", true);
    const tipo = document.getElementById("upload-tipo")?.value || "outros";
    try {
      setProgress(true, "Salvando URL...", 50);
      await saveImage(val, tipo);
      document.getElementById("url-input").value = "";
      toast("URL salva na galeria");
      await loadImages();
    } catch (err) {
      toast(err.message, true);
    } finally {
      setProgress(false);
    }
  });
  document.getElementById("logo-file")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { dataUrl } = await fileToOptimizedDataUrl(file);
      await saveLogo(dataUrl, logoId);
      toast(logoId ? "Logo atualizada" : "Logo salva");
      await loadLogoSection();
    } catch (err) {
      toast(err.message, true);
    }
    e.target.value = "";
  });
  async function initFormatHint() {
    const hint = document.getElementById("format-hint");
    if (!hint) return;
    hint.textContent = "Fotos v\xE3o para o Supabase Storage (leve). Fotos antigas em base64 carregam aos poucos.";
  }
  var sel = document.getElementById("upload-tipo");
  if (sel && !sel.options.length) sel.innerHTML = eventOptionsHtml("outros");
  function boot() {
    bindUpload();
    initFormatHint();
    loadImages().catch((e) => toast("Erro ao carregar: " + e.message, true));
    loadLogoSection();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
