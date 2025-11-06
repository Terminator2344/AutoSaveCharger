type SendTelegramInput = {
  chatId: string;
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
  reply_markup?: {
    inline_keyboard: { text: string; url: string }[][];
  };
};

export async function sendTelegram(
  input: SendTelegramInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return { ok: true };

  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const body = {
      chat_id: input.chatId,
      text: input.text,
      parse_mode: input.parse_mode,
      reply_markup: input.reply_markup,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const data = await res.json().catch(() => ({}));
    return {
      ok: true,
      id: data?.result?.message_id
        ? String(data.result.message_id)
        : undefined,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}
export async function sendTelegramAnimation(chatId: string, animationUrl: string, caption?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');

  const url = `https://api.telegram.org/bot${token}/sendAnimation`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      animation: animationUrl,
      caption: caption,
      parse_mode: 'HTML',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('❌ Telegram animation send error:', err);
  }
}
