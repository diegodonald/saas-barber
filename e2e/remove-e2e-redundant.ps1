# Script para remover arquivos de testes E2E redundantes do SaaS Barber
# Mantém apenas os fluxos críticos e specs de integração essenciais

$filesToRemove = @(
    "complete-flow-live.spec.ts",
    "real-system-flow.spec.ts",
    "e2e-flow.spec.ts",
    "dashboard.spec.ts",
    "appointments.spec.ts",
    "user-roles.spec.ts",
    "debug.spec.ts",
    "corsfixvalidation_ef9d7e84-2487-485b-85cd-630cc3405245.spec.ts",
    "auth.spec.ts"
)

foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "Removido: $file"
    } else {
        Write-Host "Não encontrado: $file"
    }
}

Write-Host "Remoção concluída. Apenas specs essenciais mantidos."
