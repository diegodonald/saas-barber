# Script de Setup de Debugging - SaaS Barber
# Executa verificacoes e configuracoes necessarias para debugging

Write-Host "Configurando ambiente de debugging para SaaS Barber..." -ForegroundColor Cyan

# Funcao para verificar se um comando existe
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

# Funcao para verificar se uma extensao do VS Code esta instalada
function Test-VSCodeExtension {
    param([string]$ExtensionId)
    try {
        $extensions = code --list-extensions 2>$null
        return $extensions -contains $ExtensionId
    }
    catch {
        return $false
    }
}

Write-Host "Verificando pre-requisitos..." -ForegroundColor Yellow

# Verificar Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
}
else {
    Write-Host "[ERRO] Node.js nao encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "[OK] npm: v$npmVersion" -ForegroundColor Green
}
else {
    Write-Host "[ERRO] npm nao encontrado." -ForegroundColor Red
    exit 1
}

# Verificar VS Code
if (Test-Command "code") {
    Write-Host "[OK] VS Code CLI disponivel" -ForegroundColor Green
}
else {
    Write-Host "[AVISO] VS Code CLI nao disponivel. Algumas funcionalidades podem nao funcionar." -ForegroundColor Yellow
}

# Verificar Docker
if (Test-Command "docker") {
    Write-Host "[OK] Docker disponivel" -ForegroundColor Green
    
    # Verificar se Docker esta rodando
    try {
        docker ps >$null 2>&1
        Write-Host "[OK] Docker esta rodando" -ForegroundColor Green
    }
    catch {
        Write-Host "[AVISO] Docker nao esta rodando. Execute 'docker desktop' primeiro." -ForegroundColor Yellow
    }
}
else {
    Write-Host "[AVISO] Docker nao encontrado. Alguns testes podem falhar." -ForegroundColor Yellow
}

Write-Host "Verificando dependencias do projeto..." -ForegroundColor Yellow

# Verificar se node_modules existe na raiz
if (Test-Path "node_modules") {
    Write-Host "[OK] Dependencias raiz instaladas" -ForegroundColor Green
}
else {
    Write-Host "[AVISO] Dependencias raiz nao instaladas. Executando 'npm install'..." -ForegroundColor Yellow
    npm install
}

# Verificar backend
if (Test-Path "backend/node_modules") {
    Write-Host "[OK] Dependencias backend instaladas" -ForegroundColor Green
}
else {
    Write-Host "[AVISO] Dependencias backend nao instaladas. Executando 'npm install' no backend..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
}

# Verificar frontend
if (Test-Path "frontend/node_modules") {
    Write-Host "[OK] Dependencias frontend instaladas" -ForegroundColor Green
}
else {
    Write-Host "[AVISO] Dependencias frontend nao instaladas. Executando 'npm install' no frontend..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

Write-Host "Verificando arquivos de configuracao..." -ForegroundColor Yellow

# Verificar .env files
if (Test-Path "backend/.env") {
    Write-Host "[OK] backend/.env encontrado" -ForegroundColor Green
}
else {
    Write-Host "[AVISO] backend/.env nao encontrado. Crie o arquivo baseado no .env.example" -ForegroundColor Yellow
}

if (Test-Path "backend/.env.test") {
    Write-Host "[OK] backend/.env.test encontrado" -ForegroundColor Green
}
else {
    Write-Host "[AVISO] backend/.env.test nao encontrado. Crie o arquivo para testes" -ForegroundColor Yellow
}

# Verificar extensoes essenciais do VS Code
if (Test-Command "code") {
    Write-Host "Verificando extensoes do VS Code..." -ForegroundColor Yellow
    
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
            Write-Host "  [OK] $ext" -ForegroundColor Green
        }
        else {
            Write-Host "  [INSTALANDO] $ext..." -ForegroundColor Yellow
            code --install-extension $ext
        }
    }
}

Write-Host "Instalando Playwright browsers..." -ForegroundColor Yellow
try {
    npx playwright install >$null 2>&1
    Write-Host "[OK] Playwright browsers instalados" -ForegroundColor Green
}
catch {
    Write-Host "[AVISO] Erro ao instalar Playwright browsers" -ForegroundColor Yellow
}

Write-Host "Executando verificacao de tipos..." -ForegroundColor Yellow

# Type check backend
Push-Location backend
try {
    npm run type-check >$null 2>&1
    Write-Host "[OK] Backend: Type check passou" -ForegroundColor Green
}
catch {
    Write-Host "[AVISO] Backend: Erros de tipo encontrados" -ForegroundColor Yellow
}
Pop-Location

# Type check frontend
Push-Location frontend
try {
    npm run type-check >$null 2>&1
    Write-Host "[OK] Frontend: Type check passou" -ForegroundColor Green
}
catch {
    Write-Host "[AVISO] Frontend: Erros de tipo encontrados" -ForegroundColor Yellow
}
Pop-Location

Write-Host "Setup de debugging concluido!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Abra o VS Code: code ." -ForegroundColor White
Write-Host "2. Pressione F5 para iniciar o debugging" -ForegroundColor White
Write-Host "3. Escolha 'Launch Full Stack Debug' para debug completo" -ForegroundColor White
Write-Host "4. Ou use Ctrl+Shift+P > 'Tasks: Run Task' > 'Start Full Stack Dev'" -ForegroundColor White
Write-Host ""
Write-Host "Consulte DEBUG_SETUP.md para mais detalhes" -ForegroundColor Cyan

# Perguntar se quer abrir o VS Code
$openVSCode = Read-Host "Deseja abrir o VS Code agora? (y/n)"
if ($openVSCode -eq "y" -or $openVSCode -eq "Y") {
    code .
}
