"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DateRangePicker from "@/app/components/DateRangePicker";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CARD_CLASS =
  "bg-gradient-to-b from-[#0f0a00] to-[#1a0f00] border border-orange-600/30 rounded-xl p-5 text-orange-200 shadow-[inset_0_0_20px_rgba(255,120,0,0.2)] hover:shadow-[0_0_20px_rgba(255,160,0,0.3)] transition";

const ACCENT_GRADIENT_BTN =
  "px-3 py-2 rounded-md bg-gradient-to-r from-[#ff7a00] to-[#ffb347] text-black font-semibold shadow-[0_0_10px_rgba(255,140,0,0.5)] hover:brightness-110 transition";

const PIE_COLORS = ["#ff7a00", "#ffd166", "#ffb347", "#ff9248"];

function MetricCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className={CARD_CLASS}>
      <div className="text-sm text-orange-300/80 mb-2">{title}</div>
      <div className="text-2xl md:text-3xl font-semibold text-[#ffd166]">{value}</div>
      {sub ? <div className="text-xs text-orange-300/70 mt-1">{sub}</div> : null}
    </div>
  );
}

function ExportButton({ getData }: { getData: () => unknown }) {
  function toCsv(rows: Array<Record<string, unknown>>): string {
    if (!rows.length) return "";
    const cols = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const header = cols.join(",");
    const body = rows.map((r) => cols.map((c) => escape((r as any)[c])).join(",")).join("\n");
    return header + "\n" + body;
  }

  function handleExport() {
    const data = getData();
    // flatten data minimally: only charts and metrics/events summary
    const rows: Array<Record<string, unknown>> = [];
    const now = new Date().toISOString();
    rows.push({ type: "meta", generatedAt: now });
    rows.push({ type: "section", name: "revenueOverTime" });
    (data as any).revenueOverTime?.forEach((d: any) => rows.push({ type: "revenue", date: d.date?.toISOString?.() || d.date, value: d.value }));
    rows.push({ type: "section", name: "failuresVsRecoveries" });
    (data as any).failuresVsRecoveries?.forEach((d: any) => rows.push({ type: "bars", date: d.date?.toISOString?.() || d.date, failed: d.failed, recovered: d.recovered }));
    rows.push({ type: "section", name: "recoveryRateOverTime" });
    (data as any).recoveryRateOverTime?.forEach((d: any) => rows.push({ type: "rate", date: d.date?.toISOString?.() || d.date, rate: d.rate, avg: d.avg }));
    rows.push({ type: "section", name: "channelEfficiency" });
    (data as any).channelEfficiency?.forEach((d: any) => rows.push({ type: "channel", name: d.name, value: d.value }));
    rows.push({ type: "section", name: "events" });
    (data as any).events?.forEach((e: any) => rows.push({ type: "event", id: e.id, date: e.date?.toISOString?.() || e.date, user: e.user, eventType: e.type, channel: e.channel, status: e.status }));

    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autocharge_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={handleExport} className={ACCENT_GRADIENT_BTN}>
      Export CSV
    </button>
  );
}

export default function DashboardView() {
  const { range, filterDataByRange, data, metrics } = useDashboardData();
  const [tab, setTab] = useState<"dashboard" | "events">("dashboard");
  const [eventFilter, setEventFilter] = useState<"all" | "payment_failed" | "payment_succeeded" | "recovered_by_click">("all");
  const [page, setPage] = useState(1);

  const pageSize = 10;
  const filteredEvents = useMemo(() => {
    const list = eventFilter === "all" ? data.events : data.events.filter((e) => e.type === eventFilter);
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [data.events, eventFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const pageSlice = filteredEvents.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#050505] via-[#100800] to-[#1a0f00] text-[#f5f5f5]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">AutoCharge Saver Analytics</h1>
              <p className="text-sm text-[#a3a3a3]">Recovery performance, revenue impact, and user activity</p>
            </div>
            <div className="flex items-center gap-3">
              <DateRangePicker value={range} onChange={filterDataByRange} />
              <ExportButton getData={() => data} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-orange-800/30">
            {(["dashboard", "events"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 -mb-[1px] border-b-2 ${
                  tab === t ? "border-[#ffb347] text-[#ffd166]" : "border-transparent text-orange-300/80 hover:text-orange-200"
                }`}
              >
                {t === "dashboard" ? "Dashboard" : "Events"}
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {tab === "dashboard" ? (
              <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="flex flex-col gap-6">
                {/* Metrics grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <MetricCard title="Failed Payments" value={metrics.failed.toLocaleString()} />
                  <MetricCard title="Recovered Payments" value={metrics.recovered.toLocaleString()} />
                  <MetricCard title="Revenue Recovered ($)" value={metrics.revenue.toLocaleString()} />
                  <MetricCard title="Average Recovery Rate (%)" value={`${metrics.recoveryRate}%`} />
                  <MetricCard title="Top Channel" value={metrics.topChannel} />
                  <MetricCard title="Active Users" value={metrics.activeUsers.toLocaleString()} />
                </div>

                {/* Charts */}
                <div className="mt-2">
                  <h2 className="text-lg font-semibold mb-3 text-[#ffd166]">Performance Overview</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Revenue Over Time */}
                    <div className={CARD_CLASS + " h-[300px]"}>
                      <div className="text-sm text-orange-300/80 mb-2">Revenue Over Time</div>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.revenueOverTime.map((d) => ({ ...d, x: d.date }))} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
                          <CartesianGrid stroke="#38220a" strokeDasharray="3 3" />
                          <XAxis dataKey="x" tickFormatter={() => ""} stroke="#a36a00" tick={false} axisLine={false} />
                          <YAxis stroke="#a36a00" tickLine={false} axisLine={false} />
                          <Tooltip labelFormatter={() => ""} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]} contentStyle={{ background: "#1a0f00", border: "1px solid rgba(255,140,0,0.3)", color: "#ffd166" }} />
                          <Line type="monotone" dataKey="value" stroke="#ffb347" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Failures vs Recoveries */}
                    <div className={CARD_CLASS + " h-[300px]"}>
                      <div className="text-sm text-orange-300/80 mb-2">Failures vs Recoveries</div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.failuresVsRecoveries.map((d) => ({ ...d, x: d.date }))} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
                          <CartesianGrid stroke="#38220a" strokeDasharray="3 3" />
                          <XAxis dataKey="x" tickFormatter={() => ""} stroke="#a36a00" tick={false} axisLine={false} />
                          <YAxis stroke="#a36a00" tickLine={false} axisLine={false} />
                          <Tooltip labelFormatter={() => ""} contentStyle={{ background: "#1a0f00", border: "1px solid rgba(255,140,0,0.3)", color: "#ffd166" }} />
                          <Bar dataKey="failed" fill="#ff7a00" opacity={0.7} />
                          <Bar dataKey="recovered" fill="#ffd166" opacity={0.85} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Recovery Rate Over Time */}
                    <div className={CARD_CLASS + " h-[300px]"}>
                      <div className="text-sm text-orange-300/80 mb-2">Recovery Rate (%) Over Time</div>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.recoveryRateOverTime.map((d) => ({ ...d, x: d.date }))} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
                          <CartesianGrid stroke="#38220a" strokeDasharray="3 3" />
                          <XAxis dataKey="x" tickFormatter={() => ""} stroke="#a36a00" tick={false} axisLine={false} />
                          <YAxis stroke="#a36a00" tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} domain={[0, 100]} />
                          <Tooltip labelFormatter={() => ""} formatter={(v: any, n: string) => [n === "avg" ? `${v}% (avg)` : `${v}%`, n]} contentStyle={{ background: "#1a0f00", border: "1px solid rgba(255,140,0,0.3)", color: "#ffd166" }} />
                          <Line type="monotone" dataKey="rate" stroke="#ffb347" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="avg" stroke="#ffd166" strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Channel Efficiency */}
                    <div className={CARD_CLASS + " h-[300px]"}>
                      <div className="text-sm text-orange-300/80 mb-2">Channel Efficiency</div>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.channelEfficiency} dataKey="value" nameKey="name" outerRadius={90}>
                            {data.channelEfficiency.map((_, idx) => (
                              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: "#1a0f00", border: "1px solid rgba(255,140,0,0.3)", color: "#ffd166" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="flex flex-col gap-4">
                {/* Events filter */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-orange-300/80">Event type:</label>
                    <select
                      className="px-3 py-2 rounded-md bg-[rgba(20,10,0,0.4)] border border-orange-700/30 text-orange-100"
                      value={eventFilter}
                      onChange={(e) => {
                        setEventFilter(e.target.value as any);
                        setPage(1);
                      }}
                    >
                      <option value="all">All</option>
                      <option value="payment_failed">payment_failed</option>
                      <option value="payment_succeeded">payment_succeeded</option>
                      <option value="recovered_by_click">recovered_by_click</option>
                    </select>
                  </div>
                </div>

                {/* Events table */}
                <div className="w-full border border-orange-700/30 rounded-xl bg-[rgba(20,10,0,0.4)] backdrop-blur-md text-orange-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-black/30">
                      <tr>
                        <th className="text-left px-4 py-3">Date</th>
                        <th className="text-left px-4 py-3">User</th>
                        <th className="text-left px-4 py-3">Event Type</th>
                        <th className="text-left px-4 py-3">Channel</th>
                        <th className="text-left px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageSlice.map((e) => (
                        <tr key={e.id} className="border-t border-orange-800/20 hover:bg-orange-900/10">
                          <td className="px-4 py-3 text-orange-300/90">{e.date.toLocaleString()}</td>
                          <td className="px-4 py-3">{e.user}</td>
                          <td className="px-4 py-3">{e.type}</td>
                          <td className="px-4 py-3">{e.channel}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-md border border-orange-700/40 text-xs">
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {pageSlice.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-orange-300/70">No events found</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                  {/* Pagination */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-orange-800/20">
                    <div className="text-xs text-orange-300/70">
                      Page {page} of {pageCount}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-2 rounded-md border border-orange-800/40 text-orange-200 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        disabled={page >= pageCount}
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        className="px-3 py-2 rounded-md border border-orange-800/40 text-orange-200 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
















