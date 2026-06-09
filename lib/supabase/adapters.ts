import type { Questao, QuestionWithAlternatives } from '@/types';

/**
 * Converte o formato antigo (Questao) para o formato Supabase (Question + alternatives)
 * Útil para usar mock data compatível com a estrutura real do banco
 */
export function converterQuestaoParaSupabase(questao: Questao): QuestionWithAlternatives {
  // Transforma a resposta direta em alternativas de múltipla escolha
  // Opção A é a resposta correta, B/C/D são distradores genéricos
  const resposta_correta = questao.resposta.toLowerCase();

  return {
    question_text: questao.enunciado,
    explanation_html: `<p><strong>Resposta:</strong> ${questao.resposta}</p><p><strong>Dica:</strong> ${questao.dica}</p>`,
    difficulty: questao.nivel,
    tags: questao.topico ? [questao.topico] : [],
    source: 'baked',
    is_active: true,
    alternatives: [
      {
        sort_order: 0,
        text: questao.resposta,
        is_correct: true,
      },
      {
        sort_order: 1,
        text: 'Outra alternativa',
        is_correct: false,
      },
      {
        sort_order: 2,
        text: 'Outra alternativa',
        is_correct: false,
      },
      {
        sort_order: 3,
        text: 'Outra alternativa',
        is_correct: false,
      },
    ],
  };
}

/**
 * Retorna a resposta correta (texto) de uma questão com alternativas
 */
export function obterRespostaCorreta(
  questao: QuestionWithAlternatives
): string | null {
  const alternativa = questao.alternatives.find((alt) => alt.is_correct);
  return alternativa?.text || null;
}

/**
 * Verifica se a resposta do usuário está correta
 */
export function validarResposta(
  questao: QuestionWithAlternatives,
  indiceEscolhido: number
): boolean {
  const alternativa = questao.alternatives[indiceEscolhido];
  return alternativa?.is_correct ?? false;
}
