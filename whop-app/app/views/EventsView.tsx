'use client';
import { useEffect, useState } from 'react';

interface Event {
  occurredAt: string | Date;
  type: string;
  user?: { email?: string; whopUserId?: string };
  recovered: boolean;
  reason?: string | null;
  channel?: string;
  amountCents?: number;
}

interface EventsViewProps {
  events?: Event[];
  availableTypes?: string[];
  availableChannels?: string[];
  page?: number;
}

export default function EventsView({
  events = [],
  availableTypes = ['payment_failed', 'payment_succeeded', 'payment_recovered'],
  availableChannels = ['email', 'telegram', 'discord'],
  page = 1,
}: EventsViewProps) {
  const [eventType, setEventType] = useState('all');
  const [channel, setChannel] = useState('all');
  const [remoteEvents, setRemoteEvents] = useState<Event[]>([]);

  useEffect(() => {
    const load = () =>
      fetch('/api/events')
        .then((r) => r.json())
        .then((list) => setRemoteEvents(list))
        .catch(() => void 0);
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const displayEvents = (remoteEvents && remoteEvents.length > 0)
    ? remoteEvents
    : (events.length > 0 ? events : []);

  const filtered = displayEvents.filter((e) => {
    const typeOk = eventType === 'all' || e.type === eventType;
    const chOk = channel === 'all' || e.channel === channel;
    return typeOk && chOk;
  });

  return (
    <div className="min-h-screen text-amber-100 font-sans" style={{
      background: `radial-gradient(circle at 20% 20%, rgba(255, 136, 0, 0.08) 0%, transparent 60%),
                   radial-gradient(circle at 80% 80%, rgba(255, 85, 0, 0.06) 0%, transparent 60%),
                   linear-gradient(to bottom, #0a0a0a 0%, #050505 100%)`
    }}>
      
      <main className="max-w-6xl mx-auto px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ffcc66] via-[#ffaa00] to-[#ff8800] mb-8 drop-shadow-[0_0_20px_rgba(255,136,0,0.5)]">
          Events
        </h1>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <label className="text-sm font-semibold text-amber-200 flex items-center gap-2">
            Type:
            <select
              className="ml-2 bg-black/50 border border-amber-500/30 rounded-md px-3 py-2 text-amber-100 focus:border-[#ff8800] focus:shadow-[0_0_15px_rgba(255,136,0,0.3)] focus:outline-none transition-all"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="all">All Types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-amber-200 flex items-center gap-2">
            Channel:
            <select
              className="ml-2 bg-black/50 border border-amber-500/30 rounded-md px-3 py-2 text-amber-100 focus:border-[#ff8800] focus:shadow-[0_0_15px_rgba(255,136,0,0.3)] focus:outline-none transition-all"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="all">All Channels</option>
              {availableChannels.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-amber-500/20 shadow-[0_0_10px_rgba(255,136,0,0.25)] bg-[#1a120b]/70 backdrop-blur-sm">
            <table className="w-full border-collapse text-sm text-amber-100">
              <thead className="bg-black/40 text-amber-400 uppercase text-[11px] tracking-wide border-b border-amber-500/20">
                <tr>
                  <th className="py-3 px-5 text-left">Occurred At</th>
                  <th className="py-3 px-5 text-left">Type</th>
                  <th className="py-3 px-5 text-left">User</th>
                  <th className="py-3 px-5 text-left">Status</th>
                  <th className="py-3 px-5 text-left">Reason</th>
                  <th className="py-3 px-5 text-left">Channel</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e: any, i) => (
                  <tr key={i} className="border-t border-amber-500/10 hover:bg-[#1a120b]/40 transition-all duration-200">
                    <td className="py-3 px-5 text-amber-200/80 font-mono text-xs">
                      {new Date(e.occurredAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className={`type-badge type-${e.type}`}>{String(e.type).replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-5">{e.user?.email || e.userEmail || e.user?.whopUserId || e.whopUserId || '-'}</td>
                    <td className="px-5">
                      {e.recovered ? (
                        <span className="badge badge-success">Recovered</span>
                      ) : (
                        <span className="badge badge-danger">Failed</span>
                      )}
                    </td>
                    <td className="px-5">
                      {e.reason ? (
                        <span className="badge badge-neutral">{e.reason}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-5 font-semibold capitalize text-amber-200/90">{e.channel || '-'}</td>
                    <td className="px-5 text-right text-amber-400 font-semibold">
                      {typeof e.amountCents === 'number' ? `$${(e.amountCents / 100).toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-black/40 border border-amber-500/20 rounded-2xl p-16 text-center shadow-[inset_0_0_20px_rgba(255,100,0,0.1),0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="text-5xl mb-4">📊</div>
            <div className="text-2xl font-bold text-amber-100 mb-2">No events yet</div>
            <div className="text-amber-200/70">Waiting for new activity</div>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            {page > 1 && (
              <a
                href={`/dashboard/events?page=${page - 1}`}
                className="px-4 py-2 bg-black/40 border border-amber-500/30 rounded-md text-amber-100 hover:bg-[#ff5500]/10 hover:border-[#ff8800] transition"
              >
                ← Prev
              </a>
            )}
            <span className="px-4 py-2 bg-black/40 rounded-md text-amber-300/80">Page {page}</span>
            <a
              href={`/dashboard/events?page=${page + 1}`}
              className="px-4 py-2 bg-black/40 border border-amber-500/30 rounded-md text-amber-100 hover:bg-[#ff5500]/10 hover:border-[#ff8800] transition"
            >
              Next →
            </a>
          </div>
        )}

        <style jsx>{`
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-success {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.35);
          }
          .badge-danger {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.35);
          }
          .badge-neutral {
            background: rgba(148, 163, 184, 0.2);
            color: #a3a3a3;
            border: 1px solid rgba(148, 163, 184, 0.3);
          }
          .type-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            text-transform: capitalize;
          }
          .type-payment_failed {
            background: rgba(239, 68, 68, 0.25);
            color: #fca5a5;
          }
          .type-payment_succeeded {
            background: rgba(34, 197, 94, 0.25);
            color: #86efac;
          }
          .type-payment_recovered {
            background: rgba(251, 191, 36, 0.25);
            color: #fde047;
          }
        `}</style>
      </main>
    </div>
  );
}
