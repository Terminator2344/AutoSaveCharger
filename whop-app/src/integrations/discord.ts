type SendDiscordInput = { text: string }

export async function sendDiscord(input: SendDiscordInput): Promise<{ ok: boolean; id?: string; error?: string }>{
  const hook = process.env.DISCORD_WEBHOOK_URL
  if (!hook) return { ok: true }
  try {
    const res = await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: input.text }) })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message }
  }
}


