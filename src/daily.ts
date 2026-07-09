const STORAGE_KEY = "jogo_cores_diario";

export interface DailyStats {
  date: string;
  correct: number;
  total: number;
}

export interface DailyLevel {
  level: number;
  label: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readStats(): DailyStats {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as DailyStats | null;
    if (raw && raw.date === todayKey()) return raw;
  } catch {
    // localStorage indisponível ou corrompido — recomeça o dia
  }
  return { date: todayKey(), correct: 0, total: 0 };
}

function writeStats(stats: DailyStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // localStorage indisponível — indicador não persiste nesta sessão
  }
}

export function recordDailyAnswer(correct: boolean): DailyStats {
  const stats = readStats();
  stats.total += 1;
  if (correct) stats.correct += 1;
  writeStats(stats);
  return stats;
}

export function getDailyStats(): DailyStats {
  return readStats();
}

export function dailyLevel(stats: DailyStats): DailyLevel {
  if (stats.total === 0) return { level: 0, label: "Sem respostas hoje" };
  const pct = (stats.correct / stats.total) * 100;
  if (pct < 40) return { level: 1, label: "Começando" };
  if (pct < 60) return { level: 2, label: "Esquentando" };
  if (pct < 75) return { level: 3, label: "No ritmo" };
  if (pct < 90) return { level: 4, label: "Afiado" };
  return { level: 5, label: "Voando" };
}
