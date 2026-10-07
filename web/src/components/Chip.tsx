export function Chip({ d, raw }: { d: string; raw: string }) {
  const cls = d === "FOR" ? "for" : d === "AGAINST" ? "against"
    : d === "ABSTAIN" || d === "WITHHOLD" ? "abstain" : "dim";
  return <span className={`chip ${cls}`} title={raw}>{d}</span>;
}
