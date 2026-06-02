@echo off
chcp 65001 >nul
title Meri Decor - Admin
cd /d "%~dp0"

set PORTA=3789

echo.
echo  ADMIN MERI DECOR - servidor local
echo  PC:     http://127.0.0.1:%PORTA%/
echo  Celular (mesma Wi-Fi): http://SEU-IP:%PORTA%/
echo        (cmd: ipconfig - veja IPv4)
echo.
echo  Instalar como app: Chrome - Instalar admin
echo  Guia: COMO-INSTALAR-APP.md
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:%PORTA%/"

npx --yes serve . -l %PORTA%

pause
