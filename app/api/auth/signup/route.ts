import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { hashPassword, generateToken, sendVerificationEmail } from '@/lib/auth/auth-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      nationality,
      gender,
      designation,
      organizationName,
      documentType,
      documentNumber,
      declarationAccepted,
      passportPhotoUrl,
      signatureUrl
    } = body

    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    // ensure email unique
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

    const hashed = await hashPassword(password)
    const verifyToken = generateToken({ email }, '7d')

    // create user
    const user = await prisma.user.create({ data: { email, password: hashed, verifyToken } })

    // create profile with id = user.id
    await prisma.profile.create({ data: {
      id: user.id,
      firstName: firstName || '',
      lastName: lastName || '',
      email,
      phoneNumber: phoneNumber || '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
      nationality: nationality || '',
      gender: gender ? gender.toUpperCase() : 'OTHER',
      designation: designation || '',
      organizationName: organizationName || '',
      documentType: documentType ? documentType.toUpperCase() : 'PASSPORT',
      documentNumber: documentNumber || '',
      declarationAccepted: !!declarationAccepted,
      passportPhotoUrl: passportPhotoUrl || null,
      signatureData: signatureUrl || null,
      membershipFeePaid: false,
      paymentStatus: 'PENDING'
    }})

    // send verification email (best effort)
    try {
      await sendVerificationEmail(email, verifyToken)
    } catch (e) {
      console.error('Failed sending verification email', e)
    }

    return NextResponse.json({ id: user.id, email: user.email })
  } catch (error) {
    console.error('Signup error', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
