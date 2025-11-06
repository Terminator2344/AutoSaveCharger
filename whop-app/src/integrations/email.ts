import nodemailer from 'nodemailer';

type SendEmailInput = { to: string; subject: string; html: string };

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP not configured, skipping email send');
    return { ok: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `AutoChargeSaver <${process.env.SMTP_USER}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    return { ok: true, id: info.messageId };
  } catch (e: any) {
    console.error('❌ Email send failed:', e);
    return { ok: false, error: e?.message };
  }
}
export function buildPaymentEmailHtml({
  userName,
  amount,
  retryUrl,
}: {
  userName: string;
  amount: string;
  retryUrl: string;
}): string {
  return `
  <div style="
    background: radial-gradient(circle at top left, #3b0a00 0%, #140000 80%);
    padding: 60px 0;
    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
  ">
    <table align="center" cellpadding="0" cellspacing="0"
      style="max-width: 580px;
             background: linear-gradient(180deg, #2b0000 0%, #4a0b00 100%);
             border-radius: 22px;
             box-shadow: 0 0 40px rgba(255, 80, 0, 0.4);
             overflow: hidden;
             text-align: center;">
      <tr>
        <td style="padding: 45px;">
         <img src="https://i.postimg.cc/pXGzG1tW/Auto-Charge-Saver-1.png"
     alt="AutoChargeSaver"
     width="140"
     style="margin-bottom: 25px; border-radius: 16px;" />

          <h2 style="
            color: #ff9933;
            font-size: 26px;
            margin: 0 0 18px;
            text-shadow: 0 0 12px rgba(255,120,0,0.5);
          ">
            ⚠️ Payment Failed
          </h2>

          <p style="font-size:16px; color:#fff3e0; margin:0 0 28px;">
            Hello ${userName || 'there'}, we couldn’t process your recent payment 
            of <b>$${amount}</b>. Please update your billing method below:
          </p>

          <a href="${retryUrl}"
             style="
               background: linear-gradient(90deg, #ff6600, #ffaa00);
               color: #111;
               text-decoration: none;
               padding: 14px 36px;
               border-radius: 12px;
               font-weight: 600;
               box-shadow: 0 6px 14px rgba(255,100,0,0.4);
               display: inline-block;
               margin-bottom: 28px;
             ">
            🔁 Retry Payment
          </a>

          <div style="
            text-align: left;
            color:rgb(236, 154, 53);
            font-size: 14px;
            line-height: 1.7;
            background: rgba(0,0,0,0.2);
            padding: 16px 20px;
            border-radius: 12px;
          ">
            <b>Possible reasons:</b><br/>
            • Card expired or declined<br/>
            • Insufficient funds<br/>
            • Bank temporarily blocked the transaction<br/><br/>
            <b>Need help?</b> — contact us on
            <a href="https://t.me/SK1D1SH" style="color:#ffbb55;">Telegram</a>
            
          </div>

          <hr style="margin:32px 0; border:none; border-top:1px solid rgba(255,150,50,0.4);" />

          <p style="font-size:13px; color:#ffae66; margin:0;">
            © ${new Date().getFullYear()} AutoChargeSaver<br/>
            Smart Payment Recovery for Whop Creators
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
}
