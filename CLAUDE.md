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
