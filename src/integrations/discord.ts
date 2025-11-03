type SendDiscordInput = { text: string }

export async function sendDiscord(input: SendDiscordInput): Promise<{ ok: boolean; error?: string }>{
  const webhook = process.env.DISCORD_WEBHOOK_URL
  if (!webhook) return { ok: true }
  try {
    await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      content: input.text
    }) })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}


