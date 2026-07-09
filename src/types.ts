export interface CategoryDef {
  label: string;
  block: string;
}

export interface ItemDef {
  text: string;
  cat: string;
}

export interface LevelDef {
  id: string;
  subject: string;
  tier: 1 | 2;
  requires?: string;
  capacity?: number;
  title: string;
  subtitle: string;
  cats: Record<string, CategoryDef>;
  items: ItemDef[];
  surprise?: boolean;
}

export interface ProgressEntry {
  best: number;
  total: number;
  playedAt: number;
}

export type Progress = Record<string, ProgressEntry>;

export interface PoolItem extends ItemDef {
  id: number;
}

export interface Mistake {
  text: string;
  chosen: string;
  correct: string;
}

export interface MemoryPair {
  par_id: string;
  carta_a: string;
  carta_b: string;
  explicacao_ao_acertar: string;
}

export interface MemoryDeck {
  id_jogo: string;
  topico: string;
  materia: string;
  nivel: number;
  pares: MemoryPair[];
}

export interface MemoryCard {
  cardId: string;
  parId: string;
  side: "a" | "b";
  text: string;
}
