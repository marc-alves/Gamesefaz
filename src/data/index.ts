import type { LevelDef } from "../types";
import direitoConstitucional from "./direito-constitucional.json";
import direitoAdministrativo from "./direito-administrativo.json";
import direitoFinanceiro from "./direito-financeiro.json";
import direitoTributario from "./direito-tributario.json";
import estatistica from "./estatistica.json";
import linguaPortuguesa from "./lingua-portuguesa.json";
import tecnologiaInformacao from "./tecnologia-informacao.json";

const raw = [
  ...direitoConstitucional,
  ...direitoAdministrativo,
  ...direitoFinanceiro,
  ...direitoTributario,
  ...estatistica,
  ...linguaPortuguesa,
  ...tecnologiaInformacao,
];

export const LEVELS: LevelDef[] = raw as unknown as LevelDef[];
