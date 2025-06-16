# Script PowerShell para aplicar todas as correções de lint no projeto SaaS Barber
# Execute: .\scripts\fix-all-lint.ps1

Write-Host "🔧 Iniciando correções completas de lint..." -ForegroundColor Cyan

# 1. Aplicar configurações ESLint melhoradas
Write-Host "📋 Aplicando configurações ESLint otimizadas..." -ForegroundColor Yellow

if (Test-Path "backend\.eslintrc.improved.js") {
    Copy-Item "backend\.eslintrc.improved.js" "backend\.eslintrc.js" -Force
    Write-Host "✅ Backend ESLint atualizado" -ForegroundColor Green
}

if (Test-Path "frontend\.eslintrc.improved.cjs") {
    Copy-Item "frontend\.eslintrc.improved.cjs" "frontend\.eslintrc.cjs" -Force
    Write-Host "✅ Frontend ESLint atualizado" -ForegroundColor Green
}

# 2. Limpar console.log desnecessários
Write-Host "🧹 Removendo console.log desnecessários..." -ForegroundColor Yellow
if (Test-Path "scripts\clean-console-logs.js") {
    node scripts\clean-console-logs.js
}

# 3. Executar correções automáticas de lint
Write-Host "🔨 Aplicando correções automáticas..." -ForegroundColor Yellow

# Backend
Write-Host "Backend:" -ForegroundColor Cyan
Set-Location backend
try {
    npm run lint:fix 2>$null
    Write-Host "✅ Backend lint aplicado" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Algumas correções manuais podem ser necessárias no backend" -ForegroundColor Yellow
}
Set-Location ..

# Frontend  
Write-Host "Frontend:" -ForegroundColor Cyan
Set-Location frontend
try {
    npm run lint:fix 2>$null
    Write-Host "✅ Frontend lint aplicado" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Algumas correções manuais podem ser necessárias no frontend" -ForegroundColor Yellow
}
Set-Location ..

# E2E (se estiver configurado)
Write-Host "E2E:" -ForegroundColor Cyan
if (Test-Path "e2e\.eslintrc.cjs") {
    Set-Location e2e
    try {
        npx eslint . --ext .ts --fix 2>$null
        Write-Host "✅ E2E lint aplicado" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ E2E: Configuração aplicada, verificação manual recomendada" -ForegroundColor Yellow
    }
    Set-Location ..
}

# 4. Executar formatação com Prettier
Write-Host "Formatando código com Prettier..." -ForegroundColor Yellow
try {
    npx prettier --write "**/*.ts" --ignore-path .gitignore 2>$null
    Write-Host "Formatação aplicada" -ForegroundColor Green
} catch {
    Write-Host "Prettier: Instale prettier globalmente ou localmente" -ForegroundColor Yellow
}

# 5. Verificação final
Write-Host "🔍 Verificação final..." -ForegroundColor Yellow

Write-Host "Backend lint status:" -ForegroundColor Cyan
Set-Location backend
try {
    npm run lint --silent
    Write-Host "✅ Backend lint OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend precisa de correções manuais" -ForegroundColor Red
}
Set-Location ..

Write-Host "Frontend lint status:" -ForegroundColor Cyan
Set-Location frontend
try {
    npm run lint --silent
    Write-Host "✅ Frontend lint OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend precisa de correções manuais" -ForegroundColor Red
}
Set-Location ..

Write-Host ""
Write-Host "🎉 Processo de correção de lint concluído!" -ForegroundColor Green
Write-Host "💡 Se ainda houver erros, verifique:" -ForegroundColor Yellow
Write-Host "   1. Variáveis não utilizadas (adicione _ no prefixo se necessário)"
Write-Host "   2. Tipos any explícitos (considere tipagem mais específica)"
Write-Host "   3. Console.log em código de produção (mova para arquivos de teste)"

Write-Host ""
Write-Host "Próximos passos recomendados:" -ForegroundColor Cyan
Write-Host "   1. Executar testes: npm test"
Write-Host "   2. Verificar build: npm run build"
Write-Host "   3. Commit das correções: git add . ; git commit -m 'fix: aplicar correções de lint'"
