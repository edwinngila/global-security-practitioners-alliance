import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma/client'
import { authOptions } from '../auth/[...nextauth]/route'

// GET /api/user-enrollments - Get user's module enrollments
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 })

    // Check if user is requesting their own data or is admin/master practitioner
    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      include: { role: true }
    })

    const isAdminOrMaster = ['admin', 'master_practitioner'].includes(profile?.role?.name || '')
    if (userId !== session.user.id && !isAdminOrMaster) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const enrollments = await prisma.moduleEnrollment.findMany({
      where: {
        userId,
        // Include both completed and pending enrollments for the user
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            difficultyLevel: true,
            estimatedDuration: true,
            instructorName: true,
            price: true,
            currency: true
          }
        }
      },
      orderBy: { enrollmentDate: 'desc' }
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('Error fetching user enrollments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/user-enrollments - Create a new enrollment (for payment completion)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { moduleId, paymentReference, paymentStatus = 'COMPLETED', examDate } = body

    if (!moduleId) return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })

    // Check if user already has an enrollment for this module
    const existingEnrollment = await prisma.moduleEnrollment.findUnique({
      where: {
        userId_moduleId: {
          userId: session.user.id,
          moduleId
        }
      }
    })

    let enrollment

    if (existingEnrollment) {
      // Update existing enrollment (for payment completion)
      enrollment = await prisma.moduleEnrollment.update({
        where: {
          id: existingEnrollment.id
        },
        data: {
          paymentStatus: paymentStatus,
          paymentReference: paymentReference || existingEnrollment.paymentReference,
          examDate: examDate ? new Date(examDate) : existingEnrollment.examDate,
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              difficultyLevel: true,
              estimatedDuration: true,
              instructorName: true,
              price: true,
              currency: true
            }
          }
        }
      })
    } else {
      // Create new enrollment (for initial enrollment)
      enrollment = await prisma.moduleEnrollment.create({
        data: {
          userId: session.user.id,
          moduleId,
          paymentStatus: paymentStatus,
          paymentReference: paymentReference || null,
          examDate: examDate ? new Date(examDate) : null,
          progressPercentage: 0
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              difficultyLevel: true,
              estimatedDuration: true,
              instructorName: true,
              price: true,
              currency: true
            }
          }
        }
      })
    }

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error('Error creating enrollment:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}