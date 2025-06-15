# Comandos Sugeridos para Desenvolvimento

Este documento lista os comandos mais importantes para desenvolver no projeto SaaS Barber, tanto para o backend quanto para o frontend, e outras utilidades.

## Comandos Gerais (na raiz do projeto `saas_barber/`):
- `npm install`: Instala todas as dependências (tanto do backend quanto do frontend, devido ao setup de monorepo com workspaces).
- `npm run docker:up`: Sobe o ambiente Docker (PostgreSQL, Redis, pgAdmin, Mailhog). (Inferido do `docker-compose.yml` e `plano_geral.md`)
- `npm run docker:down`: Derruba o ambiente Docker.
- `npm run db:migrate`: Executa as migrações do Prisma no banco de dados.
- `npm run db:seed`: Popula o banco de dados com dados de exemplo (seed).
- `npm run db:studio`: Abre o Prisma Studio para visualizar e gerenciar o banco de dados.
- `npm run db:reset`: Reseta o banco de dados (cuidado! apaga todos os dados).

## Comandos do Backend (no diretório `backend/`):
- `npm run dev`: Inicia o servidor de desenvolvimento do backend com `tsx watch` para hot-reload.
- `npm run build`: Compila o código TypeScript para JavaScript na pasta `dist/`.
- `npm start`: Inicia o servidor de produção do backend (executa o código compilado).
- `npm test`: Executa todos os testes unitários do backend (usando Jest).
- `npm test -- <caminho/do/arquivo.test.ts>`: Executa testes para um arquivo específico.
- `npm test:watch`: Executa os testes em modo watch (monitora alterações nos arquivos).
- `npm test:coverage`: Executa os testes e gera um relatório de cobertura de código.
- `npm run lint`: Executa o linter (ESLint) para verificar problemas de estilo e erros no código.
- `npm run lint:fix`: Executa o linter e tenta corrigir automaticamente os problemas encontrados.
- `npm run type-check`: Realiza a verificação de tipos do TypeScript sem compilar o código.
- `npm run db:generate`: Gera os arquivos do cliente Prisma (executar após alterar `schema.prisma`).
- `npm run db:migrate:prod`: Executa migrações para ambiente de produção.
- `npm run db:push`: Sincroniza o schema do Prisma com o banco de dados sem migrações (apenas para desenvolvimento).

## Comandos do Frontend (no diretório `frontend/`):
- `npm run dev`: Inicia o servidor de desenvolvimento do frontend com Vite.
- `npm run build`: Compila o código TypeScript do frontend e empacota para produção.
- `npm run preview`: Serve a build de produção localmente para pré-visualização.
- `npm test`: Executa todos os testes unitários do frontend (usando Vitest).
- `npm test:ui`: Inicia a interface do usuário do Vitest para visualizar e depurar testes.
- `npm test:coverage`: Executa os testes e gera um relatório de cobertura de código do frontend.
- `npm run lint`: Executa o linter (ESLint) para o código frontend.
- `npm run lint:fix`: Executa o linter do frontend e tenta corrigir automaticamente.
- `npm run type-check`: Realiza a verificação de tipos do TypeScript do frontend.

## Comandos Utilitários (Windows - PowerShell/CMD):
- `cd <caminho>`: Navega para um diretório específico.
- `ls` ou `dir`: Lista o conteúdo do diretório atual.
- `code .`: Abre o VS Code no diretório atual.
- `git status`: Verifica o status do repositório Git.
- `git add .`: Adiciona todas as alterações para commit.
- `git commit -m "mensagem"`: Realiza um commit.
- `git push`: Envia as alterações para o repositório remoto.
- `grep -r "pattern" .` (ou `Select-String -Path . -Pattern "pattern" -Recurse` no PowerShell): Busca um padrão em arquivos (equivalente ao `grep` do Unix).
- `find . -name "*.ts"` (ou `Get-ChildItem -Recurse -Include *.ts` no PowerShell): Encontra arquivos por nome (equivalente ao `find` do Unix).

## Quando uma tarefa é concluída:
1. **Formatar/Lintar**: Execute `npm run lint:fix` nos diretórios `backend/` e `frontend/` para garantir a padronização.
2. **Testar**: Execute `npm test` em `backend/` e `frontend/` para garantir que as novas funcionalidades não quebraram as existentes e que os novos testes estão passando.
3. **Testes E2E (se aplicável)**: Execute os testes E2E com Playwright (se já configurados e relevantes para a tarefa).
4. **Atualizar Migrações**: Se houver mudanças no schema do Prisma, execute `npm run db:generate` e `npm run db:migrate` no `backend/`.
5. **Verificar Funcionalidade**: Teste manualmente a funcionalidade implementada no ambiente de desenvolvimento (`npm run dev` em ambos).
6. **Atualizar Memória**: Atualize o arquivo `progress-tracking.md` (e `progresso_sessao_atual.md`) na memória para registrar o que foi feito e os próximos passos, conforme as diretrizes do projeto.