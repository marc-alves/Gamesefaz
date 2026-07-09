import "./style.css";
import { LEVELS } from "./data";
import { loadProgress, saveProgress, isUnlocked } from "./progress";
import { recordDailyAnswer, getDailyStats, dailyLevel } from "./daily";
import {
  itemKey,
  getWeight,
  recordItemAnswer,
  computeDominance,
  bandForPct,
  getLevelDominance,
  type Band,
} from "./mastery";
import type { LevelDef, PoolItem, Mistake } from "./types";

const DEFAULT_CAPACITY = 3;
const COLOR_SLOTS = ["c1", "c2", "c3", "c4"];
const BAND_COLORS: Record<Band, string> = {
  yellow: "#E0B33D",
  "light-green": "#4FBE8D",
  "dark-green": "#0F6B4E",
  neutral: "var(--text-secondary)",
};

interface GameState {
  level: LevelDef | null;
  capacity: number;
  pool: PoolItem[];
  selectedId: number | null;
  correctCount: number;
  wasted: number;
  over: boolean;
  mistakes: Mistake[];
  perCat: Record<string, { correct: number; wrong: number }>;
  weightedScore: number;
  weightedPossible: number;
}

const state: GameState = {
  level: null,
  capacity: DEFAULT_CAPACITY,
  pool: [],
  selectedId: null,
  correctCount: 0,
  wasted: 0,
  over: false,
  mistakes: [],
  perCat: {},
  weightedScore: 0,
  weightedPossible: 0,
};

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Elemento #${id} não encontrado`);
  return node as T;
}

const dom = {
  menuView: el<HTMLDivElement>("menu-view"),
  gameView: el<HTMLDivElement>("game-view"),
  levelList: el<HTMLDivElement>("level-list"),
  dailyPointer: el<HTMLParagraphElement>("daily-pointer"),
  dailyPointerGame: el<HTMLParagraphElement>("daily-pointer-game"),
  subjectTag: el<HTMLParagraphElement>("subject-tag"),
  levelHeading: el<HTMLParagraphElement>("level-heading"),
  dominanceFill: el<HTMLDivElement>("dominance-fill"),
  pool: el<HTMLDivElement>("pool"),
  board: el<HTMLDivElement>("board"),
  scoreLabel: el<HTMLSpanElement>("score-label"),
  wastedLabel: el<HTMLSpanElement>("wasted-label"),
  weightedLabel: el<HTMLParagraphElement>("weighted-label"),
  feedback: el<HTMLParagraphElement>("feedback"),
  wastedTray: el<HTMLDivElement>("wasted-tray"),
  endScreen: el<HTMLDivElement>("end-screen"),
  endSubjectTag: el<HTMLParagraphElement>("end-subject-tag"),
  endTitle: el<HTMLParagraphElement>("end-title"),
  endSub: el<HTMLParagraphElement>("end-sub"),
  endDominance: el<HTMLParagraphElement>("end-dominance"),
  endReview: el<HTMLDivElement>("end-review"),
};

function renderDailyPointer(target: HTMLParagraphElement): void {
  const stats = getDailyStats();
  const dl = dailyLevel(stats);
  if (stats.total === 0) {
    target.textContent = "Hoje: ainda sem respostas";
    return;
  }
  const pct = Math.round((stats.correct / stats.total) * 100);
  target.textContent = `Hoje: Nível ${dl.level} — ${dl.label} (${pct}%, ${stats.total} respostas)`;
}

function renderDominanceBar(level: LevelDef): void {
  const pct = computeDominance(level);
  const band = bandForPct(pct);
  dom.dominanceFill.style.width = `${pct}%`;
  dom.dominanceFill.style.background = BAND_COLORS[band];
}

// ---------------------------------------------------------------------
// MENU — agrupado por matéria, tier 1 antes de tier 2, bloqueio visual
// ---------------------------------------------------------------------
function groupBySubject(levels: LevelDef[]): Map<string, LevelDef[]> {
  const groups = new Map<string, LevelDef[]>();
  levels.forEach((level) => {
    if (!groups.has(level.subject)) groups.set(level.subject, []);
    groups.get(level.subject)!.push(level);
  });
  groups.forEach((list) => list.sort((a, b) => a.tier - b.tier));
  return groups;
}

function renderMenu(): void {
  renderDailyPointer(dom.dailyPointer);

  const progress = loadProgress();
  const groups = groupBySubject(LEVELS);
  dom.levelList.innerHTML = "";
  const frag = document.createDocumentFragment();

  groups.forEach((levelsInSubject, subject) => {
    const heading = document.createElement("p");
    heading.className = "subject-heading";
    heading.textContent = subject;
    frag.appendChild(heading);

    levelsInSubject.forEach((level) => {
      const unlocked = isUnlocked(level, progress);
      const saved = progress[level.id];
      const scoreText = !unlocked
        ? "Bloqueada"
        : saved
        ? `Melhor: ${saved.best}/${saved.total}`
        : "Ainda não jogado";
      const dominance = getLevelDominance(level);
      const dot = unlocked
        ? `<span class="dominance-dot" style="background:${BAND_COLORS[dominance.band]};"></span>`
        : "";

      const card = document.createElement("div");
      card.className = "level-card" + (unlocked ? "" : " locked");
      card.dataset.levelId = level.id;
      const tierTag = `<span class="tier-tag">${level.tier === 2 ? "FASE 2" : "FASE 1"}</span><br>`;
      const lockNote = unlocked ? "" : '<p class="level-sub">🔒 Complete a Fase 1 primeiro</p>';
      card.innerHTML =
        `<div>${tierTag}<p class="level-title">${level.title}</p><p class="level-sub">${level.subtitle}</p>${lockNote}</div>` +
        `<div class="level-score">${dot}${scoreText}</div>`;
      frag.appendChild(card);
    });
  });

  dom.levelList.appendChild(frag);
}

dom.levelList.addEventListener("click", (e) => {
  const card = (e.target as HTMLElement).closest<HTMLElement>(".level-card");
  if (!card || card.classList.contains("locked")) return;
  const level = LEVELS.find((l) => l.id === card.dataset.levelId);
  if (level) startLevel(level);
});

// ---------------------------------------------------------------------
// INÍCIO DE FASE
// ---------------------------------------------------------------------
function startLevel(level: LevelDef): void {
  state.level = level;
  state.capacity = level.capacity || DEFAULT_CAPACITY;
  state.pool = level.items
    .map((item, idx) => ({ ...item, id: idx }))
    .sort(() => Math.random() - 0.5);
  state.selectedId = null;
  state.correctCount = 0;
  state.wasted = 0;
  state.over = false;
  state.mistakes = [];
  state.perCat = {};
  Object.keys(level.cats).forEach((cat) => {
    state.perCat[cat] = { correct: 0, wrong: 0 };
  });
  state.weightedScore = 0;
  state.weightedPossible = level.items.reduce(
    (acc, _item, idx) => acc + getWeight(itemKey(level.id, idx)),
    0
  );

  dom.subjectTag.textContent = `${level.subject} — ${level.tier === 2 ? "Fase 2" : "Fase 1"}`;
  dom.levelHeading.textContent = level.surprise
    ? `${level.title} — toque numa peça e depois no pote certo (os potes trocam de lugar a cada partida!)`
    : `${level.title} — toque numa peça e depois no pote certo`;
  buildBoard(level);

  dom.endScreen.style.display = "none";
  dom.board.style.display = "grid";
  dom.pool.style.display = "flex";
  dom.wastedTray.style.display = "flex";
  dom.feedback.textContent = "";

  updateScoreLabels();
  renderDominanceBar(level);
  renderDailyPointer(dom.dailyPointerGame);
  renderPool();
  renderWasted();

  dom.menuView.style.display = "none";
  dom.gameView.style.display = "block";
}

function buildBoard(level: LevelDef): void {
  dom.board.innerHTML = "";
  const frag = document.createDocumentFragment();
  const catIds = level.surprise
    ? [...Object.keys(level.cats)].sort(() => Math.random() - 0.5)
    : Object.keys(level.cats);
  catIds.forEach((cat, idx) => {
    const slot = COLOR_SLOTS[idx % COLOR_SLOTS.length];
    const pote = document.createElement("div");
    pote.className = "pote";
    pote.dataset.cat = cat;
    pote.style.background = `var(--${slot}-bg)`;
    pote.style.border = `0.5px solid var(--${slot}-mid)`;
    pote.innerHTML =
      `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:var(--${slot}-text);">${level.cats[cat].label}</p>` +
      `<div class="placed"></div>`;
    frag.appendChild(pote);
  });
  dom.board.appendChild(frag);
}

function updateScoreLabels(): void {
  dom.scoreLabel.textContent = `${state.correctCount} de ${state.level!.items.length} corretas`;
  dom.wastedLabel.textContent = `Slots à toa: ${state.wasted}/${state.capacity}`;
  dom.weightedLabel.textContent = `${state.weightedScore.toFixed(1)} / ${state.weightedPossible.toFixed(1)} pts ponderados`;
}

// ---------------------------------------------------------------------
// RENDER
// ---------------------------------------------------------------------
function renderPool(): void {
  dom.pool.innerHTML = "";
  const frag = document.createDocumentFragment();
  state.pool.forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "chip" + (item.id === state.selectedId ? " sel" : "");
    chip.textContent = item.text;
    chip.dataset.id = String(item.id);
    chip.style.transform = `rotate(${(Math.random() * 6 - 3).toFixed(1)}deg)`;
    frag.appendChild(chip);
  });
  dom.pool.appendChild(frag);
}

function renderWasted(): void {
  dom.wastedTray.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (let i = 0; i < state.capacity; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    if (i < state.wasted) slot.textContent = "×";
    frag.appendChild(slot);
  }
  dom.wastedTray.appendChild(frag);
}

function placeInPote(cat: string, item: PoolItem): void {
  const pote = dom.board.querySelector<HTMLDivElement>(`.pote[data-cat="${cat}"] .placed`);
  if (!pote) return;
  const chip = document.createElement("div");
  chip.className = "placed-chip";
  chip.textContent = item.text;
  pote.appendChild(chip);
}

// ---------------------------------------------------------------------
// TELA FINAL
// ---------------------------------------------------------------------
function buildLoseReview(): void {
  const level = state.level!;
  const frag = document.createDocumentFragment();
  state.mistakes.forEach((m) => {
    const div = document.createElement("div");
    div.className = "review-item";
    div.innerHTML =
      `<span style="color:var(--text-danger);">${m.text}</span><br>` +
      `<span style="color:var(--text-secondary);">Lembre-se: isso é ${level.cats[m.correct].label} ` +
      `(${level.cats[m.correct].block}), não ${level.cats[m.chosen].label}.</span>`;
    frag.appendChild(div);
  });
  dom.endReview.appendChild(frag);
}

function buildWinReview(): void {
  const level = state.level!;
  const frag = document.createDocumentFragment();
  const mastered: string[] = [];
  const toReview: string[] = [];
  Object.keys(level.cats).forEach((cat) => {
    const record = state.perCat[cat];
    if (record.correct === 3 && record.wrong === 0) {
      mastered.push(level.cats[cat].block);
    } else if (record.wrong > 0) {
      toReview.push(level.cats[cat].label);
    }
  });
  if (mastered.length) {
    const div = document.createElement("div");
    div.className = "review-item";
    div.innerHTML = `<span style="color:var(--text-success);">Você tá dominando (${level.subject}): ${mastered.join(", ")}.</span>`;
    frag.appendChild(div);
  }
  if (toReview.length) {
    const div2 = document.createElement("div");
    div2.className = "review-item";
    div2.innerHTML = `<span style="color:var(--text-secondary);">Ainda vale revisar: ${toReview.join(", ")}.</span>`;
    frag.appendChild(div2);
  }
  if (level.tier === 1) {
    const div3 = document.createElement("div");
    div3.className = "review-item";
    div3.innerHTML = `<span style="color:var(--text-secondary);">A Fase 2 dessa matéria já está liberada no menu.</span>`;
    frag.appendChild(div3);
  }
  dom.endReview.appendChild(frag);
}

function checkEnd(): boolean {
  const level = state.level!;
  const total = level.items.length;

  if (state.wasted >= state.capacity) {
    state.over = true;
    dom.endReview.innerHTML = "";
    dom.endSubjectTag.textContent = `${level.subject} — ${level.tier === 2 ? "Fase 2" : "Fase 1"}`;
    dom.endTitle.textContent = "Os slots à toa lotaram";
    dom.endSub.textContent = "Notei que você errou isso aqui:";
    buildLoseReview();
    finishLevel();
    return true;
  }

  if (state.pool.length === 0) {
    state.over = true;
    dom.endReview.innerHTML = "";
    dom.endSubjectTag.textContent = `${level.subject} — ${level.tier === 2 ? "Fase 2" : "Fase 1"}`;
    dom.endTitle.textContent = "Parabéns, todas relacionadas";
    dom.endSub.textContent = `${state.correctCount} de ${total} corretas, ${state.wasted} slot(s) à toa.`;
    buildWinReview();
    finishLevel();
    return true;
  }

  return false;
}

function finishLevel(): void {
  const level = state.level!;
  saveProgress(level.id, state.correctCount, level.items.length);

  const dominance = getLevelDominance(level);
  dom.endDominance.textContent = `Domínio dessa fase: ${Math.round(dominance.pct)}%`;
  dom.endDominance.style.color = BAND_COLORS[dominance.band];

  dom.endScreen.style.display = "block";
  dom.board.style.display = "none";
  dom.pool.style.display = "none";
  dom.wastedTray.style.display = "none";
}

// ---------------------------------------------------------------------
// INTERAÇÃO — delegação de evento
// ---------------------------------------------------------------------
dom.pool.addEventListener("click", (e) => {
  const chip = (e.target as HTMLElement).closest<HTMLElement>(".chip");
  if (!chip || state.over) return;
  const id = Number(chip.dataset.id);
  state.selectedId = state.selectedId === id ? null : id;
  renderPool();
});

dom.board.addEventListener("click", (e) => {
  const pote = (e.target as HTMLElement).closest<HTMLElement>(".pote");
  if (!pote || state.over || state.selectedId === null) return;

  const level = state.level!;
  const cat = pote.dataset.cat!;
  const item = state.pool.find((p) => p.id === state.selectedId);
  if (!item) return;

  state.pool = state.pool.filter((p) => p.id !== state.selectedId);

  const key = itemKey(level.id, item.id);
  const correct = item.cat === cat;
  const weightBefore = getWeight(key);

  if (correct) {
    state.correctCount += 1;
    state.perCat[cat].correct += 1;
    state.weightedScore += weightBefore;
    placeInPote(cat, item);
    dom.feedback.textContent = `"${item.text}" era mesmo ${level.cats[cat].label} (${level.subject}).`;
    dom.feedback.style.color = "var(--text-success)";
  } else {
    state.wasted += 1;
    state.perCat[item.cat].wrong += 1;
    state.mistakes.push({ text: item.text, chosen: cat, correct: item.cat });
    dom.feedback.textContent = `"${item.text}" não é ${level.cats[cat].label}. Era ${level.cats[item.cat].label} (${level.subject}).`;
    dom.feedback.style.color = "var(--text-danger)";
  }

  recordItemAnswer(key, correct);
  recordDailyAnswer(correct);

  state.selectedId = null;
  updateScoreLabels();
  renderDominanceBar(level);
  renderDailyPointer(dom.dailyPointerGame);
  renderPool();
  renderWasted();
  checkEnd();
});

el<HTMLButtonElement>("restart-btn").onclick = () => startLevel(state.level!);
el<HTMLButtonElement>("menu-btn").onclick = backToMenu;
el<HTMLButtonElement>("back-btn").onclick = backToMenu;

function backToMenu(): void {
  dom.gameView.style.display = "none";
  dom.menuView.style.display = "block";
  renderMenu();
}

// ---------------------------------------------------------------------
// BOOT
// ---------------------------------------------------------------------
renderMenu();
