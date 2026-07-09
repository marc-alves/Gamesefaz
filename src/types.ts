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
