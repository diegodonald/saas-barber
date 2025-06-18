#!/usr/bin/env pwsh

# Script para testar as correções dos testes E2E
# Executa apenas os testes de API integration que foram corrigidos

Write-Host "🧪 Testando correções dos testes E2E..." -ForegroundColor Cyan

# Verificar se o Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se o npm está instalado
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm não encontrado. Instale o npm primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se o Playwright está instalado
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npx não encontrado. Instale o npm primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Verificando dependências..." -ForegroundColor Yellow

# Instalar dependências se necessário
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências." -ForegroundColor Red
        exit 1
    }
}

# Verificar se o Playwright está instalado
Write-Host "🎭 Verificando instalação do Playwright..." -ForegroundColor Yellow
npx playwright install chromium
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar browsers do Playwright." -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Iniciando serviços para teste..." -ForegroundColor Green

# Função para parar processos em caso de erro
function Stop-TestProcesses {
    Write-Host "🛑 Parando processos de teste..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*dev*" } | Stop-Process -Force
}

# Registrar handler para Ctrl+C
Register-EngineEvent PowerShell.Exiting -Action { Stop-TestProcesses }

try {
    # Executar apenas o teste de API integration corrigido
    Write-Host "🧪 Executando teste de API integration..." -ForegroundColor Cyan
    
    # Definir variáveis de ambiente para teste
    $env:NODE_ENV = "test"
    $env:PLAYWRIGHT_BASE_URL = "http://localhost:3000"
    
    # Executar o teste específico
    npx playwright test e2e/api-integration-new.spec.ts --headed --workers=1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Testes de API integration passaram!" -ForegroundColor Green
    } else {
        Write-Host "❌ Alguns testes falharam. Verifique os logs acima." -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erro durante execução dos testes: $_" -ForegroundColor Red
    exit 1
} finally {
    Stop-TestProcesses
}

Write-Host "🏁 Teste concluído!" -ForegroundColor Cyan
