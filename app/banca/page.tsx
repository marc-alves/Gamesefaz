'use client';

import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { PROVAS_MOCK } from '@/data/provas.mock';

export default function BancaPage() {
  const totalTopics = PROVAS_MOCK.reduce((sum, p) => sum + p.sections.reduce((s, sec) => s + sec.topics.length, 0), 0);
  const dominados = 5;

  const bancaInfo = [
    {
      title: 'Padrão FCC — como cobra TI',
      items: [
        { label: 'SQL prático', status: 'alto risco', color: 'warn' },
        { label: 'BPMN + ITIL integrado', status: 'alto risco', color: 'warn' },
        { label: 'Zero Trust + IAM fazendário', status: 'alto risco', color: 'warn' },
        { label: 'CRISP-DM por fase', status: 'alto risco', color: 'warn' },
        { label: 'PMBOK — Valor Agregado (EVM)', status: 'alto risco', color: 'warn' },
        { label: 'Tipos de ataques + OWASP', status: 'médio', color: 'blue' },
        { label: 'Data Lake vs. Warehouse', status: 'médio', color: 'blue' },
        { label: 'LGPD + sigilo fiscal CTN 198', status: 'médio', color: 'blue' },
      ],
    },
    {
      title: 'Discursiva — prováveis temas',
      items: [
        { label: 'BPMN + ITIL (incidente/mudança)', status: '✓ prioritário', color: 'accent' },
        { label: 'SQL Oracle + administração', status: '✓ prioritário', color: 'accent' },
        { label: 'Zero Trust em dados fiscais', status: '✓ prioritário', color: 'accent' },
        { label: 'Data Lake + LGPD + ICMS', status: '✓ prioritário', color: 'accent' },
        { label: 'EVM: VPR, VC, IDA, IDC', status: 'secundário', color: 'blue' },
        { label: 'DevSecOps + CI/CD', status: 'secundário', color: 'blue' },
      ],
    },
    {
      title: 'Regras da discursiva',
      items: [
        { label: 'Mínimo para habilitação', status: '50 pts', color: 'text' },
        { label: 'Questão dissertativa', status: '30 pts · mín. 15 linhas', color: 'text' },
        { label: 'Cada estudo de caso', status: '35 pts · mín. 20 linhas', color: 'text' },
        { label: 'Identificação fora da capa', status: 'zera a prova', color: 'danger' },
        { label: 'Lápis/lapiseira no definitivo', status: 'zera a prova', color: 'danger' },
        { label: 'Correção por', status: 'checklist de conceitos', color: 'text' },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg pb-20">
      <Header dominados={dominados} total={totalTopics} percentage={Math.round((dominados / totalTopics) * 100)} />

      <div className="px-4 py-4 space-y-4">
        {bancaInfo.map((section, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4">
            <h3 className="font-mono text-xs text-muted uppercase tracking-widest mb-3">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, j) => (
                <div key={j} className="flex justify-between items-center py-1 text-xs border-b border-border last:border-b-0">
                  <span className="text-muted">{item.label}</span>
                  <span
                    className={`font-mono ${
                      item.color === 'warn'
                        ? 'text-warn'
                        : item.color === 'blue'
                          ? 'text-blue'
                          : item.color === 'accent'
                            ? 'text-accent'
                            : item.color === 'danger'
                              ? 'text-danger'
                              : 'text-text'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
