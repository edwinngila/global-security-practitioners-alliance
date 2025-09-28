import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma/client'
import { authOptions } from '../auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const levelId = searchParams.get('levelId')

    const whereClause = levelId
      ? { levelId, isActive: true }
      : { isActive: true }

    const subTopics = await prisma.subTopic.findMany({
      where: whereClause,
      include: {
        contents: {
          orderBy: { orderIndex: 'asc' }
        },
        subTopicTest: true,
        level: {
          include: {
            module: true
          }
        }
      },
      orderBy: { orderIndex: 'asc' }
    })

    return NextResponse.json(subTopics)
  } catch (error) {
    console.error('Error fetching sub-topics:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { levelId, title, description, orderIndex, estimatedDuration, learningObjectives, readingMaterial } = body

    if (!levelId || !title) {
      return NextResponse.json({ error: 'levelId and title are required' }, { status: 400 })
    }

    // Check if user is master practitioner
    const userProfile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      include: { role: true }
    })

    if (userProfile?.role?.name !== 'master_practitioner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const subTopic = await prisma.subTopic.create({
      data: {
        levelId,
        title,
        description,
        orderIndex: orderIndex || 0,
        estimatedDuration,
        learningObjectives,
        // Temporarily commented out due to Prisma client sync issue
        // readingMaterial,
        // attachments: body.attachments || [],
        // externalLinks: body.externalLinks || []
      },
      include: {
        contents: true,
        subTopicTest: true
      }
    })

    return NextResponse.json(subTopic)
  } catch (error) {
    console.error('Error creating sub-topic:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}