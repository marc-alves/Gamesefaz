export interface HeaderProps {
  dominados: number;
  total: number;
  percentage: number;
}

export default function Header({ dominados, total, percentage }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-bg/95 border-b border-border backdrop-blur-xl py-3 px-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm font-medium text-accent">
          SEFAZ·CE · B02 TI
        </span>
        <div className="flex gap-3">
          <span className="font-mono text-xs text-muted">
            <span className="text-text font-medium">{dominados}</span> dom.
          </span>
          <span className="font-mono text-xs text-muted">
            <span className="text-text font-medium">{total}</span> tópicos
          </span>
          <span className="font-mono text-xs text-muted">
            <span className="text-text font-medium">{percentage}</span>%
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-border2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-400 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="font-mono text-xs text-accent min-w-max">{percentage}%</span>
      </div>
    </header>
  );
}
