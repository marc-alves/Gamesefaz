'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { PROVAS_MOCK } from '@/data/provas.mock';
import LessonModal from '@/components/lesson/LessonModal';
import { createClient } from '@/lib/supabase/client';

const CONTENT_MODE_KEY = 'sefaz_content_mode';

export default function TrackerPage() {
  const [currentProvaId, setCurrentProvaId] = useState('gerais');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<{
    provaId: string;
    sectionIndex: number;
    topicIndex: number;
    topicLabel: string;
    sectionName?: string;
  } | null>(null);

  const currentProva = PROVAS_MOCK.find((p) => p.id === currentProvaId);

  const totalTopics = PROVAS_MOCK.reduce(
    (sum, p) => sum + p.sections.reduce((s, sec) => s + sec.topics.length, 0),
    0
  );

  const [dominados, setDominados] = useState(0);

  // ── Modo Conteúdo ──────────────────────────────────────────────────────────
  const [contentMode, setContentMode] = useState(false);
  // Map: nome do tópico → has_baked_content
  const [contentMap, setContentMap] = useState<Map<string, boolean>>(new Map());

  function toggleContentMode() {
    setContentMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(CONTENT_MODE_KEY, next ? '1' : '0');
      } catch { /* ignore */ }
      return next;
    });
  }

  // Conta tópicos do mock que têm conteúdo no banco
  const contentCount = PROVAS_MOCK.reduce(
    (sum, p) =>
      sum +
      p.sections.reduce(
        (s, sec) => s + sec.topics.filter((t) => contentMap.get(t) === true).length,
        0
      ),
    0
  );

  // ── Inicialização ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Restaura modo conteúdo do localStorage
    try {
      setContentMode(localStorage.getItem(CONTENT_MODE_KEY) === '1');
    } catch { /* ignore */ }

    countDominados();
    void fetchContentMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function countDominados() {
    let c = 0;
    try {
      PROVAS_MOCK.forEach((p) => {
        p.sections.forEach((sec, si) => {
          sec.topics.forEach((_, ti) => {
            const key = `sefaz_${p.id}_${si}_${ti}`;
            const s = localStorage.getItem(key);
            if (s) {
              try {
                const obj = JSON.parse(s) as { status: string };
                if (obj.status === 'dominado') c++;
              } catch { /* ignore */ }
            }
          });
        });
      });
    } catch { /* ignore */ }
    setDominados(c);
  }

  async function fetchContentMap() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('topics')
        .select('name, has_baked_content');
      if (error || !data) return;
      const map = new Map<string, boolean>();
      (data as { name: string; has_baked_content: boolean }[]).forEach((t) => {
        map.set(t.name, t.has_baked_content);
      });
      setContentMap(map);
    } catch { /* ignore — modo conteúdo fica sem dados */ }
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────

  function openQuiz(
    provaId: string,
    sectionIndex: number,
    topicIndex: number,
    topicLabel: string,
    sectionName?: string
  ) {
    setSelected({ provaId, sectionIndex, topicIndex, topicLabel, sectionName });
    setModalOpen(true);
  }

  // ── Estilos do Modo Conteúdo ───────────────────────────────────────────────

  function getTopicRowStyle(topicName: string): React.CSSProperties {
    if (!contentMode) return {};
    const hasBaked = contentMap.get(topicName);
    if (hasBaked === true) {
      return {
        backgroundColor: 'var(--color-gov-green-dim)',
        borderColor: 'rgba(0, 208, 0, 0.2)',
      };
    }
    return {
      backgroundColor: 'var(--color-gov-yellow-dim)',
      borderColor: 'rgba(255, 208, 0, 0.2)',
    };
  }

  function getTopicTextStyle(topicName: string): React.CSSProperties {
    if (!contentMode) return {};
    const hasBaked = contentMap.get(topicName);
    if (hasBaked === true) {
      return { color: 'var(--color-gov-green)' };
    }
    return { color: 'var(--color-gov-yellow-dark)' };
  }

  function getTopicDotStyle(topicName: string): React.CSSProperties {
    if (!contentMode) return {};
    const hasBaked = contentMap.get(topicName);
    if (hasBaked === true) {
      return { backgroundColor: 'var(--color-gov-green)', borderColor: 'var(--color-gov-green)' };
    }
    return { backgroundColor: 'var(--color-gov-yellow)', borderColor: 'var(--color-gov-yellow)' };
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-bg pb-20">
      <Header
        dominados={dominados}
        total={totalTopics}
        percentage={Math.round((dominados / totalTopics) * 100)}
        contentMode={contentMode}
        onToggleContentMode={toggleContentMode}
        contentCount={contentCount}
        contentTotal={totalTopics}
      />

      <div className="flex gap-0 overflow-x-auto border-b border-border bg-surface scrollbar-hide">
        {PROVAS_MOCK.map((prova) => (
          <button
            key={prova.id}
            onClick={() => setCurrentProvaId(prova.id)}
            className={`flex-shrink-0 px-4 py-2.5 font-mono text-xs border-b-2 transition-colors whitespace-nowrap ${
              currentProva?.id === prova.id
                ? 'text-accent border-b-accent'
                : 'text-muted border-b-transparent hover:text-text'
            }`}
          >
            {prova.label}
            <span className="text-xs text-muted ml-1 opacity-70">0%</span>
          </button>
        ))}
      </div>

      <div className="px-4 py-3 bg-surface border-b border-border flex gap-3 text-xs text-muted flex-wrap">
        {contentMode ? (
          <>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-gov-green)' }} />
              lição criada
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-gov-yellow)' }} />
              sem conteúdo
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 border border-muted rounded-full"></span>
              não estudado
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue rounded-full"></span>
              tenho material
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-warn rounded-full"></span>
              revisando
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              dominado
            </span>
          </>
        )}
      </div>

      <div className="px-4 py-4">
        {currentProva?.sections.map((section, si) => (
          <div key={si} className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-t-lg cursor-pointer hover:bg-surface2">
              <span className="text-xs font-medium text-text flex-1">{section.name}</span>
              <div className="w-16 h-1 bg-border2 rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: '0%' }}></div>
              </div>
              <span className="font-mono text-xs text-muted">0/{section.topics.length}</span>
              <span className="text-xs text-muted">›</span>
            </div>
            <div className="px-3 py-2 bg-surface border border-t-0 border-border rounded-b-lg border-b">
              {section.topics.map((topic, ti) => (
                <div
                  key={ti}
                  className="flex items-center gap-2 py-2 px-1 rounded cursor-pointer border-b border-border last:border-b-0 transition-colors"
                  style={getTopicRowStyle(topic)}
                >
                  <span
                    className="w-2 h-2 border border-muted rounded-full flex-shrink-0 transition-colors"
                    style={getTopicDotStyle(topic)}
                  />
                  <span
                    className="flex-1 text-xs text-text transition-colors"
                    style={getTopicTextStyle(topic)}
                  >
                    {topic}
                  </span>
                  <button
                    className="text-xs px-2 py-1 border border-border2 rounded text-muted hover:text-purple hover:border-purple hover:bg-purple-dim transition-all"
                    onClick={() => openQuiz(currentProva.id, si, ti, topic, section.name)}
                  >
                    quiz
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />

      {selected && (
        <LessonModal
          open={modalOpen}
          provaId={selected.provaId}
          sectionIndex={selected.sectionIndex}
          topicIndex={selected.topicIndex}
          topicLabel={selected.topicLabel}
          sectionName={selected.sectionName}
          onClose={() => setModalOpen(false)}
          onFinish={() => countDominados()}
        />
      )}
    </div>
  );
}
