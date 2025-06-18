# Script de Setup de Debugging - SaaS Barber
# Executa verificações e configurações necessárias para debugging

Write-Host "🔧 Configurando ambiente de debugging para SaaS Barber..." -ForegroundColor Cyan

# Função para verificar se um comando existe
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Função para verificar se uma extensão do VS Code está instalada
function Test-VSCodeExtension {
    param([string]$ExtensionId)
    $extensions = code --list-extensions 2>$null
    return $extensions -contains $ExtensionId
}

Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Yellow

# Verificar Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ Node.js não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ npm não encontrado." -ForegroundColor Red
    exit 1
}

# Verificar VS Code
if (Test-Command "code") {
    Write-Host "✅ VS Code CLI disponível" -ForegroundColor Green
}
else {
    Write-Host "⚠️  VS Code CLI não disponível. Algumas funcionalidades podem não funcionar." -ForegroundColor Yellow
}

# Verificar Docker
if (Test-Command "docker") {
    Write-Host "✅ Docker disponível" -ForegroundColor Green
    
    # Verificar se Docker está rodando
    try {
        docker ps >$null 2>&1
        Write-Host "✅ Docker está rodando" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Docker não está rodando. Execute 'docker desktop' primeiro." -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠️  Docker não encontrado. Alguns testes podem falhar." -ForegroundColor Yellow
}

Write-Host "📦 Verificando dependências do projeto..." -ForegroundColor Yellow

# Verificar se node_modules existe na raiz
if (Test-Path "node_modules") {
    Write-Host "✅ Dependências raiz instaladas" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Dependências raiz não instaladas. Executando 'npm install'..." -ForegroundColor Yellow
    npm install
}

# Verificar backend
if (Test-Path "backend/node_modules") {
    Write-Host "✅ Dependências backend instaladas" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Dependências backend não instaladas. Executando 'npm install' no backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Verificar frontend
if (Test-Path "frontend/node_modules") {
    Write-Host "✅ Dependências frontend instaladas" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Dependências frontend não instaladas. Executando 'npm install' no frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host "🔍 Verificando arquivos de configuração..." -ForegroundColor Yellow

# Verificar .env files
if (Test-Path "backend/.env") {
    Write-Host "✅ backend/.env encontrado" -ForegroundColor Green
}
else {
    Write-Host "⚠️  backend/.env não encontrado. Crie o arquivo baseado no .env.example" -ForegroundColor Yellow
}

if (Test-Path "backend/.env.test") {
    Write-Host "✅ backend/.env.test encontrado" -ForegroundColor Green
}
else {
    Write-Host "⚠️  backend/.env.test não encontrado. Crie o arquivo para testes" -ForegroundColor Yellow
}

# Verificar Prisma
Write-Host "🗄️  Verificando configuração do banco..." -ForegroundColor Yellow
Set-Location backend

try {
    npx prisma db push --accept-data-loss >$null 2>&1
    Write-Host "✅ Banco de dados configurado" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Erro na configuração do banco. Verifique a string de conexão." -ForegroundColor Yellow
}

Set-Location ..

# Verificar extensões essenciais do VS Code
if (Test-Command "code") {
    Write-Host "🔌 Verificando extensões do VS Code..." -ForegroundColor Yellow
    
    $essentialExtensions = @(
        "ms-vscode.vscode-typescript-next",
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "ms-vscode.js-debug",
        "orta.vscode-jest",
        "ms-playwright.playwright",
        "Prisma.prisma"
    )
    
    foreach ($ext in $essentialExtensions) {
        if (Test-VSCodeExtension $ext) {
            Write-Host "  ✅ $ext" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ $ext - instalando..." -ForegroundColor Yellow
            code --install-extension $ext
        }
    }
}

Write-Host "🎭 Instalando Playwright browsers..." -ForegroundColor Yellow
try {
    npx playwright install >$null 2>&1
    Write-Host "✅ Playwright browsers instalados" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Erro ao instalar Playwright browsers" -ForegroundColor Yellow
}

Write-Host "🧪 Executando verificação de tipos..." -ForegroundColor Yellow

# Type check backend
Set-Location backend
try {
    npm run type-check >$null 2>&1
    Write-Host "✅ Backend: Type check passou" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Backend: Erros de tipo encontrados" -ForegroundColor Yellow
}
Set-Location ..

# Type check frontend
Set-Location frontend
try {
    npm run type-check >$null 2>&1
    Write-Host "✅ Frontend: Type check passou" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Frontend: Erros de tipo encontrados" -ForegroundColor Yellow
}
Set-Location ..

Write-Host "🚀 Setup de debugging concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Abra o VS Code: code ." -ForegroundColor White
Write-Host "2. Pressione F5 para iniciar o debugging" -ForegroundColor White
Write-Host "3. Escolha 'Launch Full Stack Debug' para debug completo" -ForegroundColor White
Write-Host "4. Ou use Ctrl+Shift+P > 'Tasks: Run Task' > 'Start Full Stack Dev'" -ForegroundColor White
Write-Host ""
Write-Host "📖 Consulte DEBUG_SETUP.md para mais detalhes" -ForegroundColor Cyan

# Perguntar se quer abrir o VS Code
$openVSCode = Read-Host "Deseja abrir o VS Code agora? (y/n)"
if ($openVSCode -eq "y" -or $openVSCode -eq "Y") {
    code .
}
