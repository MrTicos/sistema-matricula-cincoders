# Sprint 1 — MVP do aluno: autenticação e fluxo principal

**Situação:** Em andamento  
**Prazo de entrega do teste:** 23/11/2026  
**Referência principal:** Jira MAT-6 (US-01 — Autenticação)

## Objetivo

Permitir que alunos utilizem as funcionalidades prioritárias do MVP, iniciando por login, sessão, autorização e testes. A priorização seguirá o enunciado do teste: autenticação, ofertas, matrícula/cancelamento e progresso antes dos fluxos administrativos.

## Backlog da Sprint — MoSCoW

| Prioridade | Entrega | Estado |
| --- | --- | --- |
| Must | Inicializar API Express e endpoint de saúde | Verificado manualmente |
| Must | Consultar usuário e verificar senha Argon2id | Serviço implementado; sem testes automatizados |
| Must | Criar sessão, login, `/me` e logout | Em andamento |
| Must | Autorizar acesso conforme perfil e identidade | Pendente |
| Must | Testes de sucesso, erro e acesso não autorizado | Pendente |
| Must | Ofertas, matrícula, cancelamento e progresso do aluno | Pendente |
| Should | Persistência de sessão e proteção contra CSRF | Pendente; necessária para solução final baseada em cookie |
| Could | Melhorias cosméticas e conveniências operacionais | Não iniciar antes do MVP |

## Evidências atuais

- Dependências instaladas: Express, CORS, cookie-parser, Prisma, Argon2, Vitest e Supertest.
- `src/app.ts` e `src/server.ts` criados; `GET /api/health` respondeu JSON corretamente, conforme teste manual.
- `src/config/database.ts` criado e sem erro reportado pelo editor.
- `src/modules/auth/auth.service.ts` implementa busca por `username`, `argon2.verify()` e retorno sem `senhaHash`; ainda não há evidência de teste de integração.
- `src/config/session.ts` foi especificado para implementação; confirmar execução e configuração antes de marcá-lo pronto.
- As pastas de controller, routes e middleware foram criadas, mas não há comprovação de implementação funcional.

## Critérios de aceitação (US-01)

```gherkin
Funcionalidade: Login de usuário

  Cenário: Credenciais válidas
    Dado um usuário cadastrado com senha válida
    Quando enviar usuário e senha ao endpoint de login
    Então a API deve criar uma sessão autenticada
    E deve retornar seu perfil sem expor senhaHash

  Cenário: Credenciais inválidas
    Quando enviar uma combinação inválida de usuário e senha
    Então a API deve responder 401 com mensagem genérica

  Cenário: Acesso não autenticado
    Dado um cliente sem sessão válida
    Quando solicitar uma rota protegida
    Então a API deve negar o acesso

  Cenário: Encerramento de sessão
    Dado um usuário autenticado
    Quando encerrar a sessão
    Então as requisições posteriores não devem continuar autenticadas
```

## Definition of Done

- [ ] Endpoints e middleware de autorização implementados.
- [ ] Testes automatizados de autenticação passando.
- [ ] Sessão persistente ou limitação explicitamente resolvida antes da entrega.
- [ ] Proteções adequadas a cookies e rotas mutáveis consideradas (HTTPS e CSRF).
- [ ] Documentação atualizada com endpoints, dados de teste e comandos.
- [ ] Commit e push verificados no GitLab.
- [ ] Jira MAT-6 atualizado conforme evidência.

## Próximas ações

1. Confirmar a instalação do `express-session` e a execução do middleware de sessão.
2. Implementar `POST /api/auth/login`, `GET /api/auth/me` e `POST /api/auth/logout`.
3. Implementar middleware por perfil `ALUNO` e `SECRETARIA`.
4. Executar cenários Gherkin com Vitest e Supertest.
5. Avançar imediatamente para ofertas e matrícula do aluno.
