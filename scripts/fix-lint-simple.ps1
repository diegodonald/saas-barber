# Script simplificado para aplicar correções de lint
Write-Host "Iniciando correções de lint..." -ForegroundColor Green

# 1. Aplicar configurações ESLint melhoradas
Write-Host "Aplicando configurações ESLint..." -ForegroundColor Yellow

if (Test-Path "backend\.eslintrc.improved.js") {
    Copy-Item "backend\.eslintrc.improved.js" "backend\.eslintrc.js" -Force
    Write-Host "Backend ESLint atualizado" -ForegroundColor Green
}

if (Test-Path "frontend\.eslintrc.improved.cjs") {
    Copy-Item "frontend\.eslintrc.improved.cjs" "frontend\.eslintrc.cjs" -Force
    Write-Host "Frontend ESLint atualizado" -ForegroundColor Green
}

# 2. Limpar console.log
Write-Host "Removendo console.log desnecessários..." -ForegroundColor Yellow
if (Test-Path "scripts\clean-console-logs.js") {
    node scripts\clean-console-logs.js
}

# 3. Executar lint fix
Write-Host "Aplicando correções automáticas..." -ForegroundColor Yellow

# Backend
Write-Host "Corrigindo Backend..." -ForegroundColor Cyan
Set-Location backend
npm run lint:fix
Set-Location ..

# Frontend  
Write-Host "Corrigindo Frontend..." -ForegroundColor Cyan
Set-Location frontend
npm run lint:fix
Set-Location ..

Write-Host "Processo concluído!" -ForegroundColor Green
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Executar testes: npm test"
Write-Host "2. Verificar build: npm run build"
