export default function FilterBar({ options, filters, onChange, onReset }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  return (
    <section className="card filters" aria-label="Dashboard filters">
      <div className="field">
        <label htmlFor="f-start">Start date</label>
        <input id="f-start" type="date" value={filters.start_date} min={options?.min_date} max={options?.max_date} onChange={set("start_date")} />
      </div>
      <div className="field">
        <label htmlFor="f-end">End date</label>
        <input id="f-end" type="date" value={filters.end_date} min={options?.min_date} max={options?.max_date} onChange={set("end_date")} />
      </div>
      <div className="field">
        <label htmlFor="f-service">Service</label>
        <select id="f-service" value={filters.service} onChange={set("service")}>
          <option value="">All services</option>
          {options?.service.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-project">Project</label>
        <select id="f-project" value={filters.project} onChange={set("project")}>
          <option value="">All projects</option>
          {options?.project?.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-team">Team</label>
        <select id="f-team" value={filters.team || ""} onChange={set("team")}>
          <option value="">All teams</option>
          {options?.team?.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <button type="button" className="btn" onClick={onReset}>Reset filters</button>
    </section>
  );
}
