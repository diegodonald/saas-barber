@echo off
echo.
echo ======================================
echo Configurando Ambiente SaaS Barber
echo ======================================
echo.

REM Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ERRO: Execute este script na raiz do projeto
    pause
    exit /b 1
)

echo [1/2] Configurando Backend...
if exist "backend\.env.example" (
    if not exist "backend\.env" (
        copy "backend\.env.example" "backend\.env" >nul
        echo CRIADO: backend\.env
    ) else (
        echo AVISO: backend\.env já existe
    )
) else (
    echo ERRO: backend\.env.example não encontrado
)

echo.
echo [2/2] Configurando Frontend...
if exist "frontend\.env.example" (
    if not exist "frontend\.env" (
        copy "frontend\.env.example" "frontend\.env" >nul
        echo CRIADO: frontend\.env
    ) else (
        echo AVISO: frontend\.env já existe
    )
) else (
    echo ERRO: frontend\.env.example não encontrado
)

echo.
echo ======================================
echo Configuração concluída!
echo.
echo Próximos passos:
echo 1. Edite os arquivos .env conforme necessário
echo 2. Execute: npm run docker:up
echo 3. Execute: npm run db:migrate  
echo 4. Execute: run-tests.bat
echo ======================================
echo.
pause