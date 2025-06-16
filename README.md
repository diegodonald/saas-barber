# 💈 SaaS Barber - Sistema de Agendamento para Barbearias

Sistema completo de gestão e agendamento online para barbearias, salões de beleza e estúdios de tatuagem.

## 🚀 Funcionalidades Principais

- ✅ **Agendamento Online** - Clientes agendam diretamente
- ✅ **Serviços por Barbeiro** - Cada barbeiro executa serviços específicos
- ✅ **Horários Flexíveis** - Barbeiros podem trabalhar fora do horário da barbearia
- ✅ **Sistema de Exceções** - Horários especiais e folgas
- ✅ **Multi-tenant** - Múltiplas barbearias na mesma plataforma
- ✅ **Dashboard Completo** - Métricas e relatórios detalhados

## 🏗️ Arquitetura

```
saas_barber/
├── frontend/          # React.js + TypeScript
├── backend/           # Node.js + Express + TypeScript
├── docs/              # Documentação
├── e2e/               # Testes E2E Playwright
└── docker-compose.yml # Ambiente de desenvolvimento
```

## 🛠️ Stack Tecnológica

### Frontend
- **React.js 18+** com TypeScript
- **Tailwind CSS** + HeadlessUI
- **React Query** (TanStack Query)
- **React Hook Form** + Zod
- **Vite** (Build tool)

### Backend
- **Node.js 18+** com TypeScript
- **Express.js** (API REST)
- **Prisma** (ORM)
- **PostgreSQL** (Banco de dados)
- **JWT** (Autenticação)

### Testes
- **Jest** (Testes unitários)
- **Vitest** (Testes frontend)
- **Playwright** (Testes E2E)

### DevOps
- **Docker** (Desenvolvimento)
- **GitHub Actions** (CI/CD)
- **Vercel** (Frontend deploy)
- **Railway** (Backend deploy)

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose
- Git

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd saas_barber
```

2. **Configure as variáveis de ambiente**
```bash
# Configuração automática (Recomendado)
.\setup-env.bat          # Windows CMD
# ou
.\setup-env.ps1          # PowerShell

# Ou manualmente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edite os arquivos .env conforme necessário
```

3. **Inicie o ambiente de desenvolvimento**
```bash
docker-compose up -d
npm run dev
```

4. **Execute as migrations**
```bash
npm run db:migrate
npm run db:seed
```

5. **Acesse a aplicação**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Banco: localhost:5432

## 🧪 Testes

### Executar todos os testes (Automatizado)
```bash
# Windows (Recomendado)
.\run-tests.bat          # CMD
.\run-tests.ps1          # PowerShell

# Com opções
.\run-tests.ps1 -SkipE2E    # Pular testes E2E
```

### Executar testes individuais
```bash
# Backend
cd backend && npm test

# Frontend  
cd frontend && npm test

# E2E
npm run test:e2e
```

### Cobertura de testes
```bash
cd backend && npm run test:coverage
cd frontend && npm run test:coverage
```

📚 **Documentação completa:** [TESTING.md](TESTING.md)

## 📚 Documentação

- 🧪 [Guia de Testes](TESTING.md) - Como executar e debugar testes
- 🔄 [CI/CD](docs/CI_CD.md) - Configuração de integração contínua
- 📋 [Sistema de Horários](docs/FASE_7_SISTEMA_HORARIOS.md) - Documentação do sistema de agendamentos

## 🛠️ Scripts Disponíveis

### Configuração
- `setup-env.bat` / `setup-env.ps1` - Configurar ambiente automaticamente
- `npm run docker:up` - Iniciar serviços Docker
- `npm run db:migrate` - Executar migrações do banco

### Desenvolvimento
- `npm run dev` - Iniciar ambiente de desenvolvimento
- `npm run build` - Build de produção
- `npm run lint` - Verificar código

### Testes
- `run-tests.bat` / `run-tests.ps1` - Executar todos os testes
- `npm run test:coverage` - Testes com cobertura
- `npm run test:e2e` - Testes end-to-end

### Testes com cobertura
```bash
npm run test:coverage
```

## 📚 Documentação

- [Regras de Agendamento](docs/regras_agendamento.md)
- [Documentação Técnica](docs/documentacao_tecnica.md)
- [Plano de Desenvolvimento](docs/plano_geral.md)
- [API Documentation](http://localhost:3001/api-docs)

## 🎯 Regras de Negócio Principais

### Precedência de Horários
1. **Exceção Individual** (prioridade absoluta)
2. **Horário Individual do Barbeiro**
3. **Exceção Global da Barbearia**
4. **Horário Global da Barbearia**

### Serviços por Barbeiro
- Cada barbeiro executa apenas serviços específicos
- Clientes só veem barbeiros que fazem o serviço escolhido
- Preços podem variar por barbeiro

### Validações Rigorosas
- Não permite overlapping de horários
- Valida se barbeiro executa o serviço
- Respeita intervalos e exceções
- Horários futuros apenas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Desenvolvedor

**Diego** - Desenvolvedor Júnior  
**Mentor:** Arquiteto de Software Sênior

---

⚡ **Status:** Em desenvolvimento ativo  
📅 **Última atualização:** 2024-12-19 