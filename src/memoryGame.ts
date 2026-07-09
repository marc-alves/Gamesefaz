import { MEMORY_DECKS } from "./data/memory-index";
import { loadMemoryProgress, saveMemoryProgress } from "./memoryProgress";
import type { MemoryCard, MemoryDeck } from "./types";

const MISMATCH_DELAY_MS = 900;

interface MemoryState {
  deck: MemoryDeck | null;
  cards: MemoryCard[];
  flippedIds: string[];
  matchedParIds: Set<string>;
  attempts: number;
  locked: boolean;
}

const state: MemoryState = {
  deck: null,
  cards: [],
  flippedIds: [],
  matchedParIds: new Set(),
  attempts: 0,
  locked: false,
};

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Elemento #${id} não encontrado`);
  return node as T;
}

const dom = {
  menuView: el<HTMLDivElement>("memory-menu-view"),
  gameView: el<HTMLDivElement>("memory-game-view"),
  deckList: el<HTMLDivElement>("memory-deck-list"),
  topicTag: el<HTMLParagraphElement>("memory-topic-tag"),
  heading: el<HTMLParagraphElement>("memory-heading"),
  attemptsLabel: el<HTMLParagraphElement>("memory-attempts-label"),
  board: el<HTMLDivElement>("memory-board"),
  feedback: el<HTMLParagraphElement>("memory-feedback"),
  endScreen: el<HTMLDivElement>("memory-end-screen"),
  endTopicTag: el<HTMLParagraphElement>("memory-end-topic-tag"),
  endSub: el<HTMLParagraphElement>("memory-end-sub"),
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function showMemoryMenu(): void {
  document.getElementById("menu-view")!.style.display = "none";
  document.getElementById("game-view")!.style.display = "none";
  dom.gameView.style.display = "none";
  renderDeckList();
  dom.menuView.style.display = "block";
}

function backToMainMenu(): void {
  dom.menuView.style.display = "none";
  document.getElementById("menu-view")!.style.display = "block";
}

function renderDeckList(): void {
  const progress = loadMemoryProgress();
  dom.deckList.innerHTML = "";
  const frag = document.createDocumentFragment();

  MEMORY_DECKS.forEach((deck) => {
    const saved = progress[deck.id_jogo];
    const scoreText = saved
      ? `Melhor: ${saved.bestAttempts} tentativas`
      : "Ainda não jogado";

    const card = document.createElement("div");
    card.className = "level-card";
    card.dataset.deckId = deck.id_jogo;
    card.innerHTML =
      `<div><span class="tier-tag">NÍVEL ${deck.nivel}</span><br>` +
      `<p class="level-title">${deck.topico}</p><p class="level-sub">${deck.materia} — ${deck.pares.length} pares</p></div>` +
      `<div class="level-score">${scoreText}</div>`;
    frag.appendChild(card);
  });

  dom.deckList.appendChild(frag);
}

dom.deckList.addEventListener("click", (e) => {
  const card = (e.target as HTMLElement).closest<HTMLElement>(".level-card");
  if (!card) return;
  const deck = MEMORY_DECKS.find((d) => d.id_jogo === card.dataset.deckId);
  if (deck) startDeck(deck);
});

function startDeck(deck: MemoryDeck): void {
  state.deck = deck;
  state.cards = shuffle(
    deck.pares.flatMap((par) => [
      { cardId: `${par.par_id}-a`, parId: par.par_id, side: "a" as const, text: par.carta_a },
      { cardId: `${par.par_id}-b`, parId: par.par_id, side: "b" as const, text: par.carta_b },
    ])
  );
  state.flippedIds = [];
  state.matchedParIds = new Set();
  state.attempts = 0;
  state.locked = false;

  dom.topicTag.textContent = `${deck.materia} — Nível ${deck.nivel}`;
  dom.heading.textContent = `${deck.topico} — vire duas cartas pra achar o par`;
  dom.feedback.textContent = "";
  dom.endScreen.style.display = "none";
  dom.board.style.display = "grid";

  updateAttemptsLabel();
  renderBoard();

  dom.menuView.style.display = "none";
  dom.gameView.style.display = "block";
}

function updateAttemptsLabel(): void {
  const totalPairs = state.deck!.pares.length;
  dom.attemptsLabel.textContent = `${state.matchedParIds.size} de ${totalPairs} pares — ${state.attempts} tentativas`;
}

function renderBoard(): void {
  dom.board.innerHTML = "";
  const frag = document.createDocumentFragment();

  state.cards.forEach((card) => {
    const isMatched = state.matchedParIds.has(card.parId);
    const isFlipped = state.flippedIds.includes(card.cardId);

    const el = document.createElement("div");
    el.className = "memory-card" + (isFlipped || isMatched ? " flipped" : "") + (isMatched ? " matched" : "");
    el.dataset.cardId = card.cardId;
    el.textContent = isFlipped || isMatched ? card.text : "?";
    frag.appendChild(el);
  });

  dom.board.appendChild(frag);
}

dom.board.addEventListener("click", (e) => {
  if (state.locked) return;
  const cardEl = (e.target as HTMLElement).closest<HTMLElement>(".memory-card");
  if (!cardEl) return;
  const cardId = cardEl.dataset.cardId!;
  const card = state.cards.find((c) => c.cardId === cardId);
  if (!card || state.matchedParIds.has(card.parId) || state.flippedIds.includes(cardId)) return;
  if (state.flippedIds.length >= 2) return;

  state.flippedIds.push(cardId);
  renderBoard();

  if (state.flippedIds.length === 2) {
    state.attempts += 1;
    const [firstId, secondId] = state.flippedIds;
    const first = state.cards.find((c) => c.cardId === firstId)!;
    const second = state.cards.find((c) => c.cardId === secondId)!;

    if (first.parId === second.parId && first.side !== second.side) {
      state.matchedParIds.add(first.parId);
      const par = state.deck!.pares.find((p) => p.par_id === first.parId)!;
      dom.feedback.textContent = `✓ ${par.carta_a} — ${par.explicacao_ao_acertar}`;
      dom.feedback.style.color = "var(--text-success)";
      state.flippedIds = [];
      updateAttemptsLabel();
      renderBoard();
      checkComplete();
    } else {
      state.locked = true;
      dom.feedback.textContent = "Não é esse par — tenta lembrar onde estavam.";
      dom.feedback.style.color = "var(--text-danger)";
      updateAttemptsLabel();
      setTimeout(() => {
        state.flippedIds = [];
        state.locked = false;
        renderBoard();
      }, MISMATCH_DELAY_MS);
    }
  }
});

function checkComplete(): void {
  const deck = state.deck!;
  if (state.matchedParIds.size < deck.pares.length) return;

  saveMemoryProgress(deck.id_jogo, state.attempts, deck.pares.length);

  dom.endTopicTag.textContent = `${deck.materia} — Nível ${deck.nivel}`;
  dom.endSub.textContent = `${deck.topico}: ${deck.pares.length} pares em ${state.attempts} tentativas.`;
  dom.endScreen.style.display = "block";
  dom.board.style.display = "none";
}

function backToDeckList(): void {
  dom.gameView.style.display = "none";
  renderDeckList();
  dom.menuView.style.display = "block";
}

export function initMemoryGame(): void {
  el<HTMLButtonElement>("goto-memory-btn").onclick = showMemoryMenu;
  el<HTMLButtonElement>("memory-back-to-main-btn").onclick = backToMainMenu;
  el<HTMLButtonElement>("memory-back-btn").onclick = backToDeckList;
  el<HTMLButtonElement>("memory-restart-btn").onclick = () => startDeck(state.deck!);
  el<HTMLButtonElement>("memory-menu-btn").onclick = backToDeckList;
}
