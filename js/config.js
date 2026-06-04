/** Mesma configuração do site Meri Decor (js/config.js) */
export const SUPABASE = {
  url: 'https://wngweuxabbsqdjhuqxoq.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZ3dldXhhYmJzcWRqaHVxeG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDI5OTAsImV4cCI6MjA5NTU3ODk5MH0.uLRCCtDrbjJLE3B-tnZcQ9zwRsfO6Z_3CkSb5j6vCps',
};

export const EVENT_TYPES = [
  { id: 'aniversario', label: 'Aniversário' },
  { id: 'bebe', label: 'Chá de Bebê' },
  { id: 'casamento', label: 'Casamento' },
  { id: 'infantil', label: 'Infantil' },
  { id: 'corporativo', label: 'Corporativo' },
  { id: 'outros', label: 'Outros' },
];

export const EVENT_TYPE_IDS = EVENT_TYPES.map((t) => t.id);

/** Redimensiona e comprime antes de salvar no banco */
export const IMAGE_UPLOAD = {
  maxSide: 1280,
  avifQuality: 0.55,
  webpQuality: 0.72,
};

/** Quantas miniaturas buscar por requisição no painel */
export const ADMIN_THUMB_BATCH = 3;
