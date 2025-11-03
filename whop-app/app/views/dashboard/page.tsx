import { db } from '@/lib/db'

async function getMetrics() {
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000
  const ev = db.events
  const failedCount7d = ev.filter(e => e.type?.includes('failed') && new Date(e.occurredAt).getTime() >= since).length
  const recoveredCount7d = ev.filter(e => e.recovered && new Date(e.occurredAt).getTime() >= since).length
  const clickRecoveries = ev.filter(e => e.recovered && e.reason === 'click' && new Date(e.occurredAt).getTime() >= since).length
  const windowRecoveries = ev.filter(e => e.recovered && e.reason === 'window' && new Date(e.occurredAt).getTime() >= since).length
  const recent = ev.filter(e => e.type?.includes('failed')).sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 20)
  return { failedCount7d, recoveredCount7d, clickRecoveries, windowRecoveries, recent }
}

export default async function Dashboard() {
  const m = await getMetrics()
  return (
    <div className="min-h-dvh p-6 bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Auto-Charge Saver</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Failed payments (7d)" value={m.failedCount7d} />
          <Card title="Recovered (7d)" value={m.recoveredCount7d} />
          <Card title="Recovery split" value={`${m.clickRecoveries} click / ${m.windowRecoveries} window`} />
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-4">
          <h2 className="font-medium mb-3">Recent failed events</h2>
          <div className="overflow-x-auto text-sm">
            <table className="min-w-full">
              <thead className="text-white/70">
                <tr>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">CTA Preview</th>
                </tr>
              </thead>
              <tbody>
                {m.recent.map((e) => (
                  <tr key={e.id} className="border-t border-white/10">
                    <td className="p-2">{new Date(e.occurredAt).toLocaleString()}</td>
                    <td className="p-2">{e.userId ?? '—'}</td>
                    <td className="p-2">{e.email ?? '—'}</td>
                    <td className="p-2">/api/r/{e.userId ?? 'USER'}?c=email&m=MSG</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex gap-3">
          <a className="inline-flex items-center justify-center rounded-lg px-4 py-2 bg-white/20 hover:bg-white/30" href="#">Connect Telegram</a>
          <a className="inline-flex items-center justify-center rounded-lg px-4 py-2 bg-white/20 hover:bg-white/30" href="#">Connect Discord</a>
          <a className="inline-flex items-center justify-center rounded-lg px-4 py-2 bg-white/20 hover:bg-white/30" href="/api/webhooks">Test Webhook Locally</a>
        </div>
      </div>
    </div>
  )
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-4">
      <div className="text-white/70 text-sm">{title}</div>
      <div className="text-2xl font-semibold">{String(value)}</div>
    </div>
  )
}


