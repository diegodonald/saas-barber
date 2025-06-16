#!/bin/bash

# Script para aplicar todas as correções de lint no projeto SaaS Barber
# Execute: ./scripts/fix-all-lint.sh

echo "🔧 Iniciando correções completas de lint..."

# 1. Aplicar configurações ESLint melhoradas
echo "📋 Aplicando configurações ESLint otimizadas..."
if [ -f "backend/.eslintrc.improved.js" ]; then
  cp backend/.eslintrc.improved.js backend/.eslintrc.js
  echo "✅ Backend ESLint atualizado"
fi

if [ -f "frontend/.eslintrc.improved.cjs" ]; then
  cp frontend/.eslintrc.improved.cjs frontend/.eslintrc.cjs
  echo "✅ Frontend ESLint atualizado"
fi

# 2. Limpar console.log desnecessários
echo "🧹 Removendo console.log desnecessários..."
if [ -f "scripts/clean-console-logs.js" ]; then
  node scripts/clean-console-logs.js
fi

# 3. Executar correções automáticas de lint
echo "🔨 Aplicando correções automáticas..."

# Backend
echo "Backend:"
cd backend
npm run lint:fix 2>/dev/null || echo "⚠️ Algumas correções manuais podem ser necessárias no backend"
cd ..

# Frontend  
echo "Frontend:"
cd frontend
npm run lint:fix 2>/dev/null || echo "⚠️ Algumas correções manuais podem ser necessárias no frontend"
cd ..

# E2E (se estiver configurado)
echo "E2E:"
if [ -f "e2e/.eslintrc.cjs" ]; then
  cd e2e
  npx eslint . --ext .ts --fix 2>/dev/null || echo "⚠️ E2E: Configuração aplicada, verificação manual recomendada"
  cd ..
fi

# 4. Executar formatação com Prettier
echo "🎨 Formatando código com Prettier..."
npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}" --ignore-path .gitignore 2>/dev/null || echo "⚠️ Prettier: Instale prettier globalmente ou localmente"

# 5. Verificação final
echo "🔍 Verificação final..."
echo "Backend lint status:"
cd backend && npm run lint --silent && echo "✅ Backend lint OK" || echo "❌ Backend precisa de correções manuais"
cd ..

echo "Frontend lint status:"
cd frontend && npm run lint --silent && echo "✅ Frontend lint OK" || echo "❌ Frontend precisa de correções manuais"
cd ..

echo ""
echo "🎉 Processo de correção de lint concluído!"
echo "💡 Se ainda houver erros, verifique:"
echo "   1. Variáveis não utilizadas (adicione _ no prefixo se necessário)"
echo "   2. Tipos any explícitos (considere tipagem mais específica)"
echo "   3. Console.log em código de produção (mova para arquivos de teste)"

echo ""
echo "📝 Próximos passos recomendados:"
echo "   1. Executar testes: npm test"
echo "   2. Verificar build: npm run build"
echo "   3. Commit das correções: git add . && git commit -m 'fix: aplicar correções de lint'"
