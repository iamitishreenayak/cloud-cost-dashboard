import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { money, monthLabel } from "../services/format.js";
import StatCard from "../components/StatCard.jsx";
import FilterBar from "../components/FilterBar.jsx";
import { BreakdownChart, TrendChart } from "../components/Charts.jsx";
import BudgetPanel from "../components/BudgetPanel.jsx";
import Suggestions from "../components/Suggestions.jsx";
import CostTable from "../components/CostTable.jsx";

const EMPTY = { start_date: "", end_date: "", service: "", project: "", team: "" };

export default function Dashboard() {
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState(EMPTY);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const retry = () => setReloadToken((k) => k + 1);

  useEffect(() => {
    api.options().then(setOptions).catch((e) => setError(e.message));
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.summary(filters), api.monthly(filters), api.breakdown("service", filters),
      api.breakdown("project", filters), api.breakdown("team", filters), api.suggestions(filters),
    ])
      .then(([summary, monthly, service, project, team, suggestions]) => {
        if (cancelled) return;
        setData({ summary, monthly, service, project, team, suggestions });
        setError("");
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filters, reloadToken]);

  const s = data?.summary;
  const mom = s?.month_over_month_pct;
  const usedPct = s && s.monthly_budget > 0 ? (s.current_month_spend / s.monthly_budget) * 100 : 0;

  return (
    <div className="page">
      <FilterBar options={options} filters={filters} onChange={setFilters} onReset={() => setFilters(EMPTY)} />
      {error && (
        <div className="error row-between" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-secondary" onClick={retry}>Retry</button>
        </div>
      )}
      {loading && !data && (
        <div className="card" role="status" style={{ textAlign: "center", padding: "2rem" }}>
          <p className="muted" style={{ margin: 0, fontSize: "1.1rem" }}>Loading dashboard metrics…</p>
        </div>
      )}
      {data && (
        <div className={loading ? "dim" : ""} aria-busy={loading}>
          <div className="grid stats">
            <StatCard label="Total spend (selected range)" value={money(s.total_spend)} />
            <StatCard label={`Spend in ${monthLabel(s.current_month)}`} value={money(s.current_month_spend)}
              note={mom == null ? "" : `${mom > 0 ? "▲" : "▼"} ${Math.abs(mom)}% vs previous month`} tone={mom > 0 ? "warn" : "good"} />
            <StatCard label="Monthly budget (all teams)" value={money(s.monthly_budget)}
              note={`${usedPct.toFixed(0)}% used by current selection`} />
            <StatCard label="Potential savings / month" value={money(s.potential_monthly_savings)} tone="good" note="From optimization suggestions" />
          </div>
          <div className="grid two"><BudgetPanel /><Suggestions items={data.suggestions} /></div>
          <TrendChart data={data.monthly} />
          <div className="grid three">
            <BreakdownChart title="Spend by service" data={data.service} variant="pie" />
            <BreakdownChart title="Spend by project" data={data.project} />
            <BreakdownChart title="Spend by team" data={data.team} />
          </div>
          <CostTable filters={filters} teams={options?.team} />
        </div>
      )}
    </div>
  );
}
