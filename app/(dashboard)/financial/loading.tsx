export default function FinancialLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Cinematic header */}
      <div className="h-28 rounded-2xl bg-surface-2" />
      {/* Section nav */}
      <div className="h-10 rounded-xl bg-surface-2" />
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-surface-2" />
        ))}
      </div>
      {/* Break-even bar */}
      <div className="h-20 rounded-2xl bg-surface-2" />
      {/* Section cards */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-64 rounded-2xl bg-surface-2" />
      ))}
    </div>
  );
}
