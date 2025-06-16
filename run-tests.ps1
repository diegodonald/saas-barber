param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipE2E
)

Write-Host "=== Executando Testes do Projeto SaaS Barber ===" -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na raiz do projeto" -ForegroundColor Red
    exit 1
}

$ErrorCount = 0

# 1. Testes do Backend
if (-not $SkipBackend) {
    Write-Host "`n[1/3] Testando Backend..." -ForegroundColor Cyan
    if (Test-Path "backend") {
        Push-Location backend
        try {
            & npm test 2>&1 | Write-Host
            if ($LASTEXITCODE -ne 0) {
                Write-Host "FALHOU: Testes do backend" -ForegroundColor Red
                $ErrorCount++
            } else {
                Write-Host "SUCESSO: Testes do backend passaram" -ForegroundColor Green
            }
        } catch {
            Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
            $ErrorCount++
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "ERRO: Diretório backend não encontrado" -ForegroundColor Red
        $ErrorCount++
    }
}

# 2. Testes do Frontend  
if (-not $SkipFrontend) {
    Write-Host "`n[2/3] Testando Frontend..." -ForegroundColor Cyan
    if (Test-Path "frontend") {
        Push-Location frontend
        try {
            & npm run test -- --run 2>&1 | Write-Host
            if ($LASTEXITCODE -ne 0) {
                Write-Host "FALHOU: Testes do frontend" -ForegroundColor Red
                $ErrorCount++
            } else {
                Write-Host "SUCESSO: Testes do frontend passaram" -ForegroundColor Green
            }
        } catch {
            Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
            $ErrorCount++
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "ERRO: Diretório frontend não encontrado" -ForegroundColor Red
        $ErrorCount++
    }
}

# 3. Testes E2E
if (-not $SkipE2E) {
    Write-Host "`n[3/3] Testando E2E..." -ForegroundColor Cyan
    if (Test-Path "playwright.config.ts") {
        try {
            & npm run test:e2e 2>&1 | Write-Host
            if ($LASTEXITCODE -ne 0) {
                Write-Host "FALHOU: Testes E2E" -ForegroundColor Red
                $ErrorCount++
            } else {
                Write-Host "SUCESSO: Testes E2E passaram" -ForegroundColor Green
            }
        } catch {
            Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
            $ErrorCount++
        }
    } else {
        Write-Host "AVISO: Configuração E2E não encontrada, pulando..." -ForegroundColor Yellow
    }
}

# Resumo final
Write-Host "`n=== RESUMO ===" -ForegroundColor Magenta
if ($ErrorCount -eq 0) {
    Write-Host "SUCESSO: Todos os testes passaram!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "FALHA: $ErrorCount erro(s) encontrado(s)" -ForegroundColor Red  
    exit 1
}