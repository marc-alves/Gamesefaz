"use client";

import { useEffect, useState } from "react";

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

const GAM_KEY = "sefaz_gam";

function loadGam() {
  try {
    const s = localStorage.getItem(GAM_KEY);
    if (!s) return { xp: 0, level: 1, days: [] as string[] };
    return JSON.parse(s);
  } catch (e) {
    return { xp: 0, level: 1, days: [] as string[] };
  }
}

function saveGam(g: any) {
  try {
    localStorage.setItem(GAM_KEY, JSON.stringify(g));
  } catch (e) {}
}

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

  const [gam, setGam] = useState(() => (typeof window !== "undefined" ? loadGam() : { xp: 0, level: 1, days: [] }));
  const [status, setStatus] = useState<string>("none");

  useEffect(() => {
    if (!open) return;
    try {
      const s = localStorage.getItem(topicKey);
      if (s) {
        const obj = JSON.parse(s);
        setStatus(obj.status || "none");
      } else {
        setStatus("none");
      }
      setGam(loadGam());
    } catch (e) {
      setStatus("none");
    }
  }, [open, topicKey]);

  function awardXp(amount: number) {
    const g = loadGam();
    g.xp = (g.xp || 0) + amount;
    g.level = Math.floor((g.xp || 0) / 100) + 1;
    saveGam(g);
    setGam(g);
  }

  function finish(dominar: boolean) {
    const newStatus = dominar ? "dominado" : "revisando";
    try {
      localStorage.setItem(topicKey, JSON.stringify({ status: newStatus, updated: Date.now() }));
    } catch (e) {}
    awardXp(dominar ? 10 : 3);
    onFinish && onFinish();
    onClose && onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose && onClose()} />

      <div className="relative w-full max-w-xl mx-4 bg-white dark:bg-bg rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-start justify-between">
          <div>
            <div className="text-sm font-medium">{sectionName || topicLabel}</div>
            <div className="text-xs text-muted mt-1">{topicLabel}</div>
          </div>
          <div className="text-right text-xs text-muted">
            XP: <span className="font-mono text-text">{gam.xp}</span> · Lv <span className="font-mono">{gam.level}</span>
          </div>
        </div>

        <div className="p-4 space-y-3 text-sm">
          <p>
            Aqui você pode revisar a teoria e praticar. Este componente é uma versão
            leve do motor de lições: marca status e concede XP localmente.
          </p>

          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-accent text-white rounded"
              onClick={() => finish(true)}
            >
              Marcar como dominado (+10 XP)
            </button>

            <button
              className="px-3 py-1 border border-border rounded text-text"
              onClick={() => finish(false)}
            >
              Marcar como revisando (+3 XP)
            </button>

            <button
              className="ml-auto px-3 py-1 text-sm text-muted"
              onClick={() => onClose && onClose()}
            >
              Fechar
            </button>
          </div>

          <div className="pt-2 border-t border-border text-xs text-muted">
            Estado atual: <span className="font-mono">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
