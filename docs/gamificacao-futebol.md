# Gamificação estilo FIFA/PES — Cartas, Raridade e Pacotes

> Nota: os prompts de sprint abaixo assumem Next.js 14 App Router + Supabase.
> O gameSEFAZ atual é Vite + TypeScript puro, com progresso em localStorage
> (sem backend). Antes de rodar os prompts, adaptar as partes de schema
> SQL/Supabase e RLS para o equivalente em localStorage (ou decidir migrar
> pra um backend real antes deste épico).

## História de usuário (épico)

Como estudante usando o gameSEFAZ,
quero que cada matéria vire uma carta de jogador com rating e raridade que evolui conforme meu desempenho, e que eu ganhe pacotes ao bater metas,
para que meus estudos tenham a progressão e recompensa de um card game de futebol, me mantendo engajado a treinar todo dia.

**Critérios de aceite do épico:**
- Cada matéria/tópico tem uma carta com rating (0–99) calculado a partir do desempenho real
- A carta muda de raridade visual (Bronze/Prata/Ouro/Ícone) conforme o rating sobe
- Completar metas libera "pacotes" com animação de abertura
- Nada disso quebra o fluxo de jogo existente (Estudar / Quiz / Treino Rápido)

Separado em 5 sprints. Cada bloco é um prompt pronto pra colar no VS Code (Copilot Chat, Claude Code, etc.).

---

## Sprint 1 — Schema e cálculo de rating

Contexto: projeto gameSEFAZ (Next.js 14 App Router + TypeScript + Supabase).
Já existem os modos Estudar, Quiz e Treino Rápido, com resultados salvos no Supabase.

Tarefa: criar a base de dados e a lógica de rating por matéria/tópico, sem alterar
os modos de jogo existentes.

1. Criar migration SQL no Supabase para a tabela `carta_topico`:
   - id, topico_id (referência ao tópico existente), rating (int, 0-99),
     raridade (enum: bronze | prata | ouro | icone), acertos_totais,
     tentativas_totais, atualizado_em
2. Criar função `calcularRating(acertos: number, tentativas: number): number`
   em português, pura, testável, que gera rating 0-99 a partir de taxa de acerto
   (fórmula: considerar peso maior pra volume de tentativas, evitando que 1 acerto
   em 1 tentativa dê rating 99)
3. Criar função `calcularRaridade(rating: number): Raridade`:
   0-49 bronze, 50-74 prata, 75-89 ouro, 90-99 icone
4. Criar um trigger ou função de update no Supabase que recalcula `carta_topico`
   toda vez que um resultado de Quiz/Treino Rápido é salvo
5. Escrever testes unitários pras duas funções de cálculo

Não mexer em nenhuma tela ainda — só schema e lógica de cálculo.

---

## Sprint 2 — Componente de carta (UI)

Contexto: gameSEFAZ, Next.js 14 + TypeScript + Tailwind.
A tabela `carta_topico` e as funções de rating/raridade já existem (Sprint 1).

Tarefa: criar o componente visual da carta de jogador.

1. Criar componente `CartaTopico` (client component) que recebe topico_id e
   busca os dados de `carta_topico` via Supabase
2. Visual da carta: nome do tópico, rating grande no canto, borda colorida
   por raridade (bronze #CD7F32, prata #C0C0C0, ouro #FFD700, ícone gradiente
   dourado/branco), ícone da matéria
3. Estado de loading (skeleton) enquanto busca os dados
4. Estado "sem dados ainda" pra tópicos nunca jogados (carta cinza, rating "—")
5. Criar página /cartas listando todas as cartas do usuário, agrupadas por matéria
6. Responsivo mobile-first (grid 2 colunas no mobile, 4+ no desktop)

Reaproveitar os componentes de UI (botões, cards) já existentes no projeto,
se houver um design system.

---

## Sprint 3 — Sistema de pacotes (packs)

Contexto: gameSEFAZ. Cartas e ratings já funcionam (Sprints 1 e 2).

Tarefa: sistema de recompensa por pacotes.

1. Definir gatilhos de pacote (regra simples pra começar):
   - completar uma fase pela primeira vez → 1 pacote bronze
   - subir uma carta de raridade → 1 pacote prata
   - streak de 7 dias seguidos jogando → 1 pacote ouro
2. Criar tabela `pacote_usuario`: id, usuario_id, tipo, aberto (boolean),
   criado_em, aberto_em
3. Criar função no backend que insere um pacote quando o gatilho ocorre
   (chamar a partir do fluxo de fim de fase que já existe)
4. Criar componente `AbrirPacote`: animação de abertura (CSS/Framer Motion),
   revela qual carta foi sorteada/bonificada dentro do pacote
5. Badge de notificação (contador de pacotes não abertos) visível no header
6. Página ou modal /pacotes listando pacotes pendentes

Pacotes acumulam se o usuário não abrir — não expiram.

---

## Sprint 4 — Química (chemistry) entre tópicos relacionados

Contexto: gameSEFAZ. Cartas, rating e pacotes já funcionam.

Tarefa: bônus de "química" quando o usuário domina tópicos da mesma matéria juntos.

1. Criar tabela `grupo_quimica`: agrupa topico_ids que pertencem à mesma
   matéria/bloco (ex: PPA + LDO + LOA + LRF = grupo "Planejamento Orçamentário")
2. Criar função `calcularQuimica(grupoId): number` — retorna % baseado na
   média de rating das cartas do grupo que estão ouro ou ícone
3. Ao atingir 100% de química num grupo, conceder bônus de XP (definir valor)
   e marcar o grupo como "completo" numa tabela `quimica_usuario`
4. UI: na página /cartas, mostrar as cartas agrupadas visualmente por grupo de
   química, com uma barra de progresso do grupo
5. Notificação/toast quando um grupo completa 100% de química

Grupos de química devem ser configuráveis via tabela, não hardcoded no código.

---

## Sprint 5 — Polimento e testes

Contexto: gameSEFAZ. Todas as features de gamificação (cartas, pacotes, química)
já implementadas.

Tarefa: revisão e testes end-to-end.

1. Testes E2E (Playwright ou Cypress, o que já estiver configurado no projeto)
   cobrindo: completar fase → rating atualiza → pacote é gerado → abrir pacote
2. Revisar performance das queries Supabase (evitar N+1 ao buscar várias cartas)
3. Acessibilidade: contraste das cores de raridade, labels em componentes
4. Ajustar RLS (Row Level Security) nas novas tabelas — cada usuário só vê
   suas próprias cartas/pacotes/química
5. Documentar as novas tabelas e fluxos no README.md do projeto
