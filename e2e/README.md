# 🧪 Testes E2E - Sistema de Agendamentos SaaS Barber

Este diretório contém uma suíte completa de testes funcionais e end-to-end para validar o sistema de agendamentos implementado.

## 📋 Suítes de Teste Disponíveis

### 1. 📊 Dashboard Tests (`dashboard.spec.ts`)
**Objetivo**: Validar funcionalidades do dashboard e métricas

- ✅ Exibição de métricas reais
- ✅ Skeleton loading durante carregamento
- ✅ Tratamento de erros de API
- ✅ Navegação entre seções
- ✅ Adaptação de interface por role
- ✅ Responsividade mobile
- ✅ Funcionalidade de logout

### 2. 📅 Appointments Tests (`appointments.spec.ts`)
**Objetivo**: Validar operações CRUD e fluxos de status dos agendamentos

- ✅ Listagem de agendamentos
- ✅ Criação de novos agendamentos
- ✅ Alteração de status (SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED)
- ✅ Cancelamento de agendamentos
- ✅ Marcação como no-show
- ✅ Filtros e busca
- ✅ Validação de formulários
- ✅ Horários disponíveis

### 3. 🔗 API Integration Tests (`api-integration.spec.ts`)
**Objetivo**: Validar integração entre frontend e backend

- ✅ Autenticação e autorização
- ✅ Endpoints de estatísticas
- ✅ CRUD de agendamentos via API
- ✅ Fluxos de status via API
- ✅ Filtros e paginação
- ✅ Validação de dados
- ✅ Tratamento de erros

### 4. 👥 User Roles Tests (`user-roles.spec.ts`)
**Objetivo**: Validar permissões e funcionalidades específicas por role

- ✅ **SUPER_ADMIN**: Acesso global e configurações
- ✅ **ADMIN**: Gestão da barbearia
- ✅ **BARBER**: Gerenciamento pessoal
- ✅ **CLIENT**: Interface simplificada
- ✅ Segurança e autorização

### 5. 🔄 E2E Flow Tests (`e2e-flow.spec.ts`)
**Objetivo**: Validar jornada completa do usuário

- ✅ Login → Dashboard → Criar Agendamento → Gerenciar Status → Métricas
- ✅ Tratamento de erros e falhas
- ✅ Performance com muitos dados
- ✅ Fluxo completo de agendamento

## 🚀 Como Executar os Testes

### Pré-requisitos

1. **Backend em execução** na porta 3001
2. **Frontend em execução** na porta 3000
3. **Playwright instalado**

```bash
# Instalar Playwright se necessário
npm install @playwright/test
npx playwright install
```

### Execução Individual

```bash
# Executar suíte específica
npx playwright test dashboard.spec.ts
npx playwright test appointments.spec.ts
npx playwright test api-integration.spec.ts
npx playwright test user-roles.spec.ts
npx playwright test e2e-flow.spec.ts
```

### Execução com Test Runner (Recomendado)

```bash
# Compilar e executar o test runner
npx tsc test-runner.ts
node test-runner.js list  # Listar suítes disponíveis

# Executar suíte específica
node test-runner.js run dashboard
node test-runner.js run appointments --headed

# Executar todas as suítes
node test-runner.js all

# Execução com interface gráfica (útil para debug)
node test-runner.js run e2e-flow --headed --debug
```

### Opções Úteis do Playwright

```bash
# Interface gráfica para debug
--headed

# Modo debug passo-a-passo
--debug

# Interface de debug do Playwright
--ui

# Executar apenas no Chrome
--project=chromium

# Execução sequencial (não paralela)
--workers=1

# Gerar relatório HTML
--reporter=html
```

## 🔧 Configuração dos Testes

### Mocks e Dados de Teste

Os testes utilizam mocks para simular:

- **APIs do backend** com dados controlados
- **Autenticação** com diferentes roles
- **Estados de erro** para validar tratamento
- **Dados dinâmicos** para testes de métricas

### Estrutura dos Dados Mock

```typescript
// Usuário Barbeiro
{
  id: 'barber-1',
  name: 'João Barbeiro',
  email: 'joao@barbershop.com',
  roles: ['BARBER'],
  barbershopId: 'barbershop-1'
}

// Agendamento Padrão
{
  id: 'appointment-1',
  status: 'SCHEDULED',
  totalPrice: 50.00,
  client: { name: 'Carlos Cliente' },
  service: { name: 'Corte Masculino', price: 50.00 }
}
```

## 📊 Cobertura de Testes

### Funcionalidades Testadas

| Funcionalidade | Dashboard | Appointments | API | Roles | E2E |
|---------------|-----------|--------------|-----|-------|-----|
| Login/Logout | ✅ | ❌ | ❌ | ✅ | ✅ |
| Métricas Dashboard | ✅ | ❌ | ✅ | ✅ | ✅ |
| CRUD Agendamentos | ❌ | ✅ | ✅ | ❌ | ✅ |
| Fluxos de Status | ❌ | ✅ | ✅ | ❌ | ✅ |
| Filtros/Busca | ❌ | ✅ | ✅ | ❌ | ✅ |
| Permissões | ✅ | ✅ | ✅ | ✅ | ❌ |
| Responsividade | ✅ | ❌ | ❌ | ❌ | ✅ |
| Tratamento Erros | ✅ | ✅ | ✅ | ✅ | ✅ |

### Status dos Testes

- 🟢 **Dashboard**: 7/7 testes implementados
- 🟢 **Appointments**: 12/12 testes implementados  
- 🟢 **API Integration**: 15/15 testes implementados
- 🟢 **User Roles**: 8/8 testes implementados
- 🟢 **E2E Flow**: 3/3 testes implementados

**Total**: 45 testes implementados ✅

## 🐛 Debug e Troubleshooting

### Problemas Comuns

1. **Teste falha no login**
   - Verificar se frontend está na porta 3000
   - Verificar mocks de autenticação

2. **API tests falham**
   - Verificar se backend está na porta 3001
   - Verificar endpoints de autenticação

3. **Timeouts**
   - Aumentar timeout nos testes
   - Verificar se aplicação está carregando corretamente

### Modo Debug

```bash
# Debug específico
node test-runner.js run dashboard --debug

# Ver browser durante execução
node test-runner.js run appointments --headed

# Interface de debug
npx playwright test --ui
```

### Logs e Relatórios

```bash
# Gerar relatório HTML
npx playwright test --reporter=html

# Ver relatório
npx playwright show-report
```

## 🔄 Integração Contínua

### GitHub Actions (Exemplo)

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Start backend
        run: npm run dev:backend &
      - name: Start frontend  
        run: npm run dev:frontend &
      - name: Wait for services
        run: sleep 30
      - name: Run E2E tests
        run: node test-runner.js all
```

## 📈 Próximos Passos

### Melhorias Futuras

1. **Testes de Performance**
   - Métricas de tempo de carregamento
   - Teste com grande volume de dados

2. **Testes Visuais**
   - Screenshot comparison
   - Validação de layout

3. **Testes de Acessibilidade**
   - ARIA labels
   - Navegação por teclado

4. **Cobertura Adicional**
   - Notificações
   - Upload de arquivos
   - Relatórios

### Contribuindo

1. Criar novo arquivo `<feature>.spec.ts`
2. Adicionar ao `test-runner.ts`
3. Documentar no README
4. Executar `node test-runner.js all` para validar

---

## 📞 Suporte

Para dúvidas ou problemas com os testes:

1. Verificar logs detalhados com `--debug`
2. Consultar documentação do Playwright
3. Verificar configuração em `playwright.config.ts`

**Lembre-se**: Os testes são fundamentais para garantir a qualidade e confiabilidade do sistema de agendamentos! 