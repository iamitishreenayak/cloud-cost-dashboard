export default function StatCard({ label, value, note, tone = "neutral" }) {
  return (
    <div className={`card stat stat-${tone}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {note && <p className="stat-note">{note}</p>}
    </div>
  );
}
