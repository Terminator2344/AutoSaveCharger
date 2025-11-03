type SendTelegramInput = { chatId: string; text: string }

export async function sendTelegram(input: SendTelegramInput): Promise<{ ok: boolean; id?: string; error?: string }>{
  if (!process.env.TELEGRAM_BOT_TOKEN) return { ok: true }
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: input.chatId, text: input.text }) })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const data = await res.json().catch(() => ({}))
    return { ok: true, id: data?.result?.message_id ? String(data.result.message_id) : undefined }
  } catch (e: any) {
    return { ok: false, error: e?.message }
  }
}


