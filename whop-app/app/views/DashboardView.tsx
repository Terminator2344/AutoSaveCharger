'use client';

import { useEffect, useRef, useState } from 'react';
import type { DashboardViewProps } from './types';

export default function DashboardView({
  company,
  user,
  access,
  from = '',
  to = '',
}: DashboardViewProps) {

  const chartsInitialized = useRef(false);
  const lineChartRef = useRef<any>(null);
  const barChartRef = useRef<any>(null);
  const pieChartRef = useRef<any>(null);
  const [metrics, setMetrics] = useState<null | {
    failed: number;
    recoveredTotal: number;
    recoveryRate: number;
    totalRevenue: number;
    lostRevenue: number;
    activeSubscribers: number;
  }>(null);
  const [prev, setPrev] = useState<null | {
    failed: number;
    recoveredTotal: number;
    recoveryRate: number;
    totalRevenue: number;
    lostRevenue: number;
    activeSubscribers: number;
  }>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(Date.now());

  // Metrics will be computed from events (current 7d vs previous 7d)

  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    const load = () =>
      fetch('/api/events')
  .then((r) => r.json())
  .then((res) => {
    const ev = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : [];
    setEvents(ev);
    setLastUpdatedAt(Date.now());
  })
  .catch((err) => {
    console.error('Failed to load events:', err);
    setEvents([]);
  });

    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  // derive metrics from events
  useEffect(() => {
    if (!events.length) return;
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - 6); // last 7 days window
    startOfThisWeek.setHours(0,0,0,0);
    const startOfPrevWeek = new Date(startOfThisWeek);
    startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);

    const inRange = (d: string) => new Date(d) >= startOfThisWeek;
    const inPrev = (d: string) => new Date(d) >= startOfPrevWeek && new Date(d) < startOfThisWeek;

    const evThis = events.filter((e) => inRange(e.occurredAt));
    const evPrev = events.filter((e) => inPrev(e.occurredAt));

    const sum = (arr: any[], fn: (e: any)=>number) => arr.reduce((a,e)=>a+fn(e),0);

    const failedThis = evThis.filter((e)=>e.type==='payment_failed');
    const succeededThis = evThis.filter((e)=>e.type==='payment_succeeded');

    // recoveredTotal: users with succeeded that had any failed before within all history
    const failedUsers = new Set(events.filter((e)=>e.type==='payment_failed').map((e)=>e.userId));
    const recoveredTotal = succeededThis.filter((e)=>failedUsers.has(e.userId)).length;
    const failedCount = failedThis.length;
    const recoveryRate = failedCount === 0 ? 0 : Math.round((recoveredTotal/failedCount)*1000)/10;

    const totalRevenue = sum(succeededThis, (e)=> (typeof e.amountCents==='number'? e.amountCents:0))/100;

    // lostRevenue: failed for users without any success later (in all history)
    const successUsersAll = new Set(events.filter((e)=>e.type==='payment_succeeded').map((e)=>e.userId));
    const lostRevenueCents = sum(failedThis.filter((e)=>!successUsersAll.has(e.userId)), (e)=> (typeof e.amountCents==='number'? e.amountCents:0));
    const lostRevenue = lostRevenueCents/100;

    // active subscribers: unique userId with success in last 30 days
    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate()-30);
    const activeSubscribers = new Set(events.filter((e)=>e.type==='payment_succeeded' && new Date(e.occurredAt)>=thirtyAgo).map((e)=>e.userId)).size;

    // prev week metrics
    const failedPrev = evPrev.filter((e)=>e.type==='payment_failed').length;
    const succeededPrev = evPrev.filter((e)=>e.type==='payment_succeeded');
    const recoveredPrev = succeededPrev.filter((e)=>failedUsers.has(e.userId)).length;
    const recoveryRatePrev = failedPrev===0?0: Math.round((recoveredPrev/failedPrev)*1000)/10;
    const totalRevenuePrev = sum(succeededPrev, (e)=> (typeof e.amountCents==='number'? e.amountCents:0))/100;
    const lostRevenuePrev = sum(evPrev.filter((e)=>e.type==='payment_failed' && !successUsersAll.has(e.userId)), (e)=> (typeof e.amountCents==='number'? e.amountCents:0))/100;

    setMetrics({ failed: failedCount, recoveredTotal, recoveryRate, totalRevenue, lostRevenue, activeSubscribers });
    setPrev({ failed: failedPrev, recoveredTotal: recoveredPrev, recoveryRate: recoveryRatePrev, totalRevenue: totalRevenuePrev, lostRevenue: lostRevenuePrev, activeSubscribers });
  }, [events]);

  useEffect(() => {

    const loadCharts = async () => {
      if (typeof window === 'undefined') return;

      try {
        const Chart = (await import('chart.js/auto')).default;
        const revCanvas = document.getElementById('revenueChart') as HTMLCanvasElement | null;
        const frCanvas = document.getElementById('failedRecoveredChart') as HTMLCanvasElement | null;
        const rrCanvas = document.getElementById('recoveryRateChart') as HTMLCanvasElement | null;

        if (!revCanvas || !frCanvas || !rrCanvas) {
          console.warn('Chart canvases not found');
          return;
        }

        // destroy previous instances to refresh data
        if (lineChartRef.current) {
          try { lineChartRef.current.destroy(); } catch {}
          lineChartRef.current = null;
        }
        if (barChartRef.current) {
          try { barChartRef.current.destroy(); } catch {}
          barChartRef.current = null;
        }
        if (pieChartRef.current) {
          try { pieChartRef.current.destroy(); } catch {}
          pieChartRef.current = null;
        }

        // Revenue Over Time Chart from events (sum of succeeded amounts per day)
        const revenueMap: Record<string, number> = {};
        events.forEach((e) => {
          if ((e.type === 'payment_succeeded' || e.type === 'payment_recovered') && typeof e.amountCents === 'number') {
            const d = new Date(e.occurredAt);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            revenueMap[key] = (revenueMap[key] || 0) + e.amountCents / 100;
          }
        });
        const labels = Object.keys(revenueMap).sort();
        const data = labels.map((k) => revenueMap[k] || 0);
        const formattedLabels = labels.map((date) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

        lineChartRef.current = new Chart(revCanvas, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [
              {
            label: 'Revenue ($)',
                data,
            borderColor: '#ff5500',
            backgroundColor: 'rgba(255, 85, 0, 0.26)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
              },
            ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: { display: true },
            tooltip: {
              backgroundColor: 'rgba(15, 17, 21, 0.98)',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              },
          },
          scales: {
            y: {
              beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#94a3b8',
                  callback: (value) => `$${value}`,
                },
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' },
              },
            },
          },
      });

      // Failed vs Recovered Over Time (last 56 days)
        const today = new Date();
        const days: string[] = [];
        for (let i = 55; i >= 0; i--) {
          const d = new Date(today); d.setDate(today.getDate()-i); d.setHours(0,0,0,0);
          days.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
        }
        const failedSeries = days.map((k)=>0);
        const recoveredSeries = days.map((k)=>0);
        events.forEach((e)=>{
          const d = new Date(e.occurredAt);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          const idx = days.indexOf(key);
          if (idx>=0) {
            if (e.type==='payment_failed') failedSeries[idx] += 1;
            if (e.type==='payment_succeeded') recoveredSeries[idx] += 1;
          }
        });
        const frLabels = days.map((date)=>{
          const d = new Date(date);
          return d.toLocaleDateString('en-US',{ month:'short', day:'numeric'});
        });
        barChartRef.current = new Chart(frCanvas, {
          type: 'line',
          data: {
            labels: frLabels,
            datasets: [
              { label: 'Failed', data: failedSeries, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.2)', fill: true, tension: 0.35 },
              { label: 'Recovered', data: recoveredSeries, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.2)', fill: true, tension: 0.35 },
            ],
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true }, tooltip: { backgroundColor: 'rgba(10,11,14,0.98)', titleColor:'#f8fafc', bodyColor:'#cbd5e1' }}, scales: { x: { ticks: { color:'#94a3b8'}}, y: { beginAtZero:true, ticks:{ color:'#94a3b8'}, grid:{ color: 'rgba(255,255,255,0.05)'}}}}
        });

      // Recovery Rate by Week (last 8 weeks)
        const weekRates: number[] = [];
        const weekLabels: string[] = [];
        const start = new Date(today); start.setDate(today.getDate()-55); start.setHours(0,0,0,0);
        for (let w=0; w<8; w++) {
          const ws = new Date(start); ws.setDate(start.getDate()+w*7);
          const we = new Date(ws); we.setDate(ws.getDate()+7);
          const evW = events.filter((e)=> new Date(e.occurredAt)>=ws && new Date(e.occurredAt)<we);
          const f = evW.filter((e)=>e.type==='payment_failed').length;
          const r = evW.filter((e)=>e.type==='payment_succeeded').length;
          weekRates.push(f===0?0: Math.round((r/f)*1000)/10);
          weekLabels.push(`${ws.toLocaleDateString('en-US',{month:'short', day:'numeric'})}`);
        }
        pieChartRef.current = new Chart(rrCanvas, {
          type: 'bar',
          data: { labels: weekLabels, datasets: [{ label: 'Recovery Rate (%)', data: weekRates, backgroundColor: '#f59e0b', borderRadius: 8 }] },
          options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ backgroundColor:'rgba(15,17,21,0.98)', titleColor:'#f8fafc', bodyColor:'#cbd5e1'}}, scales:{ y:{ beginAtZero:true, ticks:{ color:'#94a3b8', callback:(v)=>`${v}%` }, grid:{ color:'rgba(255,255,255,0.05)'}}, x:{ ticks:{ color:'#94a3b8'}, grid:{ display:false }}}}
        });
      } catch (error) {
        console.error('Failed to load charts:', error);
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(loadCharts, 100);
  }, [events]);

  const failedV = metrics?.failed ?? 0;
  const recoveredTotalV = metrics?.recoveredTotal ?? 0;
  const recoveryRateV = metrics ? String(metrics.recoveryRate) : '0';
  const revenueCentsV = metrics ? Math.round(metrics.totalRevenue * 100) : 0;
  const lostRevenueV = metrics?.lostRevenue ?? 0;
  const activeSubsV = metrics?.activeSubscribers ?? 0;
  
  const pct = (cur: number, p: number) => {
    const denom = Math.max(p, 1);
    return Math.round(((cur - p) / denom) * 1000) / 10;
  };

  const trendStr = (cur?: number, p?: number) => {
    if (cur == null || p == null) return undefined;
    const v = pct(cur, p);
    if (v > 0) return `+${v}% vs last week`;
    if (v < 0) return `${v}% vs last week`;
    return `0.0% vs last week`;
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-12 py-14">
        <h1 className="text-[24px] md:text-[32px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ffcc66] via-[#ffaa00] to-[#ff8800] mb-6 drop-shadow-[0_0_20px_rgba(255,136,0,0.5)]">
          Analytics Dashboard
        </h1>

        <form
          method="get"
          action="/dashboard"
          className="flex flex-wrap items-center gap-4 bg-black/40 backdrop-blur-xl border border-[#ff5500]/30 p-6 rounded-2xl mb-10 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,136,0,0.1),0_0_20px_rgba(255,85,0,0.15)]"
        >
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            From:
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="bg-black/50 border border-[#ff5500]/30 rounded-md px-3 py-2 text-gray-100 focus:border-[#ff8800] focus:shadow-[0_0_15px_rgba(255,136,0,0.3)] focus:outline-none transition-all"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            To:
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="bg-black/50 border border-[#ff5500]/30 rounded-md px-3 py-2 text-gray-100 focus:border-[#ff8800] focus:shadow-[0_0_15px_rgba(255,136,0,0.3)] focus:outline-none transition-all"
            />
          </label>
          <button
            type="submit"
            className="px-6 py-2.5 font-bold text-white rounded-lg bg-gradient-to-r from-[#ff5500] via-[#ff8800] to-[#ffaa00] shadow-[0_4px_20px_rgba(255,85,0,0.4),0_0_10px_rgba(255,136,0,0.3)] hover:shadow-[0_6px_30px_rgba(255,136,0,0.6),0_0_20px_rgba(255,170,0,0.5)] hover:from-[#ff8800] hover:via-[#ffaa00] hover:to-[#ffcc66] active:opacity-80 transition-all duration-300 transform hover:scale-105"
          >
            Apply
          </button>
          <a
            href="/dashboard"
            className="text-sm font-semibold text-gray-300 border border-[#ff5500]/30 px-4 py-2 rounded-lg hover:bg-[#ff5500]/10 hover:border-[#ff8800] hover:text-[#ffaa00] hover:shadow-[0_0_10px_rgba(255,136,0,0.2)] transition-all duration-300"
          >
            Reset
          </a>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => {
                const csvData = [
          ['Metric', 'Value'],
          ['Failed Payments', failedV],
                  ['Recovered Total', recoveredTotalV],
                  ['Recovery Rate', `${recoveryRateV}%`],
                  ['Total Revenue', `$${(revenueCentsV / 100).toFixed(2)}`],
                  ['Lost Revenue', `$${lostRevenueV.toFixed(2)}`],
                  ['Active Subscribers (30d)', activeSubsV],
                ];
                const csvContent = csvData
                  .map((row) =>
                    row
                      .map((cell) => {
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                          return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
                      })
                      .join(',')
                  )
                  .join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
                a.download = `dashboard-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
              }}
              className="px-6 py-2.5 font-bold text-white rounded-lg bg-gradient-to-r from-[#ff5500] via-[#ff8800] to-[#ffaa00] shadow-[0_4px_20px_rgba(255,85,0,0.4),0_0_10px_rgba(255,136,0,0.3)] hover:shadow-[0_6px_30px_rgba(255,136,0,0.6),0_0_20px_rgba(255,170,0,0.5)] hover:from-[#ff8800] hover:via-[#ffaa00] hover:to-[#ffcc66] active:opacity-80 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              <span>⬇</span>
              <span>Export CSV</span>
            </button>
          </div>
        </form>
        <div className="text-xs text-gray-400 mb-4">Updated {Math.max(0, Math.round((Date.now()-lastUpdatedAt)/1000))} seconds ago</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <MetricCard
            label="Failed Payments"
            value={failedV}
            variant="gradient-1"
            trend={trendStr(metrics?.failed, prev?.failed)}
            trendPositive={(metrics && prev) ? pct(metrics.failed, prev.failed) >= 0 ? false : true : undefined}
          />
          <MetricCard
            label="Recovered Total"
            value={recoveredTotalV}
            variant="gradient-2"
            trend={trendStr(metrics?.recoveredTotal, prev?.recoveredTotal)}
          />
          <MetricCard
            label="Recovery Rate"
            value={`${recoveryRateV}%`
            }
            variant="gradient-2"
            trend={trendStr(Number(recoveryRateV), prev?.recoveryRate)}
          />
          <MetricCard
            label="Total Revenue"
            value={`$${(revenueCentsV / 100).toFixed(2)}`}
            variant="gradient-6"
            trend={trendStr(metrics?.totalRevenue, prev?.totalRevenue)}
          />
          <MetricCard label="Lost Revenue" value={`$${lostRevenueV.toFixed(2)}`} variant="gradient-3" trend={trendStr(metrics?.lostRevenue, prev?.lostRevenue)} />
          <MetricCard label="Active Subscribers" value={activeSubsV} variant="gradient-5" trend={trendStr(metrics?.activeSubscribers, prev?.activeSubscribers)} />


        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Revenue Over Time" id="revenueChart" />
          <ChartCard title="Failed vs Recovered Over Time" id="failedRecoveredChart" />
          <ChartCard title="Recovery Rate by Week" id="recoveryRateChart" />
        </div>
      </div>

      <style jsx>{`
        .gradient-1 {
          background: linear-gradient(90deg, #ff5500 0%, #ff8800 50%, #ffaa00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 10px rgba(255, 120, 0, 0.6);
        }
        .gradient-2 {
          background: linear-gradient(90deg, #ff5500 0%, #ffaa00 50%, #ffcc66 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 10px rgba(255, 136, 0, 0.6);
        }
        .gradient-3 {
          background: linear-gradient(90deg, #ff5500 0%, #ff8800 50%, #ffaa00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 10px rgba(255, 85, 0, 0.6);
        }
        .gradient-4 {
          background: linear-gradient(90deg, #ffaa00 0%, #ff8800 50%, #ff5500 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 10px rgba(255, 136, 0, 0.6);
        }
        .gradient-5 {
          background: linear-gradient(90deg, #ffcc66 0%, #ffaa00 50%, #ff8800 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 10px rgba(255, 170, 0, 0.6);
        }
        .gradient-6 {
          background: linear-gradient(90deg, #ffaa00 0%, #ffcc66 50%, #ff8800 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 10px rgba(255, 136, 0, 0.6);
        }
      `}</style>
    </>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  variant?: string;
  trend?: string;
  trendPositive?: boolean;
  subValue?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  variant = '',
  trend,
  trendPositive = true,
  subValue,
}) => {
  // Динамически определяем, является ли тренд положительным
  const isPositive = trend?.trim().startsWith('+') ?? trendPositive;
  const trendArrow = isPositive ? '↑' : '↓';
  
  // Разделяем trend на процент и "vs last week"
  const trendMatch = trend?.match(/^([+-]?\d+\.?\d*%)/);
  const trendPercent = trendMatch ? trendMatch[1] : '';
  const trendText = trend?.replace(/^[+-]?\d+\.?\d*%\s*/, '') || '';
  
  const numericMatch = trendPercent.replace('%','');
  const numericValue = Number(numericMatch);
  const isNeutral = !Number.isNaN(numericValue) && Math.abs(numericValue) < 0.05;
  const trendColor = isNeutral
    ? 'text-gray-400'
    : (isPositive
      ? 'text-[#9effa4] drop-shadow-[0_0_6px_rgba(80,255,150,0.6)]'
      : 'text-[#ff7676] drop-shadow-[0_0_6px_rgba(255,90,70,0.6)]');
  
  return (
    <div
      className="relative backdrop-blur-sm border border-[#ff5500]/30 rounded-2xl p-6 flex flex-col justify-between bg-[#1a0d00]/60 shadow-[inset_0_0_20px_rgba(255,100,0,0.1),0_8px_32px_rgba(0,0,0,0.5)] hover:border-[#ff8800]/70 hover:shadow-[0_0_25px_rgba(255,100,0,0.4),inset_0_0_25px_rgba(255,100,0,0.2),0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out group hover:scale-[1.02] cursor-pointer"
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Название метрики - спокойный янтарный */}
      <div className="text-xs uppercase tracking-widest font-semibold text-[#ffae60cc] mb-1">
        {label}
      </div>
      
      {/* Основное значение - раскалённый градиент */}
      <div
        className="text-[28px] md:text-[32px] font-extrabold leading-tight transition-all duration-300 ease-in-out group-hover:scale-[1.03] group-hover:brightness-125"
        style={{
          background: 'linear-gradient(180deg, #ffd480 0%, #ff8a00 40%, #ff5500 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 15px rgba(255, 130, 0, 0.6)',
        }}
      >
        {value}
      </div>
      
      {/* Изменение за период - стрелка, процент и текст */}
      {trend && (
  <div
    className={`text-sm font-semibold tracking-wide mt-2 transition-all duration-300 ease-in-out ${trendColor}`}
    style={{
      textShadow: isPositive
  ? '0 0 0px rgb(3, 94, 32), 0 0 0px rgb(3, 94, 32), 0 0 0px rgb(3, 94, 32)'
  : '0 0 0px rgba(131, 13, 0, 0.93), 0 0 0px rgba(131, 13, 0, 0.93), 0 0 0px rgba(131, 13, 0, 0.93)',

    }}
  >
    {isPositive ? '↑' : '↓'}&nbsp;{trend}&nbsp;
  </div>
)}
      
      {subValue && (
        <div className="text-sm text-gray-300 mt-2 group-hover:text-gray-200 transition-colors duration-300 ease-in-out">
          {subValue}
        </div>
      )}
    </div>
  );
};

const ChartCard: React.FC<{ title: string; id: string }> = ({ title, id }) => (
  <div className="bg-black/40 backdrop-blur-sm border border-[#ff5500]/30 rounded-2xl p-6 shadow-[inset_0_0_20px_rgba(255,85,0,0.1),0_8px_32px_rgba(0,0,0,0.5)] min-h-[400px] hover:border-[#ff8800]/50 hover:shadow-[inset_0_0_30px_rgba(255,136,0,0.15),0_0_20px_rgba(255,136,0,0.2)] transition-all duration-300">
    <div className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-200">
      <span className="w-1.5 h-5 bg-gradient-to-b from-[#ff5500] via-[#ff8800] to-[#ffcc66] rounded-sm shadow-[0_0_8px_rgba(255,136,0,0.5)]" />
      {title}
    </div>
    <div className="relative h-72 w-full">
      <canvas id={id}></canvas>
    </div>
  </div>
);
