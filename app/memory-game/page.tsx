'use client';

import { useState } from 'react';
import { MemoryGame } from '@/components/memory/MemoryGame';
import { useQuestoes } from '@/hooks/useQuestoes';

export default function MemoryGamePage() {
  const { listarTopicos } = useQuestoes();
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'facil' | 'medio' | 'dificil'>(
    'medio'
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [lastScore, setLastScore] = useState<{ score: number; moves: number } | null>(null);

  const topicos = listarTopicos();

  const handleGameEnd = (score: number, moves: number) => {
    setLastScore({ score, moves });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-6 pb-20 md:pb-6">
      <div className="w-full md:max-w-4xl md:mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-1 md:mb-2">
            🧠 Jogo da Memória Educacional
          </h1>
          <p className="text-xs md:text-base text-gray-600">
            Estude para o concurso jogando! Pareie perguntas com respostas.
          </p>
        </div>

        {!gameStarted ? (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
            {/* Topic Selection */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">
                1. Escolha um Tópico
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {topicos.map((topico) => (
                  <button
                    key={topico}
                    onClick={() => setSelectedTopic(topico)}
                    className={`p-3 md:p-4 rounded-lg border-2 transition text-left text-sm md:text-base ${
                      selectedTopic === topico
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <p className="font-semibold text-xs md:text-sm line-clamp-2">{topico}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">
                2. Escolha a Dificuldade
              </h2>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {(['facil', 'medio', 'dificil'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`p-3 md:p-4 rounded-lg border-2 transition font-semibold text-xs md:text-base ${
                      selectedDifficulty === diff
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    {diff === 'facil'
                      ? '⭐ Fácil'
                      : diff === 'medio'
                        ? '⭐⭐ Médio'
                        : '⭐⭐⭐ Difícil'}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => setGameStarted(true)}
              disabled={!selectedTopic}
              className={`w-full py-3 md:py-4 rounded-lg font-bold text-base md:text-lg transition ${
                selectedTopic
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              🎮 Começar Jogo
            </button>

            {/* Last Score */}
            {lastScore && (
              <div className="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-green-900 mb-2 md:mb-3 text-sm md:text-base">
                  ✅ Última Partida
                </h3>
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-green-700">Pontos</p>
                    <p className="text-xl md:text-2xl font-bold text-green-600">
                      {lastScore.score}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-green-700">Movimentos</p>
                    <p className="text-xl md:text-2xl font-bold text-green-600">
                      {lastScore.moves}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
            <button
              onClick={() => setGameStarted(false)}
              className="mb-4 md:mb-6 px-3 md:px-4 py-2 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 text-sm md:text-base"
            >
              ← Voltar para Menu
            </button>
            <MemoryGame
              topico={selectedTopic}
              difficulty={selectedDifficulty}
              onGameEnd={handleGameEnd}
            />
          </div>
        )}
      </div>
    </div>
  );
}
