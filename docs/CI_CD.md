# 🔄 CI/CD - Integração e Deploy Contínuo

Este documento descreve a configuração de CI/CD para o projeto SaaS Barber.

## 📊 **Workflows Disponíveis**

### 1. **Tests and Quality Checks** (`tests.yml`)
**Trigger:** Push/PR para `main` ou `develop`

**Jobs:**
- 📋 **Lint**: ESLint + Type checking
- 🏗️ **Backend Tests**: Jest + cobertura
- 🎨 **Frontend Tests**: Vitest + cobertura  
- 🔨 **Build Test**: Verificar builds
- 🔄 **E2E Tests**: Playwright (apenas main/develop)
- 📊 **Report**: Resumo de resultados

### 2. **Script Validation** (`script-validation.yml`)
**Trigger:** Alterações nos scripts (`run-tests.*`, `setup-env.*`)

**Jobs:**
- 🔍 Validar sintaxe PowerShell
- 🔍 Validar scripts Batch
- 🧪 Teste de configuração (dry run)

## ⚙️ **Configuração de Ambiente**

### Variáveis de Ambiente (GitHub Secrets)

```yaml
# Obrigatórias para produção
DATABASE_URL: postgresql://user:pass@host:5432/dbname
JWT_SECRET: sua-chave-super-secreta
JWT_REFRESH_SECRET: sua-chave-refresh-secreta

# Opcionais
CODECOV_TOKEN: token-para-codecov
SLACK_WEBHOOK: webhook-para-notificacoes
```

### Services Utilizados

**PostgreSQL:**
- Versão: 15-alpine
- Health checks configurados
- Banco separado para testes

**Redis:**
- Versão: 7-alpine
- Health checks configurados
- Usado para cache/sessões

## 🚀 **Processo de Deploy**

### Estratégia de Branches

```
main      ← Produção (deploy automático)
  ↑
develop   ← Desenvolvimento (testes completos)
  ↑
feature/* ← Features (testes básicos)
```

### Pipeline de Qualidade

1. **Commit/Push** → Trigger do workflow
2. **Linting** → Verificar padrões de código
3. **Type Check** → Verificar tipos TypeScript
4. **Unit Tests** → Backend + Frontend
5. **Build Test** → Verificar compilação
6. **E2E Tests** → Fluxos completos (main/develop)
7. **Coverage** → Upload para Codecov
8. **Deploy** → Se todos os testes passarem

## 📈 **Métricas e Qualidade**

### Cobertura de Código

**Metas:**
- Backend: 80%+ 
- Frontend: 70%+
- E2E: Fluxos críticos

**Ferramentas:**
- Jest (backend)
- Vitest (frontend)
- Codecov (relatórios)

### Quality Gates

**Bloqueadores:**
- ❌ Falha em testes unitários
- ❌ Falha em linting
- ❌ Falha em type checking
- ❌ Cobertura abaixo do mínimo

**Avisos:**
- ⚠️ Falha em E2E (não bloqueia merge)
- ⚠️ Performance degradada

## 🔧 **Scripts de CI/CD**

### Novos Scripts Integrados

```yaml
# No workflow
- name: 🧪 Run Tests with Custom Script
  run: |
    if [[ "$RUNNER_OS" == "Windows" ]]; then
      .\run-tests.bat
    else
      # Converter para shell script se necessário
      npm run test:backend && npm run test:frontend
    fi
```

### Configuração de Ambiente

```yaml
- name: 🔧 Setup Environment
  run: |
    cp backend/.env.example backend/.env.test
    cp frontend/.env.example frontend/.env
    # Sobrescrever com valores de CI
    echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" >> backend/.env.test
```

## 🐛 **Troubleshooting CI/CD**

### Problemas Comuns

**1. Falha de Conexão com BD**
```yaml
# Adicionar wait-for no workflow
- name: Wait for PostgreSQL
  run: |
    timeout 60 bash -c 'until pg_isready -h localhost -p 5432; do sleep 2; done'
```

**2. Timeout em Testes E2E**
```yaml
# Configurar timeout maior
- name: Run E2E Tests
  run: npm run test:e2e
  timeout-minutes: 15
```

**3. Problemas de Memória**
```yaml
# Adicionar configuração de Node
env:
  NODE_OPTIONS: --max_old_space_size=4096
```

### Logs e Debug

**Habilitar debug detalhado:**
```yaml
env:
  DEBUG: 1
  CI: true
  VERBOSE: true
```

**Salvar artefatos para análise:**
```yaml
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-results
    path: |
      backend/coverage/
      frontend/coverage/
      playwright-report/
```

## 📊 **Monitoramento**

### Notificações

**Slack Integration:**
```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Email Notifications:**
- Configurado no GitHub por usuário
- Apenas para branches principais

### Métricas Importantes

- ⏱️ **Tempo de execução** dos pipelines
- 📊 **Taxa de sucesso** por branch
- 🐛 **Frequência de falhas** por tipo
- 📈 **Tendência de cobertura** ao longo do tempo

## 🔄 **Próximos Passos**

1. **Cache Otimizado**: Implementar cache de dependências
2. **Deploy Automático**: Configurar deploy para staging/produção
3. **Testes de Performance**: Adicionar benchmarks
4. **Security Scans**: Integrar verificações de segurança
5. **Multi-env**: Configurar ambientes múltiplos (dev/staging/prod)

## 📚 **Recursos Úteis**

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Codecov Integration](https://docs.codecov.com/docs/github-actions)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Jest CI](https://jestjs.io/docs/continuous-integration)