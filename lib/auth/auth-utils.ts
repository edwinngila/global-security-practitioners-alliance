import { hash, compare } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import { createTransport } from 'nodemailer'

import type { Secret } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const EMAIL_SERVER = process.env.EMAIL_SERVER
const EMAIL_FROM = process.env.EMAIL_FROM

const transporter = createTransport(EMAIL_SERVER as string)

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword)
}

export function generateToken(payload: object, expiresIn: string = '1d'): string {
  // cast sign to any to avoid overload typing issues in this environment
  return (sign as any)(payload, JWT_SECRET as any, { expiresIn }) as string
}

export function verifyToken(token: string): any {
  try {
    return verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  // use path-style link to make links cleaner: /verify-email/<token>
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email/${token}`

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'Verify your email address',
    html: `
      <div>
        <h1>Email Verification</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      </div>
    `
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'Reset your password',
    html: `
      <div>
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      </div>
    `
  })
}