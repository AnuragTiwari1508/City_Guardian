import { NextRequest, NextResponse } from 'next/server'
import { users } from '@/lib/user-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, userType } = body

    // Validate input
    if (!email || !password || !name || !userType) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Password validation (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    if (users.has(email)) {
      return NextResponse.json(
        { success: false, message: 'Account already exists with this email. Please login instead.' },
        { status: 409 }
      )
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      name,
      password,
      userType,
      createdAt: new Date().toISOString()
    }

    users.set(email, newUser)

    // Generate token
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: userWithoutPassword,
        token
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
