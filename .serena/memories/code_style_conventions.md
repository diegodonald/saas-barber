# Convenções e Estilo de Código

O projeto SaaS Barber segue as convenções e o estilo de código padrões para projetos TypeScript com ESLint e Prettier (implicado pelo `lint:fix` nos scripts do `package.json`).

## Diretrizes Gerais:
- **Linguagem**: TypeScript, com uso rigoroso de tipagem para garantir a segurança e clareza do código.
- **Formatação**: Utilização de ESLint para padronização automática de código. O script `lint:fix` sugere a integração com uma ferramenta de formatação como Prettier.
- **Nomenclatura**: 
  - **Variáveis/Funções**: `camelCase`
  - **Classes/Interfaces/Tipos**: `PascalCase`
  - **Constantes globais**: `SCREAMING_SNAKE_CASE` (se aplicável)
- **Estrutura de Arquivos**: Organização modular, com arquivos `.ts` para lógica, `.tsx` para componentes React, e separação clara entre controllers, services, models, routes, etc.
- **Documentação**: Priorizar clareza do código. Comentários devem explicar o *porquê*, não apenas o *o quê*.
- **Tratamento de Erros**: Centralizado nos controllers e services, utilizando exceções e mensagens claras para o cliente (ZodError para validação, Error para erros de negócio).
- **Uso do Prisma**: Modelos e operações de banco de dados são gerenciados exclusivamente através do Prisma ORM, seguindo as melhores práticas de uso do ORM.
- **Validações**: Zod é utilizado para validação de esquemas de entrada de dados, garantindo a integridade dos dados.
- **Padronização de Respostas**: Respostas da API seguem um padrão JSON consistente (sucesso, erro com detalhes).
- **Cuidado com Tipos**: Ênfase na utilização correta de interfaces e tipos personalizados para melhorar a legibilidade e a manutenção do código, como `AuthenticatedRequest` e interfaces de dados para CRUD.