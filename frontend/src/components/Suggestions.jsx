import { money } from "../services/format.js";

export default function Suggestions({ items }) {
  return (
    <section className="card" aria-labelledby="sug-h">
      <h2 id="sug-h">Optimization suggestions</h2>
      <p className="muted">Based on the latest 3 months of data; savings are estimated per month.</p>
      {items.length === 0 && <p>No suggestions for the current filters.</p>}
      <ul className="sug-list">
        {items.map((s) => (
          <li key={s.id} className="sug">
            <div className="row-between">
              <h3>{s.title}</h3>
              <span className={`badge p-${s.priority}`}>{s.priority} priority</span>
            </div>
            <p>{s.description}</p>
            <p className="muted">
              Affects {money(s.monthly_cost_affected)}/mo across {s.top_projects.join(", ")} · <strong className="save">Save ~{money(s.estimated_monthly_savings)}/mo</strong>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
