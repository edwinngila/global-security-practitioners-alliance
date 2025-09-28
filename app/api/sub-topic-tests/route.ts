import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma/client'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const subTopicId = searchParams.get('subTopicId')

    if (!subTopicId) {
      return NextResponse.json({ error: 'subTopicId is required' }, { status: 400 })
    }

    const test = await prisma.subTopicTest.findUnique({
      where: { subTopicId }
    })

    return NextResponse.json(test)
  } catch (error) {
    console.error('Error fetching sub-topic test:', error)
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
    const { subTopicId, title, description, questions, totalQuestions, passingScore, timeLimit, isActive } = body

    if (!subTopicId || !title) {
      return NextResponse.json({ error: 'subTopicId and title are required' }, { status: 400 })
    }

    // Check if user is master practitioner
    const userProfile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      include: { role: true }
    })

    if (userProfile?.role?.name !== 'master_practitioner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if test already exists for this sub-topic
    const existingTest = await prisma.subTopicTest.findUnique({
      where: { subTopicId }
    })

    if (existingTest) {
      return NextResponse.json({ error: 'Test already exists for this sub-topic' }, { status: 400 })
    }

    const test = await prisma.subTopicTest.create({
      data: {
        subTopicId,
        title,
        description,
        questions,
        totalQuestions,
        passingScore: passingScore || 70,
        timeLimit: timeLimit || 600,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(test)
  } catch (error) {
    console.error('Error creating sub-topic test:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}