# 🧪 Guia de Testes - SaaS Barber

Este documento descreve como executar e debugar os testes do projeto SaaS Barber.

## 🆕 **Atualizações Recentes**

- ✅ Corrigidos problemas de import no backend (`index.ts`, `barberService.test.ts`)
- ✅ Criado arquivo de setup para Vitest (`frontend/src/test/setup.ts`)
- ✅ Scripts automatizados para execução de testes (`run-tests.ps1`, `run-tests.bat`)
- ✅ Scripts de configuração de ambiente (`setup-env.ps1`, `setup-env.bat`)
- ✅ Templates de configuração (`.env.example`)

## ⚡ **Início Rápido**

```bash
# 1. Configurar ambiente
.\setup-env.bat          # Windows CMD
# ou 
.\setup-env.ps1          # PowerShell

# 2. Executar todos os testes
.\run-tests.bat          # Windows CMD
# ou
.\run-tests.ps1          # PowerShell
```

## 📋 Pré-requisitos

1. **Node.js 18+** instalado
2. **Docker** e **Docker Compose** instalados
3. **PostgreSQL** rodando (via Docker ou local)
4. **Dependências instaladas** (`npm install` na raiz)

## 🚀 Executando os Testes

### Método 1: Script PowerShell (Recomendado para Windows)

```powershell
# Execute na raiz do projeto
.\run-tests.ps1
```

### Método 2: Comandos Manuais

#### Backend (Jest)
```bash
cd backend
npm test                    # Executar todos os testes
npm run test:watch         # Modo watch
npm run test:coverage      # Com cobertura
```

#### Frontend (Vitest)
```bash
cd frontend
npm test                    # Executar todos os testes
npm run test:ui            # Interface visual
npm run test:coverage      # Com cobertura
```

#### E2E (Playwright)
```bash
npm run test:e2e           # Todos os testes E2E
npm run test:e2e:ui        # Interface do Playwright
npm run test:e2e:headed    # Com browser visível
```

## 🔧 Configuração do Ambiente de Teste

### 0. Configuração Automática (Novo!)

```bash
# Configurar automaticamente todos os arquivos de ambiente
.\setup-env.bat         # Windows CMD
# ou
.\setup-env.ps1         # PowerShell

# Isso criará:
# - backend/.env (baseado em .env.example)
# - frontend/.env (baseado em .env.example)
```

### 1. Banco de Dados de Teste

O projeto usa um banco separado para testes:

```bash
# Criar banco de teste
createdb saas_barber_test

# Ou via Docker
docker exec -it saas_barber_db createdb -U postgres saas_barber_test
```

### 2. Variáveis de Ambiente

Certifique-se de que o arquivo `backend/.env.test` está configurado:

```env
NODE_ENV=test
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/saas_barber_test?schema=public"
JWT_SECRET="teste-jwt-secret-key"
```

### 3. Migração do Banco de Teste

```bash
cd backend
npm run db:migrate
```

## 🧩 Estrutura dos Testes

### Backend (`backend/src/tests/`)
- `simple.test.ts` - Testes básicos
- `auth.test.ts` - Autenticação
- `appointments.test.ts` - Agendamentos
- `barberService.test.ts` - Serviços de barbeiro
- `services.test.ts` - Serviços gerais
- `testUtils.ts` - Utilitários de teste

### Frontend (`frontend/src/tests/`)
- `hooks/` - Testes de hooks customizados
- Configuração: `frontend/src/test/setup.ts`

### E2E (`e2e/`)
- Testes de fluxo completo
- Configuração: `playwright.config.ts`

## 🐛 Troubleshooting

### Problema: "Comando npm não encontrado"
**Solução:** Use `npm.cmd` no Windows ou configure o PATH

### Problema: "Database connection failed"
**Soluções:**
1. Verificar se PostgreSQL está rodando
2. Conferir URL de conexão no `.env.test`
3. Executar `docker-compose up -d`

### Problema: "Port already in use"
**Soluções:**
1. Parar aplicação em execução
2. Usar porta diferente no `.env.test`
3. Matar processo: `npx kill-port 3001`

### Problema: "Module not found" 
**Soluções:**
1. Executar `npm install` na raiz
2. Verificar imports nos arquivos de teste
3. Limpar node_modules: `npm run clean && npm install`

### Problema: Testes lentos
**Soluções:**
1. Usar `--detectOpenHandles` no Jest
2. Verificar limpeza do banco entre testes
3. Considerar usar banco em memória para testes

## 📊 Cobertura de Testes

### Visualizar Cobertura

```bash
# Backend
cd backend && npm run test:coverage
open coverage/lcov-report/index.html

# Frontend  
cd frontend && npm run test:coverage
open coverage/index.html
```

### Metas de Cobertura
- **Mínimo:** 70% de cobertura geral
- **Controllers:** 80%+ 
- **Services:** 90%+
- **Utils:** 95%+

## 🚀 CI/CD

Os testes são executados automaticamente:
- **PR:** Todos os testes devem passar
- **Deploy:** Inclui testes + cobertura
- **Nightly:** Testes E2E completos

## 📝 Escrevendo Novos Testes

### Backend (Jest + Supertest)
```typescript
describe('Novo recurso', () => {
  beforeEach(async () => {
    await cleanDatabase();
    // Setup
  });

  test('deve fazer X', async () => {
    // Arrange
    // Act 
    // Assert
  });
});
```

### Frontend (Vitest + Testing Library)
```typescript
describe('NovoComponente', () => {
  test('deve renderizar corretamente', () => {
    render(<NovoComponente />);
    expect(screen.getByText('Texto')).toBeInTheDocument();
  });
});
```

## 🔍 Debugging

### VSCode
1. Usar extensão Jest/Vitest
2. Configurar breakpoints
3. Executar em modo debug

### Console
```bash
# Debug Jest
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug específico
npm test -- --testNamePattern="nome do teste"
```