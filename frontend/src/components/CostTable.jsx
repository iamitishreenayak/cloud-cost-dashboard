import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { money2 } from "../services/format.js";

const COLS = [
  ["date", "Date"], ["service", "Service"], ["project", "Project"], ["team", "Team"],
  ["environment", "Env"], ["pricing", "Pricing"], ["utilization", "Util %"], ["cost", "Cost"],
];

export default function CostTable({ filters, teams = [] }) {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState(filters?.team || "");
  const [sortBy, setSortBy] = useState("date");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync with global team filter changes
  useEffect(() => {
    setTeam(filters?.team || "");
  }, [filters?.team]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [filters, team]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const activeTeam = team || filters?.team || undefined;
    api.costs({ ...filters, team: activeTeam, q: search, sort_by: sortBy, order, page, page_size: 15 })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filters, team, search, sortBy, order, page]);

  const sort = (key) => {
    if (key === sortBy) setOrder(order === "asc" ? "desc" : "asc");
    else { setSortBy(key); setOrder("asc"); }
    setPage(1);
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <section className="card" aria-labelledby="tbl-h">
      <div className="row-between">
        <h2 id="tbl-h">Cost records</h2>
        {loading && <span className="muted" role="status">Updating records…</span>}
      </div>
      <div className="filters inline">
        <div className="field">
          <label htmlFor="t-search">Search</label>
          <input id="t-search" type="search" placeholder="Service, project, team, id…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="t-team">Team</label>
          <select id="t-team" value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">All teams</option>
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        {data && <p className="muted" aria-live="polite">{data.total} records · {money2(data.total_cost)}</p>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Cost records, sortable by column</caption>
          <thead>
            <tr>
              {COLS.map(([key, label]) => (
                <th key={key} scope="col" aria-sort={sortBy === key ? (order === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" className="sort" onClick={() => sort(key)}>
                    {label}{sortBy === key ? (order === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.items.map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td><td>{r.service}</td><td>{r.project}</td><td>{r.team}</td>
                <td>{r.environment}</td><td>{r.pricing}</td><td className="num">{r.utilization}</td><td className="num">{money2(r.cost)}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && <tr><td colSpan={COLS.length}>No matching records.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button type="button" className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button type="button" className="btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </section>
  );
}
