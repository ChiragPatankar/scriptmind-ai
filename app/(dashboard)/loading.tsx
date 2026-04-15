export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-24 rounded-2xl bg-surface-2" />
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-surface-2" />
        ))}
      </div>
      {/* Content blocks */}
      <div className="h-64 rounded-2xl bg-surface-2" />
      <div className="h-48 rounded-2xl bg-surface-2" />
    </div>
  );
}
