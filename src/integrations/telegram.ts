type SendTelegramInput = { chatId: string; text: string }

export async function sendTelegram(input: SendTelegramInput): Promise<{ ok: boolean; error?: string }>{
  if (!process.env.TELEGRAM_BOT_TOKEN) return { ok: true }
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      chat_id: input.chatId,
      text: input.text
    }) })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}


