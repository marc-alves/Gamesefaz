import type { MemoryDeck } from "../types";
import memoriaTi from "./memoria-ti.json";

const raw = [...memoriaTi];

export const MEMORY_DECKS: MemoryDeck[] = raw as unknown as MemoryDeck[];
