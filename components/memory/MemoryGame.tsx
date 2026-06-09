'use client';

import { useState, useEffect } from 'react';
import type { MemoryGameState, MemoryCard } from '@/lib/memory-game';
import {
  gerarCardsDeMemoria,
  inicializarJogo,
  virarCard,
  calcularEstatisticas,
} from '@/lib/memory-game';
import { useQuestoes } from '@/hooks/useQuestoes';

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
  const { questoes } = useQuestoes(topico);
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
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">Jogo da Memória</h2>
        {topico && <p className="text-sm md:text-base text-gray-600 line-clamp-2">{topico}</p>}
      </div>

      {/* Stats - Mobile: 2x2, Tablet+: 1x4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
          <p className="text-xs md:text-sm text-gray-600">Movimentos</p>
          <p className="text-xl md:text-2xl font-bold text-blue-600">{gameState.moves}</p>
        </div>
        <div className="bg-green-50 p-3 md:p-4 rounded-lg">
          <p className="text-xs md:text-sm text-gray-600">Pares</p>
          <p className="text-xl md:text-2xl font-bold text-green-600">
            {gameState.matchedPairs.size}/{Math.ceil(gameState.cards.length / 2)}
          </p>
        </div>
        <div className="bg-purple-50 p-3 md:p-4 rounded-lg">
          <p className="text-xs md:text-sm text-gray-600">Pontos</p>
          <p className="text-xl md:text-2xl font-bold text-purple-600">{gameState.score}</p>
        </div>
        <div className="bg-orange-50 p-3 md:p-4 rounded-lg">
          <p className="text-xs md:text-sm text-gray-600">Dificuldade</p>
          <p className="text-sm md:text-lg font-bold text-orange-600 capitalize">{difficulty}</p>
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
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 md:p-8 rounded-lg mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 text-center">
            🎉 Parabéns! Você completou o jogo!
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Pontuação Final</p>
              <p className="text-3xl md:text-4xl font-bold text-purple-600">{stats.pontuacao}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Movimentos</p>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">{stats.movimentos}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Tempo</p>
              <p className="text-3xl md:text-4xl font-bold text-green-600">{stats.tempoTotal}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Taxa de Acerto</p>
              <p className="text-3xl md:text-4xl font-bold text-orange-600">{stats.taxaAcerto}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleRestart}
          className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm md:text-base"
        >
          {showStats ? '🔄 Novo Jogo' : '🔄 Reiniciar'}
        </button>
        {gameState.isGameOver && (
          <button
            onClick={() => setShowStats(false)}
            className="px-4 md:px-6 py-2 md:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-sm md:text-base"
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
        relative w-full aspect-square p-3 md:p-4 rounded-lg font-semibold text-xs md:text-sm
        transition-all duration-300 cursor-pointer
        ${
          isFlipped
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }
        ${isMatched ? 'opacity-75 scale-95' : ''}
      `}
    >
      <div className="absolute inset-0 flex items-center justify-center p-2 md:p-4">
        {isFlipped ? (
          <p className="text-center text-[0.65rem] md:text-xs line-clamp-3 break-words leading-tight">
            {card.content}
          </p>
        ) : (
          <span className="text-lg md:text-2xl">❓</span>
        )}
      </div>
    </button>
  );
}
