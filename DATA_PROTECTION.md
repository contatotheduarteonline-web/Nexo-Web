# NEXO — preservação de dados e preparação da versão

## Escopo e fontes de verdade

- Firebase Authentication continua responsável pelo login, cadastro e recuperação convencional de senha; esses fluxos não dependem de SMTP/Resend.
- Perfis e estudos continuam no Firestore, nas coleções existentes `users/{uid}/editais`, `studyPlans`, `studySessions`, `scheduledReviews`, etc. Não houve migração dessas coleções nem mudança de IDs.
- PostgreSQL/Prisma continua como armazenamento do servidor para usuários/vouchers legados, planos espelhados e catálogo oficial. O volume PostgreSQL existente não é recriado.
- `users_db.json` e `vouchers_db.json` são o fallback persistente e espelho parcial dos endpoints legados/administrativos, não substitutos do Firebase Auth. Os conjuntos PostgreSQL/JSON podem divergir; não são importados um sobre o outro automaticamente.
- `email_config.json` guarda configurações administrativas de envio. `SMTP_PASS` e `RESEND_API_KEY` vêm exclusivamente do ambiente protegido ou de um override em memória (este se perde ao reiniciar). O ambiente sempre tem prioridade; `.env` não o sobrescreve.
- Backups diários, fallback de templates e imagens locais usam a mesma raiz privada. Ler editais não pode apagar documentos por palavras em títulos/IDs; auditoria de órfãos continua somente leitura. Backups não são mais removidos automaticamente por idade.
- Layout, cronômetro, contadores independentes e demais componentes visuais não foram modificados.

## Preservação antes de retirar do Git

Foi criada uma cópia fora do checkout em `/var/lib/nexo-private/preservation/`, com diretórios `0700`, arquivos `0600` e manifesto privado com contagens e checksums. O apontador `/var/lib/nexo-private/latest-preservation` identifica a cópia desta execução. Os JSON foram lidos e comparados byte a byte, sem registrar conteúdo pessoal/credenciais. Há 3 usuários (todos com hash), 2 vouchers e configuração de e-mail sem segredos ativos no arquivo atual; backups privados podem conter credenciais antigas e também foram preservados.

A cópia pertence ao sandbox, não é um backup externo de produção nem garantia de sobrevivência à destruição/recriação do ambiente. Antes da publicação, o operador deve exportá-la por canal privado seguro para armazenamento controlado, com criptografia e política de recuperação. Nunca usar Git, Firebase Hosting ou uma URL pública para isso.

## Armazenamento privado persistente

`NEXO_DATA_DIR` define a raiz usada por todos os arquivos do servidor. Em produção é obrigatório um caminho absoluto **fora do checkout e da raiz pública**, montado em disco/volume persistente privado. A aplicação recusa iniciar em produção sem esse caminho. A validação do caminho não prova a durabilidade do disco: o operador deve verificar o mount e testar a restauração antes de publicar.

No sandbox, Compose monta o volume nomeado `private_data` em `/var/lib/nexo`. Nenhum dado real é incluído na imagem, no frontend ou nos exemplos. Instalação (`npm ci`), geração Prisma e migrations rodam no serviço `prepare` antes do servidor com recarga automática. Os volumes existentes `pgdata` e `app_node_modules` são mantidos. **Nunca executar `docker compose down -v`.**

Na adoção de uma instalação existente:
1. Interromper somente o servidor para obter um snapshot estável; preservar o banco e fazer backup recuperável.
2. Copiar a árvore `data/` existente para o volume privado sem sobrescrever arquivos diferentes. Verificar JSON, contagens, IDs únicos e igualdade byte a byte. Em conflito, parar e reconciliar manualmente; não mesclar por conveniência.
3. Definir `NEXO_DATA_DIR`, iniciar a aplicação e comparar consultas existentes com o snapshot. Nenhuma conta/voucher é recriada ou tem papéis, estados, senhas ou contadores alterados no boot.
4. Só após a validação, usar `git rm --cached` nos três JSON sensíveis. Os arquivos locais e a cópia privada ficam intactos. `data/examples/` contém apenas exemplos anônimos, nunca seeds de produção.
5. Para recuperar, parar o servidor e restaurar os arquivos selecionados do snapshot privado para o volume (não para Git), conferir o manifesto, reiniciar e comparar consultas. Restaurar PostgreSQL somente conforme um plano aprovado, nunca sobre o banco ativo durante testes.

JSON inválido/duplicado impede o carregamento em vez de criar um store vazio e apagar registros. Gravações usam arquivo temporário privado e renomeação atômica. Não é um mecanismo de coordenação entre múltiplas réplicas: o fallback JSON deve ter apenas um processo escritor; escalar requer desenho próprio.

## Credenciais e histórico

Remover arquivos do estado atual da branch **não elimina suas cópias de commits anteriores**, clones, caches ou forks. Não houve force push, reescrita de histórico, exclusão de commits, merge nem publicação no `main`.

Credenciais expostas anteriormente devem ser revogadas/rotacionadas pelo proprietário, inclusive senhas de aplicativo SMTP e chaves Resend. Configure os novos valores somente no gerenciador de segredos do ambiente. Funções administrativas de e-mail, teste de envio e recuperação legada por código dependem de SMTP ou Resend real; não foram disparadas contra provedores reais nesta execução. O envio SMTP mantém validação de certificados TLS. A recuperação convencional pelo Firebase permanece independente.

## Publicação e bloqueios conhecidos

`firebase.json` configura Firebase Hosting para `dist/` e Firestore Rules. Esse hosting é estático e **não executa `server.ts`**: endpoints administrativos, backups e catálogo PostgreSQL precisam do backend existente em hospedagem própria. Não inventar um destino nem publicar antes de confirmar a hospedagem do backend, volume persistente e restauração.

**Bloqueio de segurança preexistente:** endpoints Express de consulta/gestão administrativa (inclusive `/api/auth/state`) não verificam autenticação/autorização no servidor. A proteção do Firestore não protege esses endpoints. A retirada do Git não corrige essa exposição em runtime; a aplicação não deve ser considerada pronta para publicação pública sem uma revisão de autorização aprovada. Esta alteração não mudou permissões de usuários nem adicionou um novo mecanismo de login.

## Verificação

Resultados reais desta execução (2026-10-13):

| Verificação | Resultado |
| --- | --- |
| `npm run lint` | **PASSOU** (`tsc --noEmit`, exit 0), repetido após a última alteração funcional. |
| `npm run build` | **PASSOU**, exit 0; aviso preexistente de bundle frontend grande (~3,38 MB). |
| `node --import tsx --test src/lib/privateData.test.ts` | **PASSOU**, 4 testes: roundtrip de campos legados/permissões, limites/contadores de vouchers, falha segura em JSON inválido/duplicado e proteção do caminho em produção. |
| Preservação dos arquivos | **PASSOU**: 10 arquivos privados lidos/importados/verificados; 3 usuários com hashes e 2 vouchers; comparação dos campos originais após os testes sem diferenças. A cópia inicial foi comparada byte a byte. |
| PostgreSQL | **PASSOU**: snapshot privado com `pg_dump -Fc`, índice lido com `pg_restore --list`; estado original de usuários, vouchers e planos comparado antes/depois sem diferenças. Restauração completa do dump **não executada** sobre o banco ativo. |
| Consulta de usuários/vouchers legados | **PASSOU**: conjunto existente consultado; 4 usuários visíveis pela união JSON/PostgreSQL e 2 vouchers (sem importar ou sobrescrever os conjuntos divergentes). Respostas não incluem hashes. |
| Gravação e exclusão de teste nos endpoints legados | **PASSOU**: usuários e vouchers `NEXO TEST ONLY`, com e-mail em `example.invalid`, criados pelas rotas reais; perfil atualizado e lido; login legado com hash validado; exclusão somente pelos IDs retornados na criação. Isso **não** é login do Firebase. |
| Persistência do servidor após reiniciar | **PASSOU**: outro conjunto identificado de fixtures foi criado pelas rotas reais, encontrado no PostgreSQL e no JSON privado após reiniciar o processo e removido pelos IDs exatos; novo restart não recriou registros nem alterou campos originais. Nenhuma fixture do servidor ficou pendente. |
| Arquivos privados via servidor de desenvolvimento | **PASSOU**: JSON de usuários/vouchers/e-mail, caminhos `/@fs/` equivalentes e `.git/config` retornam HTTP 403. |
| Git atual | **PASSOU**: três JSON removidos somente do índice; originais locais e cópias privadas preservados; nenhum backup versionado; `.gitignore` protege runtime, backups e storage. |
| Login/cadastro — telas e validação | **PASSOU**: abertura, validação de formulário vazio e layout desktop/mobile, sem rolagem horizontal nem erros de console. |
| Login/cadastro — sucesso pelo Firebase | **NÃO EXECUTADO**: não foram usadas credenciais reais nem criada conta no Firebase de produção sem um ciclo seguro de remoção da conta de teste. A sessão existente foi retomada na prévia, mas isso não prova um novo login ou cadastro. |
| Recuperação convencional Firebase | **ABERTURA/CANCELAMENTO PASSARAM**; entrega do e-mail e conclusão da troca de senha **NÃO EXECUTADAS** para não disparar e-mail real nem alterar senhas existentes. |
| Leitura de estudos existentes no Firestore | **PASSOU na sessão compartilhada**: leituras autenticadas de 1 edital, 1 plano e 3 sessões, com IDs correspondentes aos registros carregados na aplicação; sem exibir nomes, e-mails, IDs ou tokens neste relatório. |
| Navegação autenticada | **PASSOU**: Home, Planos, Edital e Histórico abriram. A primeira tentativa de Planos encontrou o menu fechado; o reteste abriu a tela corretamente, sem alteração do layout. |
| Gravação/exclusão de planos, editais e sessões pela interface Firestore | **NÃO VERIFICADA AUTOMATICAMENTE**: não foram alterados estudos da conta real nem criados planos que mudariam seu plano ativo/progresso. Requer uma conta de teste isolada e cleanup confirmado dos IDs criados. A comparação de leituras não substitui este teste. |
| Persistência de estudos Firestore após recarga | **LEITURA EXISTENTE PASSOU** em nova carga da aplicação; persistência de uma nova gravação de teste após recarga **NÃO EXECUTADA**. |
| Auditoria não destrutiva e caches legados | Exclusão automática na assinatura de editais, descarte de arrays por nomes/IDs e purge de chaves locais por versão foram removidos; a leitura autenticada foi verificada. Exclusões manuais explícitas do usuário permanecem. Não houve teste destrutivo contra dados existentes. |
| E-mail administrativo SMTP/Resend | **NÃO EXECUTADO**: os segredos externos não estão configurados no ambiente protegido; nenhum provedor real foi acionado. |
| Cronômetro e contadores | Código e componentes preservados, sem alteração; fluxo completo de registro de estudo **NÃO RETESTADO** nesta execução. |

Os exemplos são anônimos e o Firebase Hosting agora ignora `server.cjs` e `server.cjs.map`, para não publicar o backend compilado junto da SPA. Não houve deploy de Hosting nem de regras, merge ou alteração do histórico. Antes da publicação: revisar autorização das rotas administrativas; configurar e verificar o disco privado no backend real; exportar os backups por canal privado e testar restauração isolada; rotacionar credenciais/senhas antes expostas conforme decisão do proprietário; executar os fluxos Firebase restantes em conta de teste isolada.

Nenhum fluxo não executado deve ser declarado aprovado.
