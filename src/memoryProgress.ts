const STORAGE_KEY = "jogo_memoria_progresso";

export interface MemoryProgressEntry {
  bestAttempts: number;
  pares: number;
  playedAt: number;
}

type MemoryProgress = Record<string, MemoryProgressEntry>;

export function loadMemoryProgress(): MemoryProgress {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as MemoryProgress;
  } catch {
    return {};
  }
}

export function saveMemoryProgress(deckId: string, attempts: number, pares: number): void {
  const progress = loadMemoryProgress();
  const prevBest = progress[deckId]?.bestAttempts;
  const bestAttempts = prevBest === undefined ? attempts : Math.min(prevBest, attempts);
  progress[deckId] = { bestAttempts, pares, playedAt: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage indisponível — progresso não persiste nesta sessão
  }
}
