"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Public props ───────────────────────────────────────────────────────────────

export interface LessonModalProps {
  open: boolean;
  provaId: string;
  sectionIndex: number;
  topicIndex: number;
  topicLabel: string;
  sectionName?: string;
  onClose?: () => void;
  onFinish?: () => void;
}

// ── Domain types ──────────────────────────────────────────────────────────────

interface ContentCard {
  id: string;
  sort_order: number;
  title: string;
  body_html: string;
  highlight: string | null;
}

interface Alternative {
  id: string;
  sort_order: number;
  text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  question_text: string;
  explanation_html: string;
  alternatives: Alternative[];
}

type Phase = "loading" | "error" | "empty" | "teoria" | "pratica" | "resultado";

// ── LocalStorage helpers ──────────────────────────────────────────────────────

const GAM_KEY = "sefaz_gam";

interface GamData {
  xp: number;
  level: number;
  days: string[];
}

function loadGam(): GamData {
  try {
    const s = localStorage.getItem(GAM_KEY);
    return s ? (JSON.parse(s) as GamData) : { xp: 0, level: 1, days: [] };
  } catch {
    return { xp: 0, level: 1, days: [] };
  }
}

function saveGam(g: GamData): void {
  try {
    localStorage.setItem(GAM_KEY, JSON.stringify(g));
  } catch { /* ignore */ }
}

function addXpLocal(amount: number): GamData {
  const g = loadGam();
  g.xp = (g.xp ?? 0) + amount;
  g.level = Math.floor(g.xp / 120) + 1;
  saveGam(g);
  return g;
}

// ── XP constants ───────────────────────────────────────────────────────────────

const XP_PER_CORRECT   = 10;
const XP_LESSON_BONUS  = 20;
const XP_PERFECT_BONUS = 15;
const INITIAL_LIVES    = 3;
const LETTERS          = ["A", "B", "C", "D"] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function LessonModal({
  open,
  provaId,
  sectionIndex,
  topicIndex,
  topicLabel,
  sectionName,
  onClose,
  onFinish,
}: LessonModalProps) {
  const topicKey = `sefaz_${provaId}_${sectionIndex}_${topicIndex}`;
  const supabase  = createClient();

  // ── Content state ────────────────────────────────────────────────────────────

  const [cards,     setCards]     = useState<ContentCard[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [phase,     setPhase]     = useState<Phase>("loading");

  // ── Navigation state ──────────────────────────────────────────────────────────

  const [cardIndex,     setCardIndex]     = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [lives,         setLives]         = useState(INITIAL_LIVES);
  const [selectedAlt,   setSelectedAlt]   = useState<number | null>(null);
  const [answered,      setAnswered]      = useState(false);

  // ── Result state ──────────────────────────────────────────────────────────────

  const [xpEarned, setXpEarned] = useState(0);
  const [gam,      setGam]      = useState<GamData>({ xp: 0, level: 1, days: [] });

  // Refs avoid stale-closure issues when finalising the session
  const answersRef        = useRef<boolean[]>([]);
  const startedAt         = useRef<string>("");
  const resolvedTopicId   = useRef<string | null>(null);

  // ── Supabase fetching ─────────────────────────────────────────────────────────

  async function fetchContent(topicId: string) {
    setPhase("loading");

    const [cardsRes, questionsRes] = await Promise.all([
      supabase
        .from("content_cards")
        .select("id, sort_order, title, body_html, highlight")
        .eq("topic_id", topicId)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("questions")
        .select(
          "id, question_text, explanation_html, question_alternatives(id, sort_order, text, is_correct)"
        )
        .eq("topic_id", topicId)
        .eq("is_active", true),
    ]);

    if (cardsRes.error || questionsRes.error) {
      setPhase("error");
      return;
    }

    const fetchedCards = (cardsRes.data ?? []) as ContentCard[];

    type RawQuestion = {
      id: string;
      question_text: string;
      explanation_html: string;
      question_alternatives: Alternative[];
    };

    const fetchedQuestions = ((questionsRes.data ?? []) as RawQuestion[]).map(
      (q): Question => ({
        id:               q.id,
        question_text:    q.question_text,
        explanation_html: q.explanation_html,
        alternatives:     [...(q.question_alternatives ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order
        ),
      })
    );

    if (fetchedCards.length === 0 && fetchedQuestions.length === 0) {
      setPhase("empty");
      return;
    }

    setCards(fetchedCards);
    setQuestions(fetchedQuestions);
    setPhase(fetchedCards.length > 0 ? "teoria" : "pratica");
  }

  async function resolveAndLoad() {
    setPhase("loading");

    const { data, error } = await supabase
      .from("topics")
      .select("id")
      .eq("name", topicLabel)
      .maybeSingle();

    if (error || !data) {
      setPhase("empty");
      return;
    }

    const topicId = (data as { id: string }).id;
    resolvedTopicId.current = topicId;
    await fetchContent(topicId);
  }

  // ── Mount / open effect ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    setCardIndex(0);
    setQuestionIndex(0);
    setLives(INITIAL_LIVES);
    setSelectedAlt(null);
    setAnswered(false);
    setXpEarned(0);
    answersRef.current  = [];
    startedAt.current   = new Date().toISOString();
    setGam(typeof window !== "undefined" ? loadGam() : { xp: 0, level: 1, days: [] });

    void resolveAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, topicLabel]);

  // ── Theory handlers ───────────────────────────────────────────────────────────

  function nextCard() {
    if (cardIndex < cards.length - 1) {
      setCardIndex((i) => i + 1);
    } else if (questions.length > 0) {
      setPhase("pratica");
    } else {
      finishLesson();
    }
  }

  // ── Practice handlers ─────────────────────────────────────────────────────────

  function selectAnswer(altIndex: number) {
    if (answered) return;
    setSelectedAlt(altIndex);
    setAnswered(true);
    const isCorrect = questions[questionIndex].alternatives[altIndex].is_correct;
    answersRef.current = [...answersRef.current, isCorrect];
    if (!isCorrect) setLives((l) => l - 1);
  }

  function nextQuestion() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1);
      setSelectedAlt(null);
      setAnswered(false);
    } else {
      finishLesson();
    }
  }

  // ── Finish & save ─────────────────────────────────────────────────────────────

  function finishLesson() {
    const correct   = answersRef.current.filter(Boolean).length;
    const total     = questions.length;
    const isPerfect = total > 0 && correct === total;
    const xp        =
      correct * XP_PER_CORRECT +
      XP_LESSON_BONUS +
      (isPerfect ? XP_PERFECT_BONUS : 0);

    setXpEarned(xp);
    const newGam = addXpLocal(xp);
    setGam(newGam);

    // Update topic status in localStorage
    try {
      const newStatus = isPerfect ? "dominado" : total > 0 ? "revisando" : null;
      if (newStatus) {
        const prev = localStorage.getItem(topicKey);
        const prevObj = prev ? (JSON.parse(prev) as { status: string }) : null;
        if (newStatus === "dominado" || !prevObj || prevObj.status !== "dominado") {
          localStorage.setItem(
            topicKey,
            JSON.stringify({ status: newStatus, updated: Date.now() })
          );
        }
      }
    } catch { /* ignore */ }

    // Best-effort Supabase persist (requires auth)
    void saveSession(correct, total, xp, isPerfect);

    onFinish?.();
    setPhase("resultado");
  }

  async function saveSession(
    correct:   number,
    total:     number,
    xp:        number,
    isPerfect: boolean
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !resolvedTopicId.current) return;

      const { data: platform } = await supabase
        .from("platforms")
        .select("id")
        .eq("slug", "sefaz_ce_b02")
        .maybeSingle();

      if (!platform) return;

      await supabase.from("study_sessions").insert({
        user_id:         user.id,
        topic_id:        resolvedTopicId.current,
        platform_id:     (platform as { id: string }).id,
        total_questions: total,
        correct_answers: correct,
        wrong_answers:   total - correct,
        xp_earned:       xp,
        xp_breakdown: {
          correct: correct * XP_PER_CORRECT,
          bonus:   XP_LESSON_BONUS,
          perfect: isPerfect ? XP_PERFECT_BONUS : 0,
        },
        started_at:   startedAt.current,
        completed_at: new Date().toISOString(),
      });
    } catch { /* best-effort */ }
  }

  // ── Restart ───────────────────────────────────────────────────────────────────

  function restart() {
    answersRef.current = [];
    startedAt.current  = new Date().toISOString();
    setCardIndex(0);
    setQuestionIndex(0);
    setLives(INITIAL_LIVES);
    setSelectedAlt(null);
    setAnswered(false);
    setXpEarned(0);
    setPhase(cards.length > 0 ? "teoria" : questions.length > 0 ? "pratica" : "empty");
  }

  // ── Progress bar ──────────────────────────────────────────────────────────────

  function progressPct(): number {
    const total = cards.length + questions.length;
    if (total === 0 || phase === "resultado") return 100;
    if (phase === "teoria")  return ((cardIndex + 1)                    / total) * 100;
    if (phase === "pratica") return ((cards.length + questionIndex + 1) / total) * 100;
    return 0;
  }

  // ── Render guard ──────────────────────────────────────────────────────────────

  if (!open) return null;

  const currentCard     = cards[cardIndex];
  const currentQuestion = questions[questionIndex];
  const correctCount    = answersRef.current.filter(Boolean).length;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onClose?.()}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl mx-0 sm:mx-4 bg-bg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* ── Progress bar ───────────────────────────────────────── */}
        <div className="h-1 bg-border w-full flex-shrink-0">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progressPct()}%` }}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════
            LOADING
        ══════════════════════════════════════════════════════════ */}
        {phase === "loading" && (
          <div className="flex flex-col items-center justify-center p-16 gap-4">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted">Carregando lição…</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ERROR
        ══════════════════════════════════════════════════════════ */}
        {phase === "error" && (
          <div className="flex flex-col items-center justify-center p-12 gap-4 text-center">
            <span className="text-5xl">⚠️</span>
            <p className="text-sm text-text">Não foi possível carregar o conteúdo.</p>
            <button
              className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium"
              onClick={() => void resolveAndLoad()}
            >
              Tentar novamente
            </button>
            <button
              className="text-xs text-muted hover:text-text"
              onClick={() => onClose?.()}
            >
              Fechar
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            EMPTY
        ══════════════════════════════════════════════════════════ */}
        {phase === "empty" && (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
            <span className="text-5xl">🚧</span>
            <p className="text-base font-semibold text-text">Conteúdo em breve</p>
            <p className="text-xs text-muted max-w-xs">
              Este tópico ainda não tem material cadastrado. Volte em breve!
            </p>
            <button
              className="mt-2 px-5 py-2.5 border border-border rounded-xl text-sm text-text hover:bg-surface2 transition-colors"
              onClick={() => onClose?.()}
            >
              Fechar
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TEORIA
        ══════════════════════════════════════════════════════════ */}
        {phase === "teoria" && currentCard && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <span className="text-xs font-mono text-accent font-semibold tracking-wide">
                📘 Teoria · {cardIndex + 1}/{cards.length}
              </span>
              <button
                className="text-sm text-muted hover:text-text leading-none"
                onClick={() => onClose?.()}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
              <h2 className="text-base font-semibold text-text leading-snug">
                {currentCard.title}
              </h2>
              <div
                className="text-sm text-text leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: currentCard.body_html }}
              />
              {currentCard.highlight && (
                <div className="px-4 py-3 bg-accent/10 border-l-4 border-accent rounded-r-xl">
                  <p className="text-xs font-semibold text-accent mb-1">→ Guarde isto</p>
                  <p className="text-sm text-text">{currentCard.highlight}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex-shrink-0">
              <button
                className="w-full py-3 bg-accent hover:bg-accent/90 active:scale-[0.98] text-white font-semibold rounded-xl transition-all text-sm"
                onClick={nextCard}
              >
                {cardIndex < cards.length - 1
                  ? "Continuar"
                  : questions.length > 0
                  ? "Praticar →"
                  : "Concluir →"}
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            PRÁTICA
        ══════════════════════════════════════════════════════════ */}
        {phase === "pratica" && currentQuestion && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <span className="text-xs font-mono font-semibold text-purple-400 tracking-wide">
                ✎ Prática · {questionIndex + 1}/{questions.length}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm leading-none select-none">
                  {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                    <span key={i}>{i < lives ? "❤️" : "🖤"}</span>
                  ))}
                </span>
                <button
                  className="text-sm text-muted hover:text-text leading-none"
                  onClick={() => onClose?.()}
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
              <p className="text-sm font-medium text-text leading-relaxed">
                {currentQuestion.question_text}
              </p>

              {/* Alternatives */}
              <div className="space-y-2">
                {currentQuestion.alternatives.map((alt, i) => {
                  let cls =
                    "w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all duration-150 ";

                  if (!answered) {
                    cls +=
                      "border-border text-text hover:border-accent hover:bg-accent/5 cursor-pointer active:scale-[0.99]";
                  } else if (alt.is_correct) {
                    cls += "border-green-500 bg-green-500/10 text-green-400 cursor-default";
                  } else if (i === selectedAlt) {
                    cls += "border-red-500 bg-red-500/10 text-red-400 cursor-default";
                  } else {
                    cls += "border-border text-muted opacity-40 cursor-default";
                  }

                  return (
                    <button
                      key={alt.id}
                      className={cls}
                      disabled={answered}
                      onClick={() => selectAnswer(i)}
                    >
                      <span className="font-mono font-bold flex-shrink-0 mt-0.5">
                        {LETTERS[i]}
                      </span>
                      <span>{alt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {answered && (
                <div className="px-4 py-3 bg-surface border border-border rounded-xl">
                  <p className="text-xs font-semibold text-muted mb-1.5">Explicação</p>
                  <div
                    className="text-sm text-text leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.explanation_html }}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex-shrink-0">
              {answered ? (
                <button
                  className="w-full py-3 bg-accent hover:bg-accent/90 active:scale-[0.98] text-white font-semibold rounded-xl transition-all text-sm"
                  onClick={nextQuestion}
                >
                  {questionIndex < questions.length - 1 ? "Próxima" : "Ver resultado →"}
                </button>
              ) : (
                <div className="h-11" />
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            RESULTADO
        ══════════════════════════════════════════════════════════ */}
        {phase === "resultado" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <span className="text-xs font-mono font-semibold text-text tracking-wide">
                Resultado
              </span>
              <button
                className="text-sm text-muted hover:text-text leading-none"
                onClick={() => onClose?.()}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-8 flex flex-col items-center gap-5 text-center">
              {/* Trophy emoji */}
              <span className="text-6xl select-none">
                {questions.length > 0 && correctCount === questions.length
                  ? "🏆"
                  : questions.length > 0 && correctCount > questions.length / 2
                  ? "⭐"
                  : "📚"}
              </span>

              {/* XP */}
              <div>
                <p className="text-4xl font-bold text-accent font-mono">+{xpEarned} XP</p>
                <p className="text-xs text-muted mt-1.5">
                  Nível {gam.level} · {gam.xp} XP total
                </p>
              </div>

              {/* Stats grid */}
              {questions.length > 0 && (
                <div className="w-full grid grid-cols-3 gap-3">
                  <div className="px-3 py-3 bg-surface border border-border rounded-xl">
                    <p className="text-2xl font-bold font-mono text-text">{correctCount}</p>
                    <p className="text-xs text-muted mt-0.5">acertos</p>
                  </div>
                  <div className="px-3 py-3 bg-surface border border-border rounded-xl">
                    <p className="text-2xl font-bold font-mono text-text">
                      {Math.round((correctCount / questions.length) * 100)}%
                    </p>
                    <p className="text-xs text-muted mt-0.5">aproveitamento</p>
                  </div>
                  <div className="px-3 py-3 bg-surface border border-border rounded-xl">
                    <p className="text-2xl font-bold font-mono text-text">{lives}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {lives === 1 ? "coração" : "corações"}
                    </p>
                  </div>
                </div>
              )}

              {/* XP breakdown */}
              <div className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-xs text-left space-y-1.5">
                {questions.length > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>
                      {correctCount} acerto{correctCount !== 1 ? "s" : ""} × {XP_PER_CORRECT} XP
                    </span>
                    <span className="font-mono text-text">+{correctCount * XP_PER_CORRECT}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>Bônus de conclusão</span>
                  <span className="font-mono text-text">+{XP_LESSON_BONUS}</span>
                </div>
                {questions.length > 0 && correctCount === questions.length && (
                  <div className="flex justify-between text-muted">
                    <span>Bônus gabarito perfeito 🎯</span>
                    <span className="font-mono text-text">+{XP_PERFECT_BONUS}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-1.5 font-semibold text-text">
                  <span>Total</span>
                  <span className="font-mono text-accent">+{xpEarned}</span>
                </div>
              </div>

              {/* Topic status badge */}
              {questions.length > 0 && (
                <p className="text-xs text-muted">
                  {correctCount === questions.length
                    ? "✅ Tópico marcado como dominado"
                    : "📝 Tópico marcado como revisando"}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex-shrink-0 flex gap-3">
              <button
                className="px-6 py-3 border border-border rounded-xl text-sm text-text hover:bg-surface2 transition-colors"
                onClick={restart}
              >
                Refazer
              </button>
              <button
                className="flex-1 py-3 bg-accent hover:bg-accent/90 active:scale-[0.98] text-white font-semibold rounded-xl transition-all text-sm"
                onClick={() => onClose?.()}
              >
                Concluir
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
