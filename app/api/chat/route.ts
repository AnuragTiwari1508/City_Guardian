import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

const client = twilio(accountSid, authToken);

// In-memory storage for conversations (use database in production)
const conversations = new Map<string, Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>();

/**
 * POST /api/chat
 * Handle messages from website chatbot
 * Optionally forward to WhatsApp
 */
export async function POST(req: NextRequest) {
  try {
    const { message, userId, sendToWhatsApp, phoneNumber, fileUrl, fileType } = await req.json();

    if (!message && !fileUrl) {
      return NextResponse.json({ error: 'Message or file required' }, { status: 400 });
    }

    // Store conversation
    if (!conversations.has(userId)) {
      conversations.set(userId, []);
    }
    const userConversation = conversations.get(userId)!;
    
    // Add user message
    userConversation.push({
      role: 'user',
      content: message || `[${fileType}]`,
      timestamp: new Date()
    });

    // Generate AI response based on keywords
    const botResponse = generateBotResponse(message, fileUrl, fileType);
    
    // Add bot response
    userConversation.push({
      role: 'assistant',
      content: botResponse,
      timestamp: new Date()
    });

    // If user wants to send to WhatsApp
    if (sendToWhatsApp && phoneNumber) {
      try {
        // Send message to user's WhatsApp
        const formattedPhone = phoneNumber.startsWith('whatsapp:') 
          ? phoneNumber 
          : `whatsapp:+${phoneNumber.replace(/\D/g, '')}`;

        if (fileUrl) {
          // Send media message
          await client.messages.create({
            from: twilioWhatsAppNumber,
            to: formattedPhone,
            body: message || 'You have a new notification from CityGuardian',
            mediaUrl: [fileUrl]
          });
        } else {
          // Send text message
          await client.messages.create({
            from: twilioWhatsAppNumber,
            to: formattedPhone,
            body: message
          });
        }
      } catch (twilioError) {
        console.error('Failed to send WhatsApp message:', twilioError);
        // Don't fail the request if WhatsApp fails
      }
    }

    return NextResponse.json({
      success: true,
      response: botResponse,
      conversationHistory: userConversation.slice(-10) // Last 10 messages
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat?userId=xxx
 * Get conversation history
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const userConversation = conversations.get(userId) || [];

  return NextResponse.json({
    success: true,
    messages: userConversation
  });
}

/**
 * Generate intelligent bot responses
 */
function generateBotResponse(message: string, fileUrl?: string, fileType?: string): string {
  if (!message) message = '';
  const lowerMessage = message.toLowerCase();

  // Handle file uploads
  if (fileUrl) {
    if (fileType?.startsWith('image')) {
      return "✅ Thank you for sharing the image! Our team will review it shortly. You can also report this issue on WhatsApp for faster processing.";
    }
    if (fileType?.startsWith('video')) {
      return "✅ Video received! We're analyzing the footage. Our environmental team will investigate this issue within 24 hours.";
    }
  }

  // Environmental queries
  if (lowerMessage.includes('pollution') || lowerMessage.includes('air quality') || lowerMessage.includes('aqi')) {
  return "🌍 **Air Quality Monitoring**\n\nCurrent AQI levels are being monitored in real-time. Visit the Environmental Dashboard for detailed metrics, or send 'environmental' to our WhatsApp bot (+14155238886) for instant updates!";
  }

  if (lowerMessage.includes('report') || lowerMessage.includes('issue') || lowerMessage.includes('complaint')) {
  return "📋 **Report an Issue**\n\n1. Take a photo/video of the issue\n2. Upload it here or send to WhatsApp: +14155238886\n3. Our team will investigate within 24-48 hours\n\nYou can also call us directly using the 'Call Support' button!";
  }

  if (lowerMessage.includes('status') || lowerMessage.includes('track')) {
  return "🔍 **Track Your Report**\n\nTo check your complaint status:\n1. Visit the Citizen Dashboard\n2. Go to 'My Reports'\n3. Or send your reference number to WhatsApp: +14155238886\n\nWe'll send real-time updates on WhatsApp!";
  }

  if (lowerMessage.includes('water') || lowerMessage.includes('drainage')) {
  return "💧 **Water & Drainage Issues**\n\nFor water-related complaints:\n- Take a clear photo of the issue\n- Share your location\n- Upload here or send to WhatsApp: +14155238886\n\nEmergency? Call us using the 'Call Support' button!";
  }

  if (lowerMessage.includes('garbage') || lowerMessage.includes('waste') || lowerMessage.includes('trash')) {
  return "🗑️ **Waste Management**\n\nReport garbage issues:\n1. Photo of the location\n2. Describe the problem\n3. Send to WhatsApp: +14155238886\n\nWe'll dispatch a cleanup team ASAP!";
  }

  if (lowerMessage.includes('whatsapp')) {
  return "📱 **WhatsApp Bot**\n\nConnect with us on WhatsApp!\n\n**Number:** +14155238886\n\n✅ 24/7 automated responses\n✅ Send photos/videos\n✅ Track complaints\n✅ Get real-time updates\n\nJust save the number and start chatting!";
  }

  if (lowerMessage.includes('call') || lowerMessage.includes('phone') || lowerMessage.includes('contact')) {
  return "📞 **Contact Support**\n\n1. **Call:** Click the 'Call Support' button below\n2. **WhatsApp:** +14155238886\n3. **Chat:** Right here! I'm available 24/7\n\nChoose what works best for you!";
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "👋 **Welcome to CityGuardian!**\n\nI'm your AI assistant. I can help you with:\n\n✅ Environmental monitoring\n✅ Report issues (with photos/videos)\n✅ Track complaints\n✅ Contact support\n\nHow can I assist you today?";
  }

  if (lowerMessage.includes('help')) {
  return "🆘 **Quick Help Menu**\n\n1️⃣ **Report Issue** - Upload photo/video\n2️⃣ **Track Status** - Check your complaints\n3️⃣ **WhatsApp** - Chat on +14155238886\n4️⃣ **Call Support** - Speak to our team\n5️⃣ **Environmental Data** - View AQI & metrics\n\nWhat do you need help with?";
  }

  if (lowerMessage.includes('thank')) {
  return "😊 You're welcome! Feel free to reach out anytime on:\n\n💬 **Website Chat** (here)\n📱 **WhatsApp:** +14155238886\n📞 **Call:** Use 'Call Support' button\n\nWe're here to help!";
  }

  // Default response
  return "🤖 I'm here to help! You can:\n\n📸 **Upload photos/videos** of issues\n📱 **Connect on WhatsApp:** +14155238886\n📞 **Call support** using the button below\n📊 **Check environmental data** on the dashboard\n\nWhat would you like to do?";
}
