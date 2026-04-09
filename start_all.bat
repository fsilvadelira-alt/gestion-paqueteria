@echo off
:: SCRIPT DE INICIO ROBUSTO (SIN RUTAS HARDCODEADAS)
echo ===================================================================
echo   SISTEMA DE GESTION DE PAQUETERIA - INICIO
echo ===================================================================
echo.

:: 1. Verificar privilegios de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] DEBES EJECUTAR ESTE SCRIPT COMO ADMINISTRADOR.
    echo Haz clic derecho sobre este archivo y selecciona "Ejecutar como administrador".
    echo.
    pause
    exit /b
)

:: 2. Definir rutas relativas al script
:: %~dp0 apunta a la carpeta donde esta este archivo .bat
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%~dp0backend"
set "FRONTEND_DIR=%~dp0frontend"

echo [1/4] Configurando dominio local ICA.Logistica.compras...
:: Intentar agregar al archivo hosts
set "HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts"
set "DOMAIN=ICA.Logistica.compras"
findstr /C:"%DOMAIN%" "%HOSTS_FILE%" >nul
if %errorLevel% neq 0 (
    echo 127.0.0.1 %DOMAIN% >> "%HOSTS_FILE%"
    echo [OK] Dominio agregado.
) else (
    echo [OK] El dominio ya existe.
)

echo [2/4] Iniciando MySQL...
net start MySQL80 2>nul
net start MySQL96 2>nul
echo [OK] MySQL verificado.

echo [3/4] Lanzando Backend...
if exist "%BACKEND_DIR%" (
    start "Backend" cmd /k "cd /d "%BACKEND_DIR%" && call npm run dev"
) else (
    echo [X] ERROR: No se encontro la carpeta: "%BACKEND_DIR%"
)

echo [4/4] Lanzando Frontend...
if exist "%FRONTEND_DIR%" (
    start "Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && call npm run dev"
) else (
    echo [X] ERROR: No se encontro la carpeta: "%FRONTEND_DIR%"
)

echo.
echo ===================================================================
echo   URL: https://ICA.Logistica.compras:3000
echo   LAN: https://192.168.68.119:3000
echo ===================================================================
echo.
pause
