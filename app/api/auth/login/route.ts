import { NextRequest, NextResponse } from 'next/server'
import { users } from '@/lib/user-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = users.get(email)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Account not found. Please sign up first.' },
        { status: 401 }
      )
    }

    // Check password
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password. Please try again.' },
        { status: 401 }
      )
    }

    // Generate token
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
        token
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
