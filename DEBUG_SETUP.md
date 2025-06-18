# Configuração de Debugging - SaaS Barber

## 🎯 Configurações Criadas

### 1. Launch Configurations (`.vscode/launch.json`)

**Configurações de Debug Disponíveis:**

- **🚀 Debug Backend (Node.js + TypeScript)**: Debug completo do servidor
  backend
- **🧪 Debug Backend Tests (Jest)**: Debug dos testes do backend
- **🎨 Debug Frontend (Vite Dev Server)**: Debug do servidor de desenvolvimento
  frontend
- **⚡ Debug Frontend Tests (Vitest)**: Debug dos testes do frontend
- **🎭 Debug E2E Tests (Playwright)**: Debug dos testes E2E com interface visual
- **🐞 Debug E2E Specific Test**: Debug de um teste E2E específico
- **🔄 Debug Full Stack**: Debug completo de backend + frontend

**Configurações Compostas:**

- **🚀 Launch Full Stack Debug**: Inicia backend e frontend simultaneamente
- **🧪 Run All Tests Debug**: Executa todos os testes em modo debug

### 2. Tasks (`.vscode/tasks.json`)

**Tasks Organizadas por Categoria:**

**Backend:**

- 🚀 Start Backend Dev Server
- 🧪 Run Backend Tests
- 🔍 Type Check Backend
- 🧹 Lint Backend
- 🏗️ Build Backend

**Frontend:**

- 🎨 Start Frontend Dev Server
- ⚡ Run Frontend Tests
- 🔍 Type Check Frontend
- 🧹 Lint Frontend
- 🏗️ Build Frontend

**Full Stack:**

- 🔄 Start Full Stack Dev (padrão)
- 🎭 Run E2E Tests
- 🔍 Type Check All
- 🧹 Lint Fix All
- 🏗️ Build All

**Database:**

- 🗄️ Database Migrate
- 🌱 Database Seed
- 🔄 Database Reset

**Docker:**

- 🐳 Docker Up
- 🐳 Docker Down

### 3. Settings (`.vscode/settings.json`)

**Configurações Aplicadas:**

- TypeScript com auto-imports e navegação inteligente
- Debugging avançado com breakpoints em qualquer lugar
- Terminal PowerShell como padrão
- Formatação automática no save
- ESLint fix automático
- Configurações específicas para Jest e Vitest
- File nesting inteligente
- Exclusão de arquivos de build/node_modules

### 4. Extensions (`.vscode/extensions.json`)

**Extensões Recomendadas:**

- TypeScript/JavaScript: `ms-vscode.vscode-typescript-next`,
  `esbenp.prettier-vscode`, `dbaeumer.vscode-eslint`
- Debugging: `ms-vscode.js-debug`, `ms-vscode.js-debug-nightly`
- Testing: `orta.vscode-jest`, `zixuanchen.vitest-explorer`,
  `ms-playwright.playwright`
- React: `bradlc.vscode-tailwindcss`, `formulahendry.auto-rename-tag`
- Database: `Prisma.prisma`, `ms-vscode.vscode-sql`
- Docker: `ms-azuretools.vscode-docker`
- Git: `eamodio.gitlens`
- Utilitários: `ms-vscode.vscode-thunder-client`, `humao.rest-client`

### 5. Code Snippets (`.vscode/typescript.code-snippets`)

**Snippets Disponíveis:**

- `rfc` - React Functional Component
- `rhook` - React Hook personalizado
- `eroute` - Express Route Handler
- `pservice` - Prisma Service Method
- `jtest` - Jest Test Suite
- `vtest` - Vitest Test
- `e2etest` - Playwright E2E Test
- `errormw` - Error Handler Middleware
- `tinterface` - TypeScript Interface
- `ttype` - TypeScript Type
- `apiresponse` - API Response Type
- `rquery` - React Query Hook
- `cld` - Console Log Debug
- `tryc` - Try-Catch Block

## 🚀 Como Usar

### Debugging

1. **Pressione F5** ou vá em **Run and Debug** no sidebar
2. Escolha a configuração de debug desejada
3. Para debug full-stack, use **"🚀 Launch Full Stack Debug"**

### Tasks

1. **Pressione Ctrl+Shift+P**
2. Digite **"Tasks: Run Task"**
3. Escolha a task desejada
4. Para desenvolvimento, use **"🔄 Start Full Stack Dev"**

### Atalhos Úteis

- **F5**: Iniciar debugging
- **Ctrl+F5**: Executar sem debugging
- **Shift+F5**: Parar debugging
- **F9**: Toggle breakpoint
- **F10**: Step over
- **F11**: Step into
- **Shift+F11**: Step out
- **Ctrl+Shift+F5**: Restart debugging

### Breakpoints

- Clique na margem esquerda do editor para adicionar breakpoints
- Breakpoints condicionais: clique direito no breakpoint
- Logpoints: clique direito e escolha "Add Logpoint"

### Debug Console

- Use o Debug Console para executar código no contexto atual
- Acesse variáveis e execute funções durante o debug

## 🔧 Comandos PowerShell Úteis

```powershell
# Iniciar desenvolvimento full-stack
npm run dev

# Executar apenas backend
npm run dev:backend

# Executar apenas frontend
npm run dev:frontend

# Executar todos os testes
npm test

# Executar testes E2E
npm run test:e2e

# Type check completo
npm run type-check

# Lint e fix
npm run lint:fix

# Build completo
npm run build

# Subir Docker
npm run docker:up

# Migrar banco
npm run db:migrate

# Seed do banco
npm run db:seed
```

## 🐛 Troubleshooting

### Problema: Debugging não conecta

**Solução:**

1. Verifique se as dependências estão instaladas
2. Confirme que o .env está configurado
3. Verifique se não há outros processos usando as portas

### Problema: Breakpoints não param

**Solução:**

1. Verifique se os source maps estão habilitados
2. Confirme que o arquivo foi salvo
3. Reinicie o debugging session

### Problema: Testes não executam

**Solução:**

1. Verifique se o banco de testes está configurado
2. Confirme que o .env.test existe
3. Execute `npm run db:migrate` primeiro

### Problema: E2E Tests falham

**Solução:**

1. Verifique se backend e frontend estão rodando
2. Confirme que o Playwright está instalado
3. Execute `npx playwright install` se necessário
