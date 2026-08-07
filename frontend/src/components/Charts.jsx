import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, monthLabel } from "../services/format.js";

const COLORS = ["#2563eb", "#0d9488", "#f59e0b", "#7c3aed", "#e11d48", "#0891b2"];
const tick = { fontSize: 12, fill: "#475569" };

export function TrendChart({ data = [] }) {
  const rows = (data || []).map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <section className="card" aria-labelledby="trend-h">
      <h2 id="trend-h">Monthly spending trend</h2>
      {!rows.length ? (
        <div className="chart-empty">
          <p className="muted">No spending data found for the selected filter range.</p>
        </div>
      ) : (
        <div className="chart" role="img" aria-label="Line chart of monthly spend compared with the monthly budget">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={tick} />
              <YAxis tick={tick} tickFormatter={(v) => `$${v / 1000}k`} width={52} />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Line type="monotone" dataKey="total" name="Spend" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="budget" name="Budget" stroke="#e11d48" strokeDasharray="6 4" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function BreakdownChart({ title, data = [], variant = "bar" }) {
  const id = `bd-${title.replace(/\s/g, "")}`;
  const items = data || [];
  return (
    <section className="card" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {!items.length ? (
        <div className="chart-empty chart-sm-empty">
          <p className="muted">No breakdown data for selected criteria.</p>
        </div>
      ) : (
        <div className="chart chart-sm" role="img" aria-label={`${title}: ${items.map((d) => `${d.name} ${d.percent}%`).join(", ")}`}>
          <ResponsiveContainer width="100%" height="100%">
            {variant === "pie" ? (
              <PieChart>
                <Pie data={items} dataKey="total" nameKey="name" innerRadius="45%" outerRadius="80%" paddingAngle={2}>
                  {items.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
                <Legend />
              </PieChart>
            ) : (
              <BarChart data={items} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={tick} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="name" tick={tick} width={96} />
                <Tooltip formatter={(v) => money(v)} />
                <Bar dataKey="total" name="Spend" radius={[0, 4, 4, 0]}>
                  {items.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
