@echo off
setlocal
cd /d "%~dp0"
title Dapa Glamping - version folletos-logo-2

echo =========================================================
echo   DAPA GLAMPING - FOLLETOS Y LOGO CORREGIDOS
 echo =========================================================
echo Carpeta utilizada: %CD%
echo.
where node >nul 2>nul
if errorlevel 1 (
 echo ERROR: Instala Node.js desde https://nodejs.org/
 pause
 exit /b 1
)
if not exist "node_modules\express" (
 echo Instalando dependencias por primera vez...
 call npm install
 if errorlevel 1 (
  echo No se pudieron instalar las dependencias.
  pause
  exit /b 1
 )
)
echo.
echo Comprueba que no tengas otro servidor abierto en el puerto 3000.
echo Abre http://localhost:3000 cuando aparezca el mensaje de inicio.
echo Si ves la version anterior, pulsa CTRL + SHIFT + R en el navegador.
echo.
call npm start
pause
