# Como colocar o Admin no GitHub Pages

O GitHub **não aceita arrastar uma pasta** — só os **arquivos de dentro**. São poucos (~15 arquivos).

## Por que o GitHub “não deixa” enviar a pasta?

1. **Não dá para arrastar a pasta** — só os arquivos **de dentro** (`Ctrl+A` dentro de `AdminMeri`).
2. **PNG gigantes** — se existir `icons/icon-192.png` ou `icon-512.png` (~1 MB cada), **apague** antes de enviar. O site usa só `icons/icon.svg`.

## Opção 1 — Pelo site (sem instalar nada)

### 1. Criar o repositório
1. Acesse [github.com](https://github.com) → **New repository**
2. Nome: `AdminMeri` (ou outro)
3. Marque **Public**
4. **Create repository**

### 2. Enviar os arquivos (importante)
1. No repositório vazio, clique **Add file** → **Upload files**
2. Abra no PC a pasta `AdminMeri` no Explorer
3. Pressione **Ctrl+A** (seleciona tudo **dentro** da pasta)
4. **Arraste** para a janela do GitHub (não arraste a pasta `AdminMeri` em cima de outra pasta)
5. Espere o upload terminar → **Commit changes**

### 3. Ativar o site
1. **Settings** → **Pages**
2. **Source:** Deploy from a branch → **main** → pasta **/ (root)**
3. Salve. Em 1–2 min o link fica: `https://SEU-USUARIO.github.io/AdminMeri/`

---

## Opção 2 — ZIP (se o arrastar falhar)

1. Dê duplo clique em **`criar-zip-github.bat`** (nesta pasta)
2. Será criado `AdminMeri-github.zip` na Área de trabalho
3. No GitHub: **Add file** → **Upload files** → envie o **.zip**
4. O GitHub **não descompacta** o zip automaticamente — use a Opção 1 se possível

Se só o zip funcionar, descompacte o zip no PC, entre na pasta e envie **arquivo por arquivo** ou em lotes pequenos (5–6 por vez).

---

## Arquivos obrigatórios (confira se subiu tudo)

```
index.html
.nojekyll
manifest.json
sw.js
css/admin.css
js/admin.bundle.js    ← ESSENCIAL para upload funcionar
js/admin.js
js/api.js
js/config.js
js/image-avif.js
js/image-compress.js
icons/icon.svg
```

Os `.bat` e `.md` são opcionais.

---

## Erros comuns

| Problema | Solução |
|----------|---------|
| Só aparece pasta vazia no site | Faltou `index.html` na **raiz** do repositório |
| Upload não funciona no site | Faltou `js/admin.bundle.js` |
| Página 404 | URL precisa terminar com `/` e nome do repo certo |

---

## Atualizar depois

1. **Upload files** de novo com os arquivos que mudaram, ou
2. Instale [GitHub Desktop](https://desktop.github.com/) — aí sim dá para sincronizar a pasta inteira com um clique.
