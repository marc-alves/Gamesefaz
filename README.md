# gameSEFAZ — Jogo das Cores

Jogo de categorização pra treinar conteúdo de concurso (Direito Constitucional,
Administrativo, Financeiro, Tributário e Estatística): você recebe uma peça de
texto e precisa arrastar/tocar no pote certo antes que os "slots à toa" lotem.

## Stack

- Vite + TypeScript (sem framework de UI — DOM manipulado direto)
- Dados de cada matéria em JSON separado (`src/data/*.json`)
- Progresso e pesos adaptativos guardados em `localStorage` (sem backend)

## Rodando localmente

```bash
npm install
npm run dev
```

## Estrutura

- `src/data/` — conteúdo das fases, um JSON por matéria
- `src/main.ts` — engine do jogo (estado, render, interação)
- `src/progress.ts` — melhor pontuação e desbloqueio de fases (localStorage)
- `src/mastery.ts` — peso adaptativo por peça (sobe ao errar, desce ao acertar) e domínio por fase
- `src/daily.ts` — ponteiro de desempenho do dia (reseta à meia-noite)

## Indicadores

- **Ponteiro do dia**: nível 1–5 baseado na taxa de acerto acumulada no dia, resetando sozinho quando a data muda.
- **Domínio por fase**: cada peça tem um peso próprio que persiste entre dias — acerta, o peso cai; erra, o peso sobe. A barra de domínio e o dot no menu refletem isso.

## Roadmap

Ideia de gamificação estilo FIFA Ultimate Team (cartas por matéria, raridade,
pacotes) documentada em [`docs/gamificacao-futebol.md`](docs/gamificacao-futebol.md) —
ainda não implementada.
