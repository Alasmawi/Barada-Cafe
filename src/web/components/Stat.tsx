export function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="note">{label}</span>
    </div>
  );
}
