@echo off
chcp 65001 >nul
title Meri Decor - Preparar pasta para APK
cd /d "%~dp0"

echo.
echo  PREPARAR ADMIN PARA APK (Android)
echo.
echo  1. Gerando js/admin.bundle.js (JavaScript unico para WebView)...
echo.

npx --yes esbuild js/admin.js --bundle --format=iife --global-name=AdminMeri --outfile=js/admin.bundle.js --platform=browser
if errorlevel 1 (
  echo ERRO ao gerar bundle.
  pause
  exit /b 1
)

echo.
echo  OK — pasta pronta para o gerador de APK.
echo.
echo  IMPORTANTE:
echo  - Inclua TODA a pasta AdminMeri (com js/admin.bundle.js)
echo  - O APK precisa de permissao INTERNET (Supabase)
echo  - Melhor: publique no GitHub Pages e aponte o APK para a URL HTTPS
echo    (ex.: https://seu-usuario.github.io/AdminMeri/)
echo.
echo  NAO use 127.0.0.1 no APK — nao funciona no celular.
echo.
pause
