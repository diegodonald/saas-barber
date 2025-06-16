@echo off
setlocal enabledelayedexpansion

echo.
echo ==============================================
echo 🧪 Executando Testes do Projeto SaaS Barber
echo ==============================================
echo.

REM Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ❌ Execute este script na raiz do projeto
    pause
    exit /b 1
)

set "BACKEND_SUCCESS=false"
set "FRONTEND_SUCCESS=false"
set "E2E_SUCCESS=false"

REM 1. Testes do Backend
echo.
echo 📋 TESTANDO BACKEND
echo ==================
echo.

if exist "backend" (
    echo 🔄 Executando testes do backend...
    cd backend
    call npm test
    if !errorlevel! equ 0 (
        echo ✅ Testes do backend passaram
        set "BACKEND_SUCCESS=true"
    ) else (
        echo ❌ Testes do backend falharam
    )
    cd ..
) else (
    echo ❌ Diretório backend não encontrado
)

REM 2. Testes do Frontend
echo.
echo 🎨 TESTANDO FRONTEND
echo ===================
echo.

if exist "frontend" (
    echo 🔄 Executando testes do frontend...
    cd frontend
    call npm run test run
    if !errorlevel! equ 0 (
        echo ✅ Testes do frontend passaram
        set "FRONTEND_SUCCESS=true"
    ) else (
        echo ❌ Testes do frontend falharam
    )
    cd ..
) else (
    echo ❌ Diretório frontend não encontrado
)

REM 3. Testes E2E (opcional)
echo.
echo 🔄 TESTANDO E2E
echo ==============
echo.

if exist "playwright.config.ts" (
    echo 🔄 Executando testes E2E...
    call npm run test:e2e
    if !errorlevel! equ 0 (
        echo ✅ Testes E2E passaram
        set "E2E_SUCCESS=true"
    ) else (
        echo ❌ Testes E2E falharam
    )
) else (
    echo ⚠️  Configuração E2E não encontrada, pulando...
    set "E2E_SUCCESS=true"
)

REM Resumo final
echo.
echo 📊 RESUMO DOS TESTES
echo ===================
echo.

echo Backend:  
if "%BACKEND_SUCCESS%"=="true" (
    echo ✅ PASSOU
) else (
    echo ❌ FALHOU
)

echo Frontend: 
if "%FRONTEND_SUCCESS%"=="true" (
    echo ✅ PASSOU
) else (
    echo ❌ FALHOU
)

echo E2E:      
if "%E2E_SUCCESS%"=="true" (
    echo ✅ PASSOU
) else (
    echo ❌ FALHOU
)

echo.
if "%BACKEND_SUCCESS%"=="true" if "%FRONTEND_SUCCESS%"=="true" if "%E2E_SUCCESS%"=="true" (
    echo 🎉 TODOS OS TESTES PASSARAM!
    pause
    exit /b 0
) else (
    echo 💥 ALGUNS TESTES FALHARAM
    pause
    exit /b 1
)