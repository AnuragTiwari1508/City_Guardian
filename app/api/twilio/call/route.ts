import { NextRequest, NextResponse } from 'next/server'

// You need to install twilio: pnpm add twilio
// Then add these to your .env.local file:
// TWILIO_ACCOUNT_SID=your_account_sid
// TWILIO_AUTH_TOKEN=your_auth_token
// TWILIO_PHONE_NUMBER=your_twilio_phone_number

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json()

    // Validate phone number
    if (!to) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'Twilio is not configured. Please use WhatsApp instead.' },
        { status: 503 }
      )
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      return NextResponse.json(
        { success: false, message: 'Voice calls are not configured on the server. Please use the WhatsApp bot (+14155238886) or contact support.' },
        { status: 503 }
      )
    }
    

    const twilio = require('twilio')
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const call = await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER
    })

    return NextResponse.json({ 
      success: true, 
      callSid: call.sid,
      message: 'Call initiated successfully' 
    })

  } catch (error: any) {
    console.error('Twilio API error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to initiate call. Please use WhatsApp instead.' },
      { status: 500 }
    )
  }
}
