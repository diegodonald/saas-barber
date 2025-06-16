#!/usr/bin/env pwsh
param(
    [switch]$Force  # Sobrescrever arquivos existentes
)

Write-Host "=== Configurando Ambiente SaaS Barber ===" -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na raiz do projeto" -ForegroundColor Red
    exit 1
}

# Função para copiar arquivo de exemplo
function Copy-EnvExample {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Description
    )
    
    if (Test-Path $Source) {
        if ((Test-Path $Destination) -and -not $Force) {
            Write-Host "AVISO: $Destination já existe. Use -Force para sobrescrever" -ForegroundColor Yellow
            return $false
        } else {
            Copy-Item $Source $Destination -Force
            Write-Host "CRIADO: $Description" -ForegroundColor Green
            return $true
        }
    } else {
        Write-Host "ERRO: $Source não encontrado" -ForegroundColor Red
        return $false
    }
}

$Success = 0
$Total = 0

# Configurar Backend
Write-Host "`n[1/2] Configurando Backend..." -ForegroundColor Cyan
$Total++
if (Copy-EnvExample "backend\.env.example" "backend\.env" "Configuração do Backend") {
    $Success++
}

# Configurar Frontend  
Write-Host "`n[2/2] Configurando Frontend..." -ForegroundColor Cyan
$Total++
if (Copy-EnvExample "frontend\.env.example" "frontend\.env" "Configuração do Frontend") {
    $Success++
}

# Verificar Docker
Write-Host "`n=== Verificando Docker ===" -ForegroundColor Cyan
try {
    $dockerInfo = docker --version 2>&1
    Write-Host "Docker encontrado: $dockerInfo" -ForegroundColor Green
    
    Write-Host "Iniciando serviços Docker..." -ForegroundColor Yellow
    & docker-compose up -d 2>&1 | Write-Host
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCESSO: Serviços Docker iniciados" -ForegroundColor Green
    } else {
        Write-Host "AVISO: Problemas ao iniciar Docker. Verifique docker-compose.yml" -ForegroundColor Yellow
    }
} catch {
    Write-Host "AVISO: Docker não encontrado. Instale Docker para usar o ambiente completo" -ForegroundColor Yellow
}

# Verificar Node/npm
Write-Host "`n=== Verificando Node.js ===" -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>&1
    $npmVersion = npm --version 2>&1
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Node.js não encontrado. Instale Node.js 18+" -ForegroundColor Red
}

# Resumo
Write-Host "`n=== RESUMO DA CONFIGURAÇÃO ===" -ForegroundColor Magenta
Write-Host "Arquivos configurados: $Success/$Total" -ForegroundColor $(if ($Success -eq $Total) { "Green" } else { "Yellow" })

if ($Success -eq $Total) {
    Write-Host "`nPróximos passos:" -ForegroundColor Cyan
    Write-Host "1. Edite os arquivos .env conforme necessário" -ForegroundColor White
    Write-Host "2. Execute: npm run db:migrate (se usar PostgreSQL)" -ForegroundColor White
    Write-Host "3. Execute: npm run dev (para desenvolvimento)" -ForegroundColor White
    Write-Host "4. Execute: .\run-tests.ps1 (para validar)" -ForegroundColor White
} else {
    Write-Host "`nAlguns arquivos não foram criados. Verifique os avisos acima." -ForegroundColor Yellow
}

exit $(if ($Success -eq $Total) { 0 } else { 1 })