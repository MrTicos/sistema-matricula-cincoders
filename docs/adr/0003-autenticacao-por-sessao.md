# ADR-0003 — Autenticação por sessão e cookie HttpOnly

- **Status:** Proposta
- **Data:** 21/11/2026
- **Escopo:** US-01 (Jira MAT-6)

## Contexto

O sistema possui usuários com perfil `ALUNO` ou `SECRETARIA`. O cliente React acessará a API Express e deverá manter o login entre requisições sem enviar a senha novamente. O modelo `Usuario` persiste `username`, `senhaHash` e `perfil`; senhas são verificadas com Argon2id.

## Decisão proposta

Utilizar `express-session` com:

- Cookie de identificador de sessão `HttpOnly` e `SameSite=Lax`.
- `Secure` quando servido por HTTPS, especialmente na implantação.
- Prazo inicial de expiração de oito horas, sujeito à revisão.
- Segredo de assinatura definido em variável local `SESSION_SECRET` (nunca versionada).
- Regeneração do identificador de sessão após autenticação válida, para reduzir risco de fixação de sessão.
- Encerramento de sessão no logout e limpeza do cookie.
- Verificação de autorização no servidor, com base no perfil e no vínculo do aluno autenticado.
- Armazenamento persistente das sessões antes da entrega; o `MemoryStore` padrão será admitido apenas durante desenvolvimento local.
- Medidas contra CSRF nas rotas que alteram estado; `SameSite` isoladamente não basta para todos os cenários.

## Alternativas avaliadas

| Alternativa | Vantagem | Desvantagem |
| --- | --- | --- |
| Sessão no servidor + cookie | Revogação e acesso centralizados; cookie guarda apenas ID | Exige armazenamento persistente e proteção contra CSRF |
| JWT no cliente | Escala horizontal sem consulta obrigatória ao armazenamento de sessão | Revogação e armazenamento seguro exigem cuidados adicionais |

## Consequências

- Frontend deverá usar `credentials: "include"` ao chamar a API em origem distinta.
- Backend precisa configurar CORS com origem explícita, sem coringa para credenciais.
- Testes devem comprovar login, senha inválida, logout, acesso sem sessão e isolamento de perfis.
- Dados sensíveis, inclusive `senhaHash`, nunca devem aparecer nas respostas HTTP.
- A sessão não substitui a verificação de que um aluno acessa apenas seus próprios registros.

## Critério para aceitar esta ADR

A decisão passa de **Proposta** para **Aceita** após selecionar e testar um armazenamento persistente compatível com a execução final e concluir os testes de segurança e autenticação. Caso o prazo exija uma escolha diferente, registrar a mudança nesta ADR antes de alterar a implementação.
