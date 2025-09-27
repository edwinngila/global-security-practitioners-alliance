import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getUserFromAuthHeader } from '@/lib/server/auth'

// GET /api/tests/questions - Get all test questions
export async function GET(request: Request) {
  try {
    const authUser = getUserFromAuthHeader(request)
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // determine role-based visibility
  let where: any = { isActive: true }
  const authProfile = await prisma.profile.findUnique({ where: { id: authUser.id }, include: { role: true } })
  if (authProfile?.role?.name === 'admin') where = {}

  const questions = await prisma.testQuestion.findMany({ where, orderBy: { createdAt: 'desc' }, include: { options: true } })
    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error fetching test questions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/tests/questions - Create a new test question (admin only)
export async function POST(request: Request) {
  try {
  const authUser = getUserFromAuthHeader(request)
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const authProfile = await prisma.profile.findUnique({ where: { id: authUser.id }, include: { role: true } })
  if (!authProfile || authProfile.role?.name !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    // body can include options array
    const { options, ...questionData } = body
    const question = await prisma.testQuestion.create({ data: { ...questionData, options: { create: options || [] } }, include: { options: true } })
    return NextResponse.json(question)
  } catch (error) {
    console.error('Error creating test question:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}