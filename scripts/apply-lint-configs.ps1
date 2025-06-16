# Script otimizado para aplicar correções de lint essenciais
Write-Host "=== APLICANDO CORRECOES DE LINT ===" -ForegroundColor Green

# 1. Aplicar configurações ESLint melhoradas
Write-Host "1. Aplicando configuracoes ESLint melhoradas..." -ForegroundColor Yellow

if (Test-Path "backend\.eslintrc.improved.js") {
    Copy-Item "backend\.eslintrc.improved.js" "backend\.eslintrc.js" -Force
    Write-Host "   Backend ESLint: ATUALIZADO" -ForegroundColor Green
} else {
    Write-Host "   Backend ESLint: ARQUIVO NAO ENCONTRADO" -ForegroundColor Red
}

if (Test-Path "frontend\.eslintrc.improved.cjs") {
    Copy-Item "frontend\.eslintrc.improved.cjs" "frontend\.eslintrc.cjs" -Force
    Write-Host "   Frontend ESLint: ATUALIZADO" -ForegroundColor Green
} else {
    Write-Host "   Frontend ESLint: ARQUIVO NAO ENCONTRADO" -ForegroundColor Red
}

# 2. Limpar console.log automaticamente
Write-Host "2. Limpando console.log desnecessarios..." -ForegroundColor Yellow
if (Test-Path "scripts\clean-console-logs.js") {
    node scripts\clean-console-logs.js
} else {
    Write-Host "   Script de limpeza nao encontrado" -ForegroundColor Yellow
}

# 3. Executar verificação de lint (sem --fix para ver os problemas)
Write-Host "3. Verificando status do lint..." -ForegroundColor Yellow

Write-Host "   BACKEND:" -ForegroundColor Cyan
Set-Location backend
$backendErrors = $false
try {
    npm run lint --silent 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Backend: SEM ERROS" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Backend: TEM ERROS" -ForegroundColor Red
        $backendErrors = $true
    }
} catch {
    Write-Host "   ✗ Backend: ERRO NA VERIFICACAO" -ForegroundColor Red
    $backendErrors = $true
}
Set-Location ..

Write-Host "   FRONTEND:" -ForegroundColor Cyan
Set-Location frontend
$frontendErrors = $false
try {
    npm run lint --silent 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Frontend: SEM ERROS" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Frontend: TEM ERROS" -ForegroundColor Red
        $frontendErrors = $true
    }
} catch {
    Write-Host "   ✗ Frontend: ERRO NA VERIFICACAO" -ForegroundColor Red
    $frontendErrors = $true
}
Set-Location ..

# 4. Relatório final
Write-Host ""
Write-Host "=== RELATORIO FINAL ===" -ForegroundColor Green

if ($backendErrors -or $frontendErrors) {
    Write-Host "STATUS: REQUER CORRECOES MANUAIS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
    
    if ($backendErrors) {
        Write-Host "1. Backend - Execute: cd backend && npm run lint"
        Write-Host "   - Corrija erros criticos (imports duplicados, variaveis nao usadas)"
        Write-Host "   - Adicione tipos de retorno em funcoes"
    }
    
    if ($frontendErrors) {
        Write-Host "2. Frontend - Execute: cd frontend && npm run lint"
        Write-Host "   - Prefixe variaveis nao usadas com _"
        Write-Host "   - Substitua tipos 'any' por tipos especificos"
    }
    
    Write-Host "3. Para correcoes automaticas: npm run lint:fix"
    Write-Host "4. Para ver detalhes dos erros: npm run lint"
} else {
    Write-Host "STATUS: TODOS OS LINTS PASSARAM!" -ForegroundColor Green
    Write-Host "Seu codigo esta seguindo as melhores praticas!" -ForegroundColor Green
}

Write-Host ""
Write-Host "CONFIGURACOES APLICADAS:" -ForegroundColor Cyan
Write-Host "- ESLint mais restritivo"
Write-Host "- Deteccao de variaveis nao utilizadas"
Write-Host "- Validacao de tipos TypeScript"
Write-Host "- Configuracao especifica para testes"
