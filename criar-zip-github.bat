@echo off
chcp 65001 >nul
title ZIP para GitHub - Admin Meri
cd /d "%~dp0"

set DEST=%USERPROFILE%\Desktop\AdminMeri-github.zip
if exist "%DEST%" del "%DEST%"

echo Criando ZIP leve na Area de trabalho (sem PNGs grandes)...
powershell -NoProfile -Command "$files = @('index.html','.nojekyll','manifest.json','sw.js','COMO-ENVIAR-GITHUB.md'); $dirs = @('css','js','icons'); Compress-Archive -Path ($files + $dirs) -DestinationPath '%DEST%' -Force"

echo.
echo Pronto: %DEST%
echo.
echo No GitHub use Upload files com os arquivos DENTRO da pasta
echo (Ctrl+A nesta pasta AdminMeri), nao so o zip.
echo.
explorer /select,"%DEST%"
pause
