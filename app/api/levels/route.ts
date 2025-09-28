import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma/client'
import { authOptions } from '../auth/[...nextauth]/route'

// GET /api/levels - Get all levels or filter by moduleId
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const moduleId = url.searchParams.get('moduleId')

    const whereClause = moduleId ? { moduleId } : {}

    const levels = await prisma.level.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        module: { select: { title: true } },
        contents: { select: { id: true } },
        levelTest: { select: { id: true } }
      }
    })

    return NextResponse.json(levels)
  } catch (error) {
    console.error('Error fetching levels:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/levels - Create a new level (master practitioner only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await prisma.profile.findUnique({ where: { id: session.user.id }, include: { role: true } })
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const roleName = profile.role?.name || ''
    if (roleName !== 'master_practitioner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { learningObjectives, ...levelData } = body

    // Create the level first
    const level = await prisma.level.create({
      data: {
        ...levelData,
        learningObjectives: learningObjectives ? learningObjectives : null
      }
    })

    // Learning objectives are stored but sub-topics are created on-demand when clicked

    return NextResponse.json(level)
  } catch (error) {
    console.error('Error creating level:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/levels - Update a level (master practitioner only)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await prisma.profile.findUnique({ where: { id: session.user.id }, include: { role: true } })
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const roleName = profile.role?.name || ''
    if (roleName !== 'master_practitioner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) return NextResponse.json({ error: 'Level ID is required' }, { status: 400 })

    const level = await prisma.level.update({
      where: { id },
      data: {
        ...updateData,
        learningObjectives: updateData.learningObjectives ? updateData.learningObjectives : undefined
      }
    })
    return NextResponse.json(level)
  } catch (error) {
    console.error('Error updating level:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/levels - Delete a level (master practitioner only)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await prisma.profile.findUnique({ where: { id: session.user.id }, include: { role: true } })
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const roleName = profile.role?.name || ''
    if (roleName !== 'master_practitioner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Level ID is required' }, { status: 400 })

    await prisma.level.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting level:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}