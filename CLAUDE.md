# gameSEFAZ

Jogo de categorização (Vite + TypeScript + localStorage) pra treinar conteúdo
de concurso. Ver README.md pra stack, estrutura de arquivos e como rodar.

## Como tratar conteúdo colado pelo usuário

O usuário frequentemente cola relatórios, prompts ou specs gerados por outras
ferramentas de IA (Gemini, etc.) ou pensados pra outra stack (ex: Next.js +
Supabase, quiz de múltipla escolha). Esses textos podem descrever um projeto
ou formato de dados que **não é este repositório**.

Regra: avalie o conteúdo pelo valor (fatos, exemplos, pegadinhas, cobertura de
tópico) e aplique aqui **no padrão deste projeto** — categorização por
matéria/fase em JSON (`src/data/*.json`, ver estrutura em `src/types.ts`),
localStorage, sem backend. Nunca adote a estrutura de dados ou stack do texto
colado (ex: tabelas Supabase, alternativas A-E, Next.js) sem confirmar
explicitamente com o usuário antes — o padrão deste projeto é quem manda.

## Mecânica de jogo: sem "virar carta e adivinhar posição"

Foi implementado e depois removido um modo de jogo da memória (flip-match:
virar duas cartas, comparar, repetir se errar). O usuário não gostou —
prefere a mecânica de categorização (arrastar/tocar a peça no pote certo)
porque não depende de decorar posição na tela, só de saber a resposta.

Quando um conteúdo não encaixa bem em "pote com poucas categorias e vários
exemplos" (ex: conteúdo com passos/sequência, como alguns tópicos de
Português), não usar flip-match como alternativa. Perguntar ao usuário antes
de propor uma mecânica nova — ele já indicou interesse numa lógica de
"sequência de passos" no mesmo visual do jogo (tema escuro, cards, potes
coloridos), mas isso ainda não foi desenhado nem confirmado.
