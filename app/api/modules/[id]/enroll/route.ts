import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getUserFromAuthHeader } from '@/lib/server/auth'

// POST /api/modules/[id]/enroll - Enroll in a module
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getUserFromAuthHeader(request)
    if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.moduleEnrollment.findUnique({ where: { userId_moduleId: { userId: authUser.id, moduleId: params.id } } })
    if (existing) return NextResponse.json({ error: 'Already enrolled in this module' }, { status: 400 })

  const enrollment = await prisma.moduleEnrollment.create({ data: { userId: authUser.id, moduleId: params.id, progressPercentage: 0, completedAt: null, paymentStatus: 'PENDING' } })
    return NextResponse.json(enrollment)
  } catch (error) {
    console.error('Error enrolling in module:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/modules/[id]/enroll - Update enrollment progress
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getUserFromAuthHeader(request)
    if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { progress, completed } = body

    const updated = await prisma.moduleEnrollment.update({
      where: { userId_moduleId: { userId: authUser.id, moduleId: params.id } },
      data: { progressPercentage: progress ?? 0, completedAt: completed ? new Date() : null }
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating enrollment:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}