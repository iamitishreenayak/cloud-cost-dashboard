const rawBase = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").trim().replace(/\/+$/, "");
export const API_BASE = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;

async function get(path, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, v);
  });
  const query = qs.toString();
  let res;
  try {
    res = await fetch(`${API_BASE}${path}${query ? `?${query}` : ""}`);
  } catch {
    throw new Error(`Cannot reach the API at ${API_BASE}. Is the backend running?`);
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") msg = body.detail;
      else if (Array.isArray(body.detail)) msg = body.detail.map((d) => `${d.loc.slice(1).join(".")}: ${d.msg}`).join("; ");
    } catch { /* keep default message */ }
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  options: () => get("/filters/options"),
  summary: (f) => get("/summary", f),
  monthly: (f) => get("/charts/monthly", f),
  breakdown: (dim, f) => get(`/charts/breakdown/${dim}`, f),
  costs: (p) => get("/costs", p),
  budget: (t) => get("/budget", t),
  suggestions: (f) => get("/suggestions", f),
};
