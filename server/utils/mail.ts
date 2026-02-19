import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST || '127.0.0.1'
const SMTP_PORT = Number(process.env.SMTP_PORT || 25)
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@talks123.ro'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    tls: { rejectUnauthorized: false }
  })
  return transporter
}

export async function sendResetEmail(to: string, resetUrl: string) {
  const t = getTransporter()
  await t.sendMail({
    from: MAIL_FROM,
    to,
    subject: 'Reset your talks123 password',
    text: `Reset your password using this link:\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, ignore this email.</p>`
  })
}
