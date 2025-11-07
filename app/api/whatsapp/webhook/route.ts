import { NextRequest, NextResponse } from 'next/server'

// Store WhatsApp conversations (use database in production)
const whatsappConversations = new Map<string, Array<{ 
  message: string
  timestamp: Date
  type: 'sent' | 'received'
  mediaUrl?: string
  mediaType?: string
}>>()

// Twilio WhatsApp Bot Webhook - Synced with Website Chatbot
// This endpoint receives messages from WhatsApp via Twilio

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const from = formData.get('From') as string
    const body = formData.get('Body') as string
    const numMedia = parseInt(formData.get('NumMedia') as string || '0')
    
    // Get media attachments
    const mediaUrl = numMedia > 0 ? formData.get('MediaUrl0') as string : undefined
    const mediaType = numMedia > 0 ? formData.get('MediaContentType0') as string : undefined
    
    console.log('WhatsApp message received from:', from)
    console.log('Message:', body)
    console.log('Media files:', numMedia, mediaUrl, mediaType)

    // Store incoming message in conversation history
    if (!whatsappConversations.has(from)) {
      whatsappConversations.set(from, [])
    }
    const conversation = whatsappConversations.get(from)!
    conversation.push({
      message: body || `[Media: ${mediaType}]`,
      timestamp: new Date(),
      type: 'received',
      mediaUrl,
      mediaType
    })

    // Get bot response based on user message (synced with website chatbot)
    const botResponse = getBotResponse(body?.toLowerCase() || '', mediaUrl, mediaType)

    // Store bot response
    conversation.push({
      message: botResponse,
      timestamp: new Date(),
      type: 'sent'
    })

    // Create TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(botResponse)}</Message>
</Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, I encountered an error. Please try again later.</Message>
</Response>`

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}

/**
 * GET /api/whatsapp/webhook?phone=xxx
 * Get WhatsApp conversation history (for website chatbot sync)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
  }

  const formattedPhone = phone.startsWith('whatsapp:') 
    ? phone 
    : `whatsapp:+${phone.replace(/\D/g, '')}`
  
  const conversation = whatsappConversations.get(formattedPhone) || []

  return NextResponse.json({
    success: true,
    messages: conversation,
    phone: formattedPhone
  })
}

// Bot response logic - Synced with website chatbot (/api/chat)
function getBotResponse(message: string, mediaUrl?: string, mediaType?: string): string {
  // Handle media uploads
  if (mediaUrl) {
    if (mediaType?.includes('image')) {
      return "✅ *Photo Received!*\n\nThank you for sending the image! Our team will review it shortly.\n\n🌐 Also chat on website:\ncityguardian.vercel.app\n\n📱 Track your report here on WhatsApp! I'll send updates."
    }
    if (mediaType?.includes('video')) {
      return "✅ *Video Received!*\n\nWe're analyzing the footage. Our team will investigate within 24 hours.\n\n🌐 Track progress at:\ncityguardian.vercel.app\n\n📱 I'll send updates here!"
    }
    return "✅ *File Received!*\n\nOur team will review it soon.\n\n🌐 Visit cityguardian.vercel.app for more options!"
  }

  if (!message) {
    return "Hi! 👋 I'm CityGuardian Bot.\n\n🤖 Same AI on:\n📱 WhatsApp (+14155238886)\n💬 Website chat (cityguardian.vercel.app)\n\nHow can I help?"
  }

  // Greetings
  if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
    return "👋 *Welcome to CityGuardian!*\n\nI'm your AI assistant available 24/7!\n\n✅ Report issues (send photos/videos)\n✅ Check air quality data\n✅ Track complaints\n✅ Contact support\n\n💬 Also chat on:\ncityguardian.vercel.app\n\nType 'help' for menu!"
  }
  
  // Environmental queries
  if (message.includes("environmental") || message.includes("sensor") || message.includes("air quality") || message.includes("aqi") || message.includes("pollution")) {
    return "🌍 *Environmental Monitoring*\n\nReal-time data:\n• Air Quality Index (AQI)\n• PM2.5 & PM10 levels\n• Temperature & Humidity\n• Noise pollution\n• Live weather widget\n\n📊 View at:\ncityguardian.vercel.app/environmental\n\n💬 Ask me anything!"
  }
  
  // Report issues
  if (message.includes("report") || message.includes("issue") || message.includes("problem") || message.includes("complaint")) {
    return "📋 *Report an Issue*\n\n*Via WhatsApp (here):*\n1. Take photo/video 📸\n2. Send it to this chat\n3. Add location details 📍\n\n*Via Website:*\ncityguardian.vercel.app/citizen/reports\n\n⏱️ Response: 24 hours\n📱 Updates sent here!"
  }
  
  // Contact/Support
  if (message.includes("contact") || message.includes("support")) {
  return "📞 *Contact CityGuardian*\n\n� *WhatsApp:* You're here! (+14155238886)\n🌐 *Website:* cityguardian.vercel.app\n� *Live Chat:* Chatbot on website\n☎️ *Voice:* 'Call Support' button\n\n✅ Same AI everywhere!\n✅ Synced conversations!\n\nHow can I assist?"
  }
  
  // Help menu
  if (message.includes("help") || message.includes("menu") || message.includes("options")) {
    return "🆘 *Quick Menu*\n\n1️⃣ *'report'* - Report issues\n2️⃣ *'environmental'* - Check AQI\n3️⃣ *'track'* - View status\n4️⃣ *'contact'* - Get support\n5️⃣ *Send media* - Upload photos/videos\n\n🌐 *Website:*\ncityguardian.vercel.app\n\n✨ Same AI, multiple channels!"
  }
  
  // Photo/Video instructions
  if (message.includes("photo") || message.includes("image") || message.includes("video") || message.includes("upload")) {
    return "📸 *Send Photos & Videos*\n\nYou can send media:\n\n*On WhatsApp:*\n• Tap attachment �\n• Select photo/video\n• Send directly!\n\n*On Website:*\n• Click chatbot icon\n• Click paperclip 📎\n• Upload & send\n\n✅ Max 10MB\n✅ Instant processing!"
  }

  // Track status
  if (message.includes("status") || message.includes("track")) {
  return "🔍 *Track Your Report*\n\n*Method 1:* Send reference # here\n*Method 2:* Visit cityguardian.vercel.app/citizen/dashboard\n\n💡 Updates sent to WhatsApp!\n\n📱 Save +14155238886 for notifications!"
  }
  
  // Thank you
  if (message.includes("thank")) {
    return "😊 You're welcome!\n\nAvailable 24/7 on:\n\n📱 WhatsApp (here)\n💬 Website chat\n☎️ Voice call\n\nAll synced together!"
  }

  // Default response
  return "🤖 *CityGuardian AI*\n\nI can help with:\n\n📸 Report issues (photos/videos)\n📊 Environmental data (AQI, weather)\n📋 Track reports\n💬 Support\n\n🌐 Also on:\ncityguardian.vercel.app\n\nType 'help' or ask anything!"
}

// Escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case "'": return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}
