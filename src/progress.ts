import type { LevelDef, Progress } from "./types";

const STORAGE_KEY = "jogo_cores_progresso";

export function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Progress;
  } catch {
    return {};
  }
}

export function saveProgress(levelId: string, correct: number, total: number): void {
  const progress = loadProgress();
  const prevBest = progress[levelId]?.best ?? 0;
  progress[levelId] = { best: Math.max(prevBest, correct), total, playedAt: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage indisponível (modo privado, quota etc.) — progresso não persiste nesta sessão
  }
}

export function isUnlocked(level: LevelDef, progress: Progress): boolean {
  if (level.tier !== 2) return true;
  return !!(level.requires && progress[level.requires]);
}
