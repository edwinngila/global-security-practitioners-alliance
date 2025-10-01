import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma/client'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const moduleId = url.searchParams.get('moduleId')

    if (!moduleId) return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })

    const levels = await prisma.level.findMany({
      where: {
        moduleId
      },
      orderBy: { orderIndex: 'asc' },
      include: {
        subTopics: {
          include: {
            _count: {
              select: { contents: true }
            }
          }
        }
      }
    })

    console.log('Fetching levels for moduleId:', moduleId, 'Found:', levels.length, 'Levels:', levels.map(l => ({ id: l.id, title: l.title })))

    return NextResponse.json(levels)
  } catch (error) {
    console.error('Error fetching levels:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}