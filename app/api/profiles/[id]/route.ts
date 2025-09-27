import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma/client'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const profile = await prisma.profile.findUnique({ where: { id: params.id } })
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can update this profile (only their own or admin)
    if (session.user.id !== params.id) {
      // Check if user is admin
      const userProfile = await prisma.profile.findUnique({
        where: { id: session.user.id },
        include: { role: true }
      })
      if (userProfile?.role?.name !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    console.log('Profile update request body:', body)

    const {
      first_name,
      last_name,
      phone_number,
      date_of_birth,
      nationality,
      gender,
      designation,
      organization_name,
      document_type,
      document_number
    } = body

    console.log('Gender value received:', gender, 'Type:', typeof gender)

    // Convert gender to enum value
    let genderEnum: any = undefined
    if (gender && typeof gender === 'string' && gender.trim() !== '') {
      genderEnum = gender.toUpperCase()
      console.log('Gender enum converted to:', genderEnum)
    }

    // Convert documentType to enum value
    const documentTypeMap: { [key: string]: string } = {
      'passport': 'PASSPORT',
      'national_id': 'NATIONAL_ID',
      'drivers_license': 'DRIVERS_LICENSE'
    }
    const documentTypeEnum = document_type ? documentTypeMap[document_type] as any : undefined
    console.log('Document type enum:', documentTypeEnum)

    console.log('Updating profile with data:', {
      firstName: first_name,
      lastName: last_name,
      phoneNumber: phone_number,
      dateOfBirth: date_of_birth ? new Date(date_of_birth) : undefined,
      nationality: nationality,
      gender: genderEnum,
      designation: designation,
      organizationName: organization_name,
      documentType: documentTypeEnum,
      documentNumber: document_number,
    })

    const updatedProfile = await prisma.profile.update({
      where: { id: params.id },
      data: {
        firstName: first_name,
        lastName: last_name,
        phoneNumber: phone_number,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : undefined,
        nationality: nationality,
        gender: genderEnum,
        designation: designation,
        organizationName: organization_name,
        documentType: documentTypeEnum,
        documentNumber: document_number,
        updatedAt: new Date()
      }
    })

    console.log('Profile updated successfully:', updatedProfile.id)
    return NextResponse.json(updatedProfile)
  } catch (error: any) {
    console.error('Error updating profile:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
}
