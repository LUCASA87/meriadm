# Admin Meri Decor — instalar como app

## Android (Chrome)

1. Rode `iniciar-admin.bat` no PC **ou** publique a pasta `AdminMeri` com **HTTPS**.
2. No celular, abra o endereço do admin (ex.: `http://IP-DO-PC:3789` na mesma Wi‑Fi, ou seu domínio).
3. Toque em **Instalar app** (botão embaixo) ou menu ⋮ → **Instalar app** / **Adicionar à tela inicial**.

## iPhone (Safari)

Compartilhar → **Adicionar à Tela de Início**.

## Usar na mesma rede (sem hospedar)

1. No PC: `iniciar-admin.bat`.
2. Descubra o IP do PC (cmd → `ipconfig` → IPv4, ex. `192.168.0.10`).
3. No celular (mesma Wi‑Fi): `http://192.168.0.10:3789/`

Alguns celulares exigem HTTPS para instalar; nesse caso publique o admin num serviço gratuito (Netlify, etc.) com senha na URL ou proteção extra.

## Segurança

O admin usa a chave pública do Supabase. Não compartilhe o app instalado com pessoas que não devem alterar a galeria.
