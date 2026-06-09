import { QUESTOES_MOCK } from '@/data/questoes.mock';
import { converterQuestaoParaSupabase } from '@/lib/supabase/adapters';
import type { Questao, QuestionWithAlternatives } from '@/types';

/**
 * Hook para buscar questões (suporta mock e Supabase)
 * Simula uma busca com dados mock; substitua por Supabase quando as credenciais estiverem prontas
 */
export function useQuestoes(topico?: string) {
  const buscarPorTopico = (topico: string): Questao[] => {
    return QUESTOES_MOCK[topico] || [];
  };

  const buscarPorTopicoComAlternativas = (topico: string): QuestionWithAlternatives[] => {
    return buscarPorTopico(topico).map((q) => converterQuestaoParaSupabase(q));
  };

  const buscarPorNivel = (nivel: 1 | 2 | 3): Questao[] => {
    const todasAsQuestoes = Object.values(QUESTOES_MOCK).flat();
    return todasAsQuestoes.filter((q) => q.nivel === nivel);
  };

  const buscarPorNivelComAlternativas = (
    nivel: 1 | 2 | 3
  ): QuestionWithAlternatives[] => {
    return buscarPorNivel(nivel).map((q) => converterQuestaoParaSupabase(q));
  };

  const buscarTodas = (): Questao[] => {
    return Object.values(QUESTOES_MOCK).flat();
  };

  const buscarTodasComAlternativas = (): QuestionWithAlternatives[] => {
    return buscarTodas().map((q) => converterQuestaoParaSupabase(q));
  };

  const buscarAleatorio = (topico?: string): Questao | null => {
    const questoes = topico ? buscarPorTopico(topico) : buscarTodas();
    if (questoes.length === 0) return null;
    return questoes[Math.floor(Math.random() * questoes.length)];
  };

  const buscarAleatoriComAlternativas = (topico?: string): QuestionWithAlternatives | null => {
    const questao = buscarAleatorio(topico);
    return questao ? converterQuestaoParaSupabase(questao) : null;
  };

  const listarTopicos = (): string[] => {
    return Object.keys(QUESTOES_MOCK);
  };

  const obterEstatisticas = () => {
    const todas = buscarTodas();
    const porTopico: Record<string, number> = {};
    const porNivel: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };

    todas.forEach((q) => {
      if (q.topico) {
        porTopico[q.topico] = (porTopico[q.topico] || 0) + 1;
      }
      porNivel[q.nivel] = (porNivel[q.nivel] || 0) + 1;
    });

    return {
      total: todas.length,
      porTopico,
      porNivel,
    };
  };

  return {
    // Formato antigo (Questao)
    questoes: topico ? buscarPorTopico(topico) : buscarTodas(),
    buscarPorTopico,
    buscarPorNivel,
    buscarTodas,
    buscarAleatorio,

    // Formato Supabase (QuestionWithAlternatives)
    questoesComAlternativas: topico
      ? buscarPorTopicoComAlternativas(topico)
      : buscarTodasComAlternativas(),
    buscarPorTopicoComAlternativas,
    buscarPorNivelComAlternativas,
    buscarTodasComAlternativas,
    buscarAleatoriComAlternativas,

    // Utilidades
    listarTopicos,
    obterEstatisticas,
  };
}
