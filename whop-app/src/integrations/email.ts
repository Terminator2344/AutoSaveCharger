type SendEmailInput = { to: string; subject: string; html: string }

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; id?: string; error?: string }>{
  if (!process.env.RESEND_API_KEY) return { ok: true, id: String(Date.now()) }
  try {
    // TODO: integrate with Resend or SendGrid. Placeholder success.
    return { ok: true, id: String(Date.now()) }
  } catch (e: any) {
    return { ok: false, error: e?.message }
  }
}


