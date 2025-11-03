export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return { title: 'Dashboard' }
}

export default function DashboardPage() {
  // Iframe-safe frosted UI (Tailwind): backdrop-blur, bg-white/20, rounded, border
  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-900">
      <div className="max-w-xl w-full m-6 p-6 rounded-2xl border border-white/20 bg-white/10 backdrop-blur text-white shadow-lg">
        <h1 className="text-2xl font-semibold mb-2">AutoChargeSaver</h1>
        <p className="text-white/80 mb-4">Your Whop-native dashboard (iframe-safe, frosted UI).</p>
        <div className="grid gap-3">
          <a className="inline-flex items-center justify-center rounded-lg px-4 py-2 bg-white/20 hover:bg-white/30 transition" href="/api/whop/oauth/authorize">Connect Whop</a>
        </div>
      </div>
    </div>
  )
}


