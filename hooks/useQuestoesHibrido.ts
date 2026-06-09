import { useState, useEffect } from 'react';
import { QUESTOES_MOCK } from '@/data/questoes.mock';
import { createClient } from '@/lib/supabase/client';
import type { Questao } from '@/types';

/**
 * Hook que tenta buscar dados do Supabase
 * Se falhar, usa dados mockados como fallback
 */
export function useQuestoesHibrido(topico?: string) {
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    const fetchQuestoes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Tenta buscar do Supabase
        const supabase = createClient();
        
        // Primeiro: busca o topic_id pelo nome
        if (!topico) {
          throw new Error('Tópico não especificado');
        }

        const { data: topics, error: topicError } = await supabase
          .from('topics')
          .select('id')
          .eq('name', topico)
          .limit(1);

        if (topicError) throw topicError;
        if (!topics || topics.length === 0) {
          throw new Error(`Tópico "${topico}" não encontrado no banco`);
        }

        const topicId = topics[0].id;

        // Busca as questões/training_cards
        const { data: cards, error: cardsError } = await supabase
          .from('training_cards')
          .select('id, enunciado, resposta, dica, nivel, topic_id')
          .eq('topic_id', topicId)
          .limit(100);

        if (cardsError) throw cardsError;

        if (cards && cards.length > 0) {
          const questoesFormatadas = cards.map((card: any) => ({
            id: card.id,
            enunciado: card.enunciado,
            resposta: card.resposta,
            dica: card.dica,
            nivel: card.nivel || 1,
            topico: topico,
          }));

          setQuestoes(questoesFormatadas);
          setUsingMock(false);
        } else {
          throw new Error('Nenhuma questão encontrada no banco');
        }
      } catch (err) {
        console.warn('⚠️ Falha ao buscar Supabase, usando mock:', err);

        // Fallback para mock
        setUsingMock(true);
        if (topico && QUESTOES_MOCK[topico]) {
          setQuestoes(QUESTOES_MOCK[topico]);
          setError(null); // Não mostra erro se o mock funcionou
        } else {
          setError(`Nenhum dado disponível para: ${topico}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuestoes();
  }, [topico]);

  const buscarPorTopico = (novoTopico: string): Questao[] => {
    if (QUESTOES_MOCK[novoTopico]) {
      return QUESTOES_MOCK[novoTopico];
    }
    return [];
  };

  const listarTopicos = (): string[] => {
    return Object.keys(QUESTOES_MOCK);
  };

  return {
    questoes,
    loading,
    error,
    usingMock,
    buscarPorTopico,
    listarTopicos,
  };
}
