'use client';

import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { PROVAS_MOCK } from '@/data/provas.mock';

export default function StatsPage() {
  const totalTopics = PROVAS_MOCK.reduce((sum, p) => sum + p.sections.reduce((s, sec) => s + sec.topics.length, 0), 0);
  const dominados = 5;

  return (
    <div className="flex flex-col min-h-screen bg-bg pb-20">
      <Header dominados={dominados} total={totalTopics} percentage={Math.round((dominados / totalTopics) * 100)} />

      <div className="px-4 py-4 space-y-4">
        {PROVAS_MOCK.map((prova) => (
          <div key={prova.id} className="bg-surface border border-border rounded-lg p-4">
            <h3 className="font-mono text-xs text-muted uppercase tracking-widest mb-3">
              {prova.label} <span className="font-sans text-xs font-normal">{prova.badge}</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted">Dominados</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 bg-border2 rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: '0%' }}></div>
                  </div>
                  <span className="font-mono text-xs text-text">0/{prova.sections.reduce((s, sec) => s + sec.topics.length, 0)}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Tenho material</span>
                <span className="text-blue font-mono text-xs">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Revisando</span>
                <span className="text-warn font-mono text-xs">0</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
