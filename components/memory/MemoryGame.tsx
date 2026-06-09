'use client';

import { useState, useEffect } from 'react';
import type { MemoryGameState, MemoryCard } from '@/lib/memory-game';
import {
  gerarCardsDeMemoria,
  inicializarJogo,
  virarCard,
  calcularEstatisticas,
} from '@/lib/memory-game';
import { useQuestoesHibrido } from '@/hooks/useQuestoesHibrido';

interface MemoryGameProps {
  topico?: string;
  difficulty?: 'facil' | 'medio' | 'dificil';
  onGameEnd?: (score: number, moves: number) => void;
}

export function MemoryGame({
  topico,
  difficulty = 'medio',
  onGameEnd,
}: MemoryGameProps) {
  const { questoes, loading: questoesLoading, usingMock } = useQuestoesHibrido(topico);
  const [gameState, setGameState] = useState<MemoryGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  // Inicializa o jogo
  useEffect(() => {
    if (questoes.length > 0) {
      const cards = gerarCardsDeMemoria(questoes);
      const initialState = inicializarJogo(cards, difficulty);
      setGameState(initialState);
      setLoading(false);
    }
  }, [questoes, difficulty]);

  useEffect(() => {
    if (!questoesLoading && questoes.length === 0) {
      setLoading(false);
    }
  }, [questoesLoading, questoes]);

  if (loading || !gameState) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Carregando jogo...</p>
      </div>
    );
  }

  const handleCardClick = (cardId: string) => {
    if (gameState.flippedCards.length >= 2 || gameState.isGameOver) return;

    const newState = virarCard(gameState, cardId);
    setGameState(newState);

    if (newState.isGameOver) {
      const stats = calcularEstatisticas(newState);
      onGameEnd?.(newState.score, newState.moves);
      setShowStats(true);
    }
  };

  const handleRestart = () => {
    const cards = gerarCardsDeMemoria(questoes);
    const newState = inicializarJogo(cards, difficulty);
    setGameState(newState);
    setShowStats(false);
  };

  const stats = calcularEstatisticas(gameState);

  return (
    <div className="w-full p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between gap-2 mb-1 md:mb-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Jogo da Memória</h2>
          {usingMock && (
            <span className="px-2 md:px-3 py-1 bg-yellow-700 border border-yellow-500 text-yellow-200 text-xs font-bold rounded-full">
              📌 Mock
            </span>
          )}
        </div>
        {topico && (
          <p className="text-sm md:text-base text-gray-300 line-clamp-2">{topico}</p>
        )}
      </div>

      {/* Stats - Mobile: 2x2, Tablet+: 1x4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-3 md:p-4 rounded-xl border-2 border-blue-500 shadow-md">
          <p className="text-xs md:text-sm text-blue-200 font-semibold">Movimentos</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-300">{gameState.moves}</p>
        </div>
        <div className="bg-gradient-to-br from-green-900 to-green-800 p-3 md:p-4 rounded-xl border-2 border-green-500 shadow-md">
          <p className="text-xs md:text-sm text-green-200 font-semibold">Pares</p>
          <p className="text-2xl md:text-3xl font-bold text-green-300">
            {gameState.matchedPairs.size}/{Math.ceil(gameState.cards.length / 2)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-3 md:p-4 rounded-xl border-2 border-purple-500 shadow-md">
          <p className="text-xs md:text-sm text-purple-200 font-semibold">Pontos</p>
          <p className="text-2xl md:text-3xl font-bold text-purple-300">{gameState.score}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-900 to-orange-800 p-3 md:p-4 rounded-xl border-2 border-orange-500 shadow-md">
          <p className="text-xs md:text-sm text-orange-200 font-semibold">Dificuldade</p>
          <p className="text-lg md:text-2xl font-bold text-orange-300 capitalize">{difficulty}</p>
        </div>
      </div>

      {/* Game Board - Mobile: 2x?, Tablet: 3x?, Desktop: 4x? */}
      {!showStats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4 mb-8">
          {gameState.cards.map((card) => (
            <MemoryCardComponent
              key={card.id}
              card={card}
              isFlipped={gameState.flippedCards.includes(card.id) || card.isMatched}
              isMatched={card.isMatched}
              onClick={() => handleCardClick(card.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 md:p-8 rounded-xl mb-8 border-2 border-purple-500 shadow-lg">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 text-center">
            🎉 Parabéns! Você completou o jogo!
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-4 rounded-lg border border-purple-500">
              <p className="text-xs md:text-sm text-purple-200">Pontuação Final</p>
              <p className="text-3xl md:text-4xl font-bold text-purple-300">{stats.pontuacao}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-4 rounded-lg border border-blue-500">
              <p className="text-xs md:text-sm text-blue-200">Movimentos</p>
              <p className="text-3xl md:text-4xl font-bold text-blue-300">{stats.movimentos}</p>
            </div>
            <div className="bg-gradient-to-br from-green-900 to-green-800 p-4 rounded-lg border border-green-500">
              <p className="text-xs md:text-sm text-green-200">Tempo</p>
              <p className="text-3xl md:text-4xl font-bold text-green-300">{stats.tempoTotal}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-900 to-orange-800 p-4 rounded-lg border border-orange-500">
              <p className="text-xs md:text-sm text-orange-200">Taxa de Acerto</p>
              <p className="text-3xl md:text-4xl font-bold text-orange-300">{stats.taxaAcerto}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleRestart}
          className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition font-bold text-sm md:text-base shadow-lg border border-indigo-500"
        >
          {showStats ? '🔄 Novo Jogo' : '🔄 Reiniciar'}
        </button>
        {gameState.isGameOver && (
          <button
            onClick={() => setShowStats(false)}
            className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition font-bold text-sm md:text-base shadow-lg border border-gray-600"
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  );
}

interface MemoryCardComponentProps {
  card: MemoryCard;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
}

function MemoryCardComponent({
  card,
  isFlipped,
  isMatched,
  onClick,
}: MemoryCardComponentProps) {
  return (
    <button
      onClick={onClick}
      disabled={isMatched}
      className={`
        relative w-full aspect-square p-3 md:p-4 rounded-xl font-semibold text-xs md:text-sm
        transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg
        ${
          isFlipped
            ? 'bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-800 text-white border-2 border-indigo-500 shadow-lg'
            : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700 border-2 border-gray-600'
        }
        ${isMatched ? 'opacity-60 scale-95 bg-gradient-to-br from-green-600 to-emerald-700 border-green-500' : ''}
      `}
    >
      <div className="absolute inset-0 flex items-center justify-center p-2 md:p-4">
        {isFlipped ? (
          <p className="text-center text-[0.65rem] md:text-xs line-clamp-3 break-words leading-tight font-bold">
            {card.content}
          </p>
        ) : (
          <span className="text-lg md:text-2xl">❓</span>
        )}
      </div>
    </button>
  );
}
