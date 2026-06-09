"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Constants ─────────────────────────────────────────────────────────────────

const XP_PER_ACERTO    = 5;
const XP_PERFECT_BONUS = 10;
const CARDS_PER_SESSION = 5;
const INITIAL_LIVES    = 3;
const AUTO_ADVANCE_MS  = 1200;

function getIntervalMinutes(intervalo: number): number {
  const map: Record<number, number> = { 0: 10, 1: 1440, 2: 4320, 3: 10080, 4: 21600 };
  return map[Math.min(intervalo, 4)] ?? 21600;
}

// ── Levenshtein ───────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

function isCloseEnough(input: string, resposta: string): boolean {
  const a = normalizeAnswer(input);
  const b = normalizeAnswer(resposta);
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return true;
  return 1 - levenshtein(a, b) / maxLen >= 0.8;
}

// ── LocalStorage ──────────────────────────────────────────────────────────────

const GAM_KEY = "sefaz_gam";

interface GamData { xp: number; level: number; days: string[] }

function loadGam(): GamData {
  try {
    const s = localStorage.getItem(GAM_KEY);
    return s ? (JSON.parse(s) as GamData) : { xp: 0, level: 1, days: [] };
  } catch { return { xp: 0, level: 1, days: [] }; }
}
function saveGam(g: GamData): void {
  try { localStorage.setItem(GAM_KEY, JSON.stringify(g)); } catch { /* ignore */ }
}
function addXpLocal(amount: number): GamData {
  const g = loadGam();
  g.xp = (g.xp ?? 0) + amount;
  g.level = Math.floor(g.xp / 120) + 1;
  saveGam(g);
  return g;
}

interface LocalProgress {
  acertos: number; erros: number; intervalo: number; proxima_revisao: string;
}
function loadLocalProgress(cardId: string): LocalProgress {
  try {
    const s = localStorage.getItem(`sefaz_tc_${cardId}`);
    if (s) return JSON.parse(s) as LocalProgress;
  } catch { /* ignore */ }
  return { acertos: 0, erros: 0, intervalo: 0, proxima_revisao: new Date(0).toISOString() };
}
function saveLocalProgress(cardId: string, p: LocalProgress): void {
  try { localStorage.setItem(`sefaz_tc_${cardId}`, JSON.stringify(p)); } catch { /* ignore */ }
}

// ── Result messages ───────────────────────────────────────────────────────────

function getResultMessage(acertos: number, total: number): string {
  if (total === 0) return "Sessão encerrada.";
  const ratio = acertos / total;
  if (acertos === total) return "Perfeito! Você dominou esse treino!";
  if (ratio >= 0.8)  return "Mandou bem! Quase lá!";
  if (ratio >= 0.6)  return "Bom começo! Repita para fixar.";
  if (ratio >= 0.4)  return "Continue praticando, vai melhorar!";
  return "Não desista! Tente de novo.";
}

function getResultEmoji(acertos: number, total: number): string {
  if (total === 0) return "📚";
  const ratio = acertos / total;
  if (acertos === total) return "🏆";
  if (ratio >= 0.6) return "⭐";
  return "📚";
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrainingModalProps {
  open: boolean;
  provaId: string;
  sectionIndex: number;
  topicIndex: number;
  topicLabel: string;
  onClose?: () => void;
  onFinish?: () => void;
}

interface TrainingCard {
  id: string; enunciado: string; resposta: string; dica: string | null; nivel: number;
  acertos: number; erros: number; intervalo: number; proxima_revisao: string;
}

type Phase = "loading" | "treino" | "resultado" | "vazio";
type CardResult = "idle" | "correct" | "wrong";

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrainingModal({
  open,
  topicLabel,
  onClose,
  onFinish,
}: TrainingModalProps) {
  const supabase = createClient();

  const [cards,      setCards]      = useState<TrainingCard[]>([]);
  const [phase,      setPhase]      = useState<Phase>("loading");
  const [cardIndex,  setCardIndex]  = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [cardResult, setCardResult] = useState<CardResult>("idle");
  const [lives,      setLives]      = useState(INITIAL_LIVES);
  const [fadeIn,     setFadeIn]     = useState(true);
  const [xpEarned,   setXpEarned]   = useState(0);
  const [gam,        setGam]        = useState<GamData>({ xp: 0, level: 1, days: [] });

  const sessionAcertos = useRef(0);
  const sessionErros   = useRef(0);
  const inputRef       = useRef<HTMLInputElement>(null);
  const advanceTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  async function load() {
    setPhase("loading");

    const { data: topicData } = await supabase
      .from("topics")
      .select("id")
      .eq("name", topicLabel)
      .maybeSingle();

    if (!topicData) { setPhase("vazio"); return; }

    const topicId = (topicData as { id: string }).id;

    const { data: rawCards, error } = await supabase
      .from("training_cards")
      .select("id, enunciado, resposta, dica, nivel")
      .eq("topic_id", topicId)
      .eq("is_active", true);

    if (error || !rawCards || rawCards.length === 0) { setPhase("vazio"); return; }

    type RawCard = { id: string; enunciado: string; resposta: string; dica: string | null; nivel: number };

    let merged: TrainingCard[] = (rawCards as RawCard[]).map((c) => ({
      ...c,
      ...loadLocalProgress(c.id),
    }));
    merged.sort((a, b) => new Date(a.proxima_revisao).getTime() - new Date(b.proxima_revisao).getTime());
    merged = merged.slice(0, CARDS_PER_SESSION);

    setCards(merged);
    setPhase("treino");
  }

  // ── Open effect ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setCardIndex(0);
    setInputValue("");
    setCardResult("idle");
    setLives(INITIAL_LIVES);
    setFadeIn(true);
    setXpEarned(0);
    sessionAcertos.current = 0;
    sessionErros.current   = 0;
    setGam(typeof window !== "undefined" ? loadGam() : { xp: 0, level: 1, days: [] });
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, topicLabel]);

  useEffect(() => {
    if (phase === "treino" && cardResult === "idle") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [phase, cardIndex, cardResult]);

  useEffect(() => {
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, []);

  // ── Answer logic ──────────────────────────────────────────────────────────

  function verify() {
    if (cardResult !== "idle" || !inputValue.trim()) return;
    const card = cards[cardIndex];
    if (isCloseEnough(inputValue, card.resposta)) {
      handleCorrect(card);
    } else {
      handleWrong(card);
    }
  }

  function handleCorrect(card: TrainingCard) {
    const newIntervalo = Math.min(card.intervalo + 1, 5);
    const proxima = new Date(Date.now() + getIntervalMinutes(newIntervalo) * 60_000).toISOString();
    const newProg: LocalProgress = {
      acertos: card.acertos + 1, erros: card.erros,
      intervalo: newIntervalo, proxima_revisao: proxima,
    };
    saveLocalProgress(card.id, newProg);
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, ...newProg } : c)));

    sessionAcertos.current++;
    const newGam = addXpLocal(XP_PER_ACERTO);
    setXpEarned((prev) => prev + XP_PER_ACERTO);
    setGam(newGam);
    setCardResult("correct");

    advanceTimer.current = setTimeout(transitionToNext, AUTO_ADVANCE_MS);
  }

  function handleWrong(card: TrainingCard) {
    const newLives = lives - 1;
    setLives(newLives);
    setCardResult("wrong");
    const newProg: LocalProgress = {
      acertos: card.acertos, erros: card.erros + 1, intervalo: 0,
      proxima_revisao: new Date(Date.now() + 10 * 60_000).toISOString(),
    };
    saveLocalProgress(card.id, newProg);
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, ...newProg } : c)));
    sessionErros.current++;
    const newGam = addXpLocal(1);
    setXpEarned((prev) => prev + 1);
    setGam(newGam);
  }

  function continueAfterWrong() {
    if (lives <= 0) { finishSession(); return; }
    transitionToNext();
  }

  function transitionToNext() {
    setFadeIn(false);
    setTimeout(() => {
      if (cardIndex < cards.length - 1) {
        setCardIndex((i) => i + 1);
        setInputValue("");
        setCardResult("idle");
        setFadeIn(true);
      } else {
        finishSession();
      }
    }, 200);
  }

  function finishSession() {
    const acertos = sessionAcertos.current;
    const total   = cards.length;

    if (acertos === total && total > 0) {
      const newGam = addXpLocal(XP_PERFECT_BONUS);
      setXpEarned((prev) => prev + XP_PERFECT_BONUS);
      setGam(newGam);
    }

    try {
      const treinoKey = `sefaz_treino_${topicLabel}`;
      const prev = localStorage.getItem(treinoKey);
      const prevData = prev
        ? (JSON.parse(prev) as { acertos: number; sessoes: number })
        : { acertos: 0, sessoes: 0 };
      localStorage.setItem(treinoKey, JSON.stringify({
        acertos: prevData.acertos + acertos,
        sessoes: prevData.sessoes + 1,
      }));
    } catch { /* ignore */ }

    onFinish?.();
    setFadeIn(true);
    setPhase("resultado");
  }

  function restart() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setCardIndex(0);
    setInputValue("");
    setCardResult("idle");
    setLives(INITIAL_LIVES);
    setFadeIn(true);
    setXpEarned(0);
    sessionAcertos.current = 0;
    sessionErros.current   = 0;
    setPhase("treino");
  }

  if (!open) return null;

  const currentCard = cards[cardIndex];
  const totalCards  = cards.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (advanceTimer.current) clearTimeout(advanceTimer.current);
          onClose?.();
        }}
      />

      <div className="relative w-full max-w-2xl mx-0 sm:mx-4 bg-bg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* LOADING */}
        {phase === "loading" && (
          <div className="flex flex-col items-center justify-center p-16 gap-4">
            <div className="w-8 h-8 border-2 border-warn border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted">Preparando seu treino...</p>
          </div>
        )}

        {/* VAZIO */}
        {phase === "vazio" && (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
            <span className="text-5xl">🏗️</span>
            <p className="text-base font-semibold text-text">Treino chegando em breve!</p>
            <p className="text-xs text-muted max-w-xs">
              Este tópico ainda não tem cards de treino.
            </p>
            <button
              className="mt-2 px-5 py-2.5 border border-border rounded-xl text-sm text-text hover:bg-surface2 transition-colors"
              onClick={() => onClose?.()}
            >
              Fechar
            </button>
          </div>
        )}

        {/* TREINO */}
        {phase === "treino" && currentCard && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <button
                className="text-sm text-muted hover:text-text leading-none w-8"
                onClick={() => {
                  if (advanceTimer.current) clearTimeout(advanceTimer.current);
                  onClose?.();
                }}
                aria-label="Fechar"
              >
                ✕
              </button>

              <div className="flex gap-1.5">
                {Array.from({ length: totalCards }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      i < cardIndex
                        ? "bg-accent"
                        : i === cardIndex
                        ? "bg-warn scale-110"
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-0.5 w-16 justify-end">
                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                  <span key={i} className="text-base leading-none select-none">
                    {i < lives ? "❤️" : "🖤"}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="overflow-y-auto flex-1 px-5 py-6 space-y-5"
              style={{ opacity: fadeIn ? 1 : 0, transition: "opacity 0.2s ease" }}
            >
              <p className="text-xs text-muted font-mono tracking-wide truncate">{topicLabel}</p>

              <div
                className={`px-4 py-5 rounded-xl border transition-colors duration-300 ${
                  cardResult === "correct"
                    ? "bg-accent/10 border-accent/40"
                    : cardResult === "wrong"
                    ? "bg-danger/10 border-danger/40"
                    : "bg-surface border-border"
                }`}
                style={cardResult === "correct" ? { animation: "tc-pulse 0.4s ease-out" } : undefined}
              >
                <p className="text-sm text-text leading-relaxed">
                  {currentCard.enunciado.split("___").map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span
                          className={`inline-block min-w-[80px] border-b-2 mx-1 px-1 text-center font-semibold align-bottom transition-colors ${
                            cardResult === "correct"
                              ? "border-accent text-accent"
                              : cardResult === "wrong"
                              ? "border-danger text-danger"
                              : "border-warn text-transparent"
                          }`}
                        >
                          {cardResult !== "idle" ? currentCard.resposta : "       "}
                        </span>
                      )}
                    </span>
                  ))}
                </p>
              </div>

              {cardResult === "correct" && (
                <div className="flex items-center justify-center py-1">
                  <p className="text-xl font-bold text-accent">Correto! +{XP_PER_ACERTO} XP</p>
                </div>
              )}

              {cardResult === "wrong" && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-danger text-center">
                    Quase! A resposta é:{" "}
                    <span className="text-text">{currentCard.resposta}</span>
                  </p>
                  {currentCard.dica && (
                    <div className="px-3 py-2.5 bg-surface border border-border rounded-xl">
                      <p className="text-xs text-muted">
                        <span className="font-semibold text-warn">💡 Dica: </span>
                        {currentCard.dica}
                      </p>
                    </div>
                  )}
                  <button
                    className="w-full py-3 border border-border hover:bg-surface2 text-text font-semibold rounded-xl transition-all text-sm"
                    onClick={continueAfterWrong}
                  >
                    {lives <= 0 ? "Ver resultado →" : "Entendido →"}
                  </button>
                </div>
              )}

              {cardResult === "idle" && (
                <div className="space-y-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") verify(); }}
                    placeholder="Digite a resposta..."
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-muted focus:outline-none focus:border-warn transition-colors"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    className="w-full py-3 bg-warn hover:bg-warn/90 active:scale-[0.98] text-black font-bold rounded-xl transition-all text-sm tracking-wide disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={verify}
                    disabled={!inputValue.trim()}
                  >
                    CONFIRMAR
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* RESULTADO */}
        {phase === "resultado" && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <span className="text-xs font-mono font-semibold text-text tracking-wide">
                Resultado do treino
              </span>
              <button
                className="text-sm text-muted hover:text-text leading-none"
                onClick={() => onClose?.()}
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-8 flex flex-col items-center gap-5 text-center">
              <span className="text-6xl select-none">
                {getResultEmoji(sessionAcertos.current, cards.length)}
              </span>
              <p className="text-xl font-bold text-text leading-snug max-w-xs">
                {getResultMessage(sessionAcertos.current, cards.length)}
              </p>

              <div className="w-full space-y-2">
                <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl text-sm">
                  <span className="text-accent font-bold text-base">✓</span>
                  <span className="text-text">
                    {sessionAcertos.current} acerto{sessionAcertos.current !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl text-sm">
                  <span className="text-danger font-bold text-base">✗</span>
                  <span className="text-text">
                    {sessionErros.current} erro{sessionErros.current !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl text-sm">
                  <span className="text-warn text-base">⚡</span>
                  <span className="text-text font-bold">+{xpEarned} XP ganhos</span>
                </div>
              </div>

              <p className="text-xs text-muted">Nível {gam.level} · {gam.xp} XP total</p>
            </div>

            <div className="px-5 py-4 border-t border-border flex-shrink-0 flex flex-col gap-2">
              <button
                className="w-full py-3 bg-warn hover:bg-warn/90 active:scale-[0.98] text-black font-bold rounded-xl transition-all text-sm tracking-wide"
                onClick={restart}
              >
                TREINAR DE NOVO
              </button>
              <button
                className="w-full py-3 border border-border text-text hover:bg-surface2 rounded-xl transition-colors text-sm"
                onClick={() => onClose?.()}
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes tc-pulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.025); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
