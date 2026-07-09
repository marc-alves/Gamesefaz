import { loadProgress } from "./progress";
import type { LevelDef } from "./types";

const STORAGE_KEY = "jogo_cores_pesos";

const WEIGHT_INITIAL = 1.0;
const WEIGHT_MIN = 0.3;
const WEIGHT_MAX = 2.0;
const STEP_CORRECT = 0.15;
const STEP_WRONG = 0.3;

export type Band = "yellow" | "light-green" | "dark-green" | "neutral";

export interface Dominance {
  played: boolean;
  pct: number;
  band: Band;
}

type Weights = Record<string, number>;

function readWeights(): Weights {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Weights;
  } catch {
    return {};
  }
}

function writeWeights(weights: Weights): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
  } catch {
    // localStorage indisponível — pesos não persistem nesta sessão
  }
}

export function itemKey(levelId: string, itemIndex: number): string {
  return `${levelId}:${itemIndex}`;
}

export function getWeight(key: string): number {
  return readWeights()[key] ?? WEIGHT_INITIAL;
}

export function recordItemAnswer(key: string, correct: boolean): number {
  const weights = readWeights();
  const current = weights[key] ?? WEIGHT_INITIAL;
  const next = correct
    ? Math.max(WEIGHT_MIN, current - STEP_CORRECT)
    : Math.min(WEIGHT_MAX, current + STEP_WRONG);
  weights[key] = next;
  writeWeights(weights);
  return next;
}

// Domínio "ao vivo": não depende de a fase já ter sido concluída, usado
// pra barra dentro da partida (peças ainda não respondidas contam com peso inicial).
export function computeDominance(level: LevelDef): number {
  const weights = readWeights();
  const sum = level.items.reduce(
    (acc, _item, idx) => acc + (weights[itemKey(level.id, idx)] ?? WEIGHT_INITIAL),
    0
  );
  const avg = sum / level.items.length;
  const pct = ((WEIGHT_MAX - avg) / (WEIGHT_MAX - WEIGHT_MIN)) * 100;
  return Math.max(0, Math.min(100, pct));
}

export function bandForPct(pct: number): Exclude<Band, "neutral"> {
  if (pct < 40) return "yellow";
  if (pct < 71) return "light-green";
  return "dark-green";
}

// Domínio "de menu": só entra numa faixa se a fase já foi jogada ao menos
// uma vez; senão é neutro, pra não confundir "nunca joguei" com "fraco".
export function getLevelDominance(level: LevelDef): Dominance {
  const progress = loadProgress();
  if (!progress[level.id]) {
    return { played: false, pct: 0, band: "neutral" };
  }
  const pct = computeDominance(level);
  return { played: true, pct, band: bandForPct(pct) };
}
