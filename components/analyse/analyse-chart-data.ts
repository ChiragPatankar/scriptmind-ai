export function recordsToPieData(record: Record<string, number>) {
  return Object.entries(record).map(([name, value]) => ({ name, value }));
}

export function buildEmotionalArcRows(
  arcs: Record<string, number[]>,
  actLabels: string[]
) {
  return actLabels.map((label, i) => {
    const row: Record<string, string | number> = { beat: label };
    for (const [k, vals] of Object.entries(arcs)) {
      row[k] = vals[i] ?? 0;
    }
    return row;
  });
}
