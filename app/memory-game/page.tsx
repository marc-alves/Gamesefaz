'use client';

import { useState } from 'react';
import { MemoryGame } from '@/components/memory/MemoryGame';
import { useQuestoesHibrido } from '@/hooks/useQuestoesHibrido';

export default function MemoryGamePage() {
  const { listarTopicos } = useQuestoesHibrido();
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6 pb-20 md:pb-6">
      <div className="w-full md:max-w-4xl md:mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 mb-1 md:mb-2">
            🧠 Jogo da Memória Educacional
          </h1>
          <p className="text-xs md:text-base text-gray-300">
            Estude para o concurso jogando! Pareie perguntas com respostas.
          </p>
        </div>

        {!gameStarted ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl p-4 md:p-8 border border-gray-700">
            {/* Topic Selection */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                1️⃣ Escolha um Tópico
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {topicos.map((topico) => (
                  <button
                    key={topico}
                    onClick={() => setSelectedTopic(topico)}
                    className={`p-3 md:p-4 rounded-lg border-2 transition text-left text-sm md:text-base font-semibold ${
                      selectedTopic === topico
                        ? 'border-purple-500 bg-gradient-to-br from-purple-900 to-purple-800 text-purple-200 shadow-lg'
                        : 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:border-gray-500'
                    }`}
                  >
                    <p className="line-clamp-2">{topico}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                2️⃣ Escolha a Dificuldade
              </h2>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {(['facil', 'medio', 'dificil'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`p-3 md:p-4 rounded-lg border-2 transition font-bold text-xs md:text-base ${
                      selectedDifficulty === diff
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-900 to-indigo-800 text-indigo-200 shadow-lg'
                        : 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:border-gray-500'
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
              className={`w-full py-3 md:py-4 rounded-lg font-bold text-base md:text-lg transition border-2 ${
                selectedTopic
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-purple-400 hover:from-blue-700 hover:to-purple-700 shadow-lg'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600'
              }`}
            >
              🎮 Começar Jogo
            </button>

            {/* Last Score */}
            {lastScore && (
              <div className="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-green-900 to-emerald-900 rounded-lg border-2 border-green-500 shadow-lg">
                <h3 className="font-bold text-green-200 mb-2 md:mb-3 text-sm md:text-base flex items-center gap-2">
                  ✅ Última Partida
                </h3>
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-green-300">Pontos</p>
                    <p className="text-xl md:text-2xl font-bold text-green-200">
                      {lastScore.score}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-green-300">Movimentos</p>
                    <p className="text-xl md:text-2xl font-bold text-green-200">
                      {lastScore.moves}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl p-4 md:p-8 border border-gray-700">
            <button
              onClick={() => setGameStarted(false)}
              className="mb-4 md:mb-6 px-3 md:px-4 py-2 text-purple-400 hover:text-purple-300 font-bold flex items-center gap-2 text-sm md:text-base transition hover:bg-gray-700 rounded px-3 py-1"
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
