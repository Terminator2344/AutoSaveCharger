import nodemailer from 'nodemailer'

type SendEmailInput = {
  to: string
  subject: string
  html: string
}

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    // Graceful no-op transporter to avoid throwing inside webhooks
    return {
      sendMail: async () => ({
        accepted: [],
        rejected: [],
        response: 'SMTP not configured',
      }),
    } as unknown as nodemailer.Transporter
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for others
    auth: { user, pass },
  })

  return transporter
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  try {
    const from = process.env.SMTP_FROM || 'AutoChargeSaver <no-reply@autocharge.app>'
    const tx = getTransporter()

    const info = await tx.sendMail({ from, to, subject, html })
    return { ok: true, id: (info as any)?.messageId ?? undefined }
  } catch (err) {
    console.warn('Email send error (ignored):', err)
    return { ok: false, error: (err as any)?.message || 'send failed' }
  }
}

export function buildPaymentEmailHtml(params: {
  type: string
  channel?: string | null
  amountCents?: number | null
}) {
  const amount = ((params.amountCents ?? 0) / 100).toFixed(2)
  const channel = params.channel ?? 'unknown channel'

  return `
  <div style="background:#0a0a0a;padding:24px;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;color:#e5e5e5">
    <div style="max-width:640px;margin:0 auto;background:linear-gradient(180deg,#0c0805,#1a0f00);border:1px solid rgba(255,120,0,0.25);border-radius:14px;box-shadow:0 0 20px rgba(255,120,0,0.15)">
      <div style="padding:24px 24px 8px">
        <h1 style="margin:0;font-size:20px;font-weight:700;background:linear-gradient(90deg,#ff6a00,#ff9500,#ff4500,#ff6a00);-webkit-background-clip:text;background-clip:text;color:transparent;">AutoChargeSaver</h1>
        <p style="margin:8px 0 0;color:#ffb347">${params.type.replace('_',' ').toUpperCase()}</p>
      </div>
      <div style="padding:16px 24px 24px">
        <p style="margin:0 0 12px">Unfortunately, your recent payment attempt through <strong>${channel}</strong> for the amount of <strong>$${amount}</strong> was not successful.</p>
        <p style="margin:0 0 12px">Please check your payment method or try again later. If you believe this is an error, feel free to contact our support team.</p>
        <p style="margin:24px 0 0;color:#ffb347"><strong>AutoChargeSaver Billing Support</strong></p>
      </div>
    </div>
  </div>`
}





