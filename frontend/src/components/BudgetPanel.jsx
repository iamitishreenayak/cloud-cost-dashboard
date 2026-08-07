import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { money, monthLabel } from "../services/format.js";

const LABEL = { ok: "On track", warning: "Warning", critical: "Critical", exceeded: "Over budget" };

function Bar({ row }) {
  const pct = Math.min(row.percent_used, 100);
  return (
    <div className="budget-row">
      <div className="budget-head">
        <strong>{row.scope}</strong>
        <span>{money(row.spent)} / {money(row.budget)} · {row.percent_used}% <span className={`badge b-${row.status}`}>{LABEL[row.status]}</span></span>
      </div>
      <div className="track" role="progressbar" aria-label={`${row.scope} budget used`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className={`fill f-${row.status}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BudgetPanel() {
  const [th, setTh] = useState(null); // {warning, critical}; null until server defaults arrive
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch initial budget or updated thresholds with debounce
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (th && (Number(th.warning) >= Number(th.critical) || !th.warning || !th.critical)) {
        setError("Warning threshold must be lower than critical threshold.");
        return;
      }
      setLoading(true);
      api.budget(th ? { warning: Number(th.warning), critical: Number(th.critical) } : {})
        .then((b) => {
          if (cancelled) return;
          setData(b);
          setError("");
          if (!th) setTh(b.thresholds);
        })
        .catch((e) => !cancelled && setError(e.message))
        .finally(() => !cancelled && setLoading(false));
    }, th ? 400 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [th]);

  const edit = (key) => (e) => {
    setError("");
    setTh((prev) => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <section className="card" aria-labelledby="budget-h">
      <div className="row-between">
        <h2 id="budget-h">Budget status{data ? ` — ${monthLabel(data.month)}` : ""}</h2>
        {th && (
          <div className="thresholds">
            <div className="field">
              <label htmlFor="t-warn">Warning at (%)</label>
              <input id="t-warn" type="number" min="1" max="100" value={th.warning} onChange={edit("warning")} />
            </div>
            <div className="field">
              <label htmlFor="t-crit">Critical at (%)</label>
              <input id="t-crit" type="number" min="1" max="100" value={th.critical} onChange={edit("critical")} />
            </div>
          </div>
        )}
      </div>
      {loading && !data && <p className="muted" role="status">Loading budget details…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {data && (
        <>
          <div aria-live="polite" className="alerts">
            {data.alerts.length === 0 && <p className="alert a-ok">No budget alerts.</p>}
            {data.alerts.map((a) => <p key={a.scope} className={`alert a-${a.level}`}><strong>{LABEL[a.level]}:</strong> {a.message}</p>)}
          </div>
          <Bar row={data.overall} />
          {data.teams.map((t) => <Bar key={t.scope} row={t} />)}
        </>
      )}
    </section>
  );
}
