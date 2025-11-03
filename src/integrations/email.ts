type SendEmailInput = { to: string; subject: string; html: string }

export async function sendEmail(input: SendEmailInput): Promise<{ id?: string; ok: boolean; error?: string }>{
  // TODO: Integrate with provider (Resend, etc.) — see docs/whop/guides/notifications
  // Fallback: no-op in dev
  if (!process.env.RESEND_API_KEY) return { ok: true }
  try {
    // Placeholder call
    return { ok: true, id: 'stub-email' }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}


