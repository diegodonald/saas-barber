# Stack de Tecnologias do Projeto SaaS Barber

O projeto SaaS Barber utiliza uma arquitetura full-stack moderna com foco em performance, escalabilidade e manutenibilidade.

## Backend Stack:
- **Linguagem**: TypeScript
- **Runtime**: Node.js (v18.0.0+)
- **Framework**: Express.js
- **ORM**: Prisma ORM (v5.6.0+)
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (JSON Web Tokens) com bcrypt para hash de senhas
- **Validação**: Zod
- **Logging**: Winston
- **Cache/Mensageria**: Redis (mencionado no docker-compose, mas não diretamente nos package.json, indicando uso via serviço externo ou ioredis)
- **Testes**: Jest (v29.7.0+) com ts-jest e Supertest para testes de integração/e2e da API
- **Utilitários**: date-fns para manipulação de datas, multer para upload de arquivos, sharp para processamento de imagens
- **Documentação API**: Swagger (swagger-jsdoc, swagger-ui-express)

## Frontend Stack:
- **Linguagem**: TypeScript
- **Framework**: React.js (v18.2.0+)
- **Build Tool**: Vite (v4.4.5+)
- **Estilização**: Tailwind CSS (v3.3.0+) com HeadlessUI e Heroicons
- **Gerenciamento de Estado/Dados**: React Query (TanStack Query v5.8.0+)
- **Roteamento**: React Router DOM (v6.20.0+)
- **Formulários**: React Hook Form (v7.48.0+) com @hookform/resolvers (Zod)
- **HTTP Client**: Axios
- **Animações**: Framer Motion
- **UI Components**: React Calendar, React Input Mask
- **Notificações**: React Hot Toast
- **Testes**: Vitest (v0.34.0+) com @vitest/ui, @vitest/coverage-v8, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom

## Ferramentas de Desenvolvimento e DevOps:
- **Containerização**: Docker e Docker Compose (para PostgreSQL, Redis, pgAdmin, Mailhog)
- **Testes E2E (Alternativo/Complementar)**: Playwright (mencionado no plano geral e package.json raiz, não no frontend/package.json)
- **Linter**: ESLint (configurado nos `package.json` para TS/TSX)
- **Formatação**: Prettier (configurado via ESLint)
- **Versionamento**: Git

## Resumo da Estrutura:
- **Monorepo**: Backend e Frontend separados em pastas distintas, mas no mesmo repositório.
- **Prisma Schema**: Centralizado no `backend/prisma/schema.prisma` para gerenciar o banco de dados de ambas as partes (indiretamente via API).
- **Autenticação**: Baseada em JWT, gerando tokens no backend e consumindo no frontend.
- **Comunicação**: RESTful API entre Frontend e Backend.