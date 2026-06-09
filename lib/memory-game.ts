import type { Questao } from '@/types';

/**
 * Transforma uma questão em um par de cards para o jogo da memória
 * Exemplo: "Qual é o conceito de X?" ↔ "Resposta: Y"
 */
export interface MemoryCard {
  id: string;
  content: string;
  type: 'question' | 'answer';
  pairId: string; // ID do card pareado
  difficulty: 1 | 2 | 3;
  topic: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemoryGameState {
  cards: MemoryCard[];
  flippedCards: string[]; // IDs dos cards virados
  matchedPairs: Set<string>; // IDs dos cards já pareados
  moves: number;
  score: number;
  isGameOver: boolean;
  gameStartedAt: number;
  difficulty: 'facil' | 'medio' | 'dificil';
}

/**
 * Gera cards de memória a partir de questões
 */
export function gerarCardsDeMemoria(questoes: Questao[]): MemoryCard[] {
  const cards: MemoryCard[] = [];
  let pairCounter = 0;

  questoes.forEach((questao, index) => {
    const pairId = `pair_${pairCounter}`;

    // Card 1: Pergunta
    cards.push({
      id: `card_${index}_q`,
      content: questao.enunciado,
      type: 'question',
      pairId,
      difficulty: questao.nivel,
      topic: questao.topico || 'Sem tópico',
      isFlipped: false,
      isMatched: false,
    });

    // Card 2: Resposta
    cards.push({
      id: `card_${index}_a`,
      content: `✓ ${questao.resposta}`,
      type: 'answer',
      pairId,
      difficulty: questao.nivel,
      topic: questao.topico || 'Sem tópico',
      isFlipped: false,
      isMatched: false,
    });

    pairCounter++;
  });

  // Embaralha os cards
  return cards.sort(() => Math.random() - 0.5);
}

/**
 * Inicializa o estado do jogo
 */
export function inicializarJogo(
  cards: MemoryCard[],
  difficulty: 'facil' | 'medio' | 'dificil' = 'medio'
): MemoryGameState {
  // Filtra by dificuldade
  let cardsFiltered = cards;
  if (difficulty === 'facil') {
    cardsFiltered = cards.filter((c) => c.difficulty <= 1);
  } else if (difficulty === 'dificil') {
    cardsFiltered = cards.filter((c) => c.difficulty >= 2);
  }

  return {
    cards: cardsFiltered.map((c) => ({ ...c, isFlipped: false, isMatched: false })),
    flippedCards: [],
    matchedPairs: new Set(),
    moves: 0,
    score: 0,
    isGameOver: false,
    gameStartedAt: Date.now(),
    difficulty,
  };
}

/**
 * Lógica ao virar um card
 */
export function virarCard(
  gameState: MemoryGameState,
  cardId: string
): MemoryGameState {
  const card = gameState.cards.find((c) => c.id === cardId);

  // Se card já foi virado ou pareado, ignora
  if (!card || card.isMatched || gameState.flippedCards.includes(cardId)) {
    return gameState;
  }

  const novoEstado = { ...gameState };
  novoEstado.flippedCards = [...gameState.flippedCards, cardId];

  // Quando 2 cards foram virados, verifica se são par
  if (novoEstado.flippedCards.length === 2) {
    const card1Id = novoEstado.flippedCards[0];
    const card2Id = novoEstado.flippedCards[1];

    const card1 = novoEstado.cards.find((c) => c.id === card1Id)!;
    const card2 = novoEstado.cards.find((c) => c.id === card2Id)!;

    novoEstado.moves += 1;

    // Se é um par, marca como matched
    if (card1.pairId === card2.pairId) {
      novoEstado.cards = novoEstado.cards.map((c) =>
        c.pairId === card1.pairId ? { ...c, isMatched: true } : c
      );
      novoEstado.matchedPairs.add(card1.pairId);

      // Calcula pontuação (pontos extras por dificuldade)
      const pontos = card1.difficulty === 1 ? 10 : card1.difficulty === 2 ? 20 : 30;
      novoEstado.score += pontos;

      // Reset flipped cards após delay
      setTimeout(() => {
        novoEstado.flippedCards = [];
      }, 800);
    } else {
      // Não é par, vira de volta após delay
      setTimeout(() => {
        novoEstado.flippedCards = [];
      }, 1200);
    }
  }

  // Verifica se ganhou
  if (novoEstado.matchedPairs.size === Math.ceil(gameState.cards.length / 2)) {
    novoEstado.isGameOver = true;
  }

  return novoEstado;
}

/**
 * Calcula estatísticas do jogo
 */
export function calcularEstatisticas(gameState: MemoryGameState) {
  const tempoTotalSeg = Math.round((Date.now() - gameState.gameStartedAt) / 1000);
  const minutos = Math.floor(tempoTotalSeg / 60);
  const segundos = tempoTotalSeg % 60;
  const pairesEncontrados = gameState.matchedPairs.size;
  const pairesTotal = Math.ceil(gameState.cards.length / 2);

  return {
    tempoTotal: `${minutos}m ${segundos}s`,
    pairesEncontrados,
    pairesTotal,
    taxaAcerto: pairesTotal > 0 ? Math.round((pairesEncontrados / pairesTotal) * 100) : 0,
    pontuacao: gameState.score,
    movimentos: gameState.moves,
  };
}
