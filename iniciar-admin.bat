@echo off
chcp 65001 >nul
title Meri Decor - Admin
cd /d "%~dp0"

set PORTA=3789

echo.
echo  ADMIN MERI DECOR - servidor local
echo  PC:     http://127.0.0.1:%PORTA%/
echo.
echo  Celular (mesma Wi-Fi) — NAO use 127.0.0.1 no celular:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  echo    http://%%a:%PORTA%/
)
echo.
echo  Instalar como app: use o IP acima no celular, nao 127.0.0.1
echo  Guia: COMO-INSTALAR-APP.md
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:%PORTA%/"

npx --yes serve . -l tcp://0.0.0.0:%PORTA%

pause
