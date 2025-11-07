# 💬 Floating Chatbot Setup Guide

## ✅ What's Been Implemented

### 1. **Floating Chatbot Component** (`components/floating-chatbot.tsx`)
- ✅ Beautiful floating chat button (bottom-right corner)
- ✅ Full chat interface with message history
- ✅ Bot responses based on keywords
- ✅ WhatsApp integration (ready to use)
- ✅ Twilio call integration (needs setup)
- ✅ Typing indicators and smooth animations
- ✅ Mobile responsive design

### 2. **Twilio API Endpoint** (`app/api/twilio/call/route.ts`)
- ✅ Backend API for initiating calls
- ⚠️ Needs Twilio credentials to activate

### 3. **Global Integration** (`app/layout.tsx`)
- ✅ Chatbot added to all pages automatically
- ✅ Shows on every route in your app

---

## 🔧 Setup Required (Your Action Needed)

### Step 1: WhatsApp Integration (5 minutes)

**Update the phone number in `components/floating-chatbot.tsx`:**

```typescript
// Line ~92 in floating-chatbot.tsx
const openWhatsApp = () => {
  const phoneNumber = "919876543210" // ⚠️ CHANGE THIS
  // Format: Country code + number (no spaces, no +)
  // Example: 
  // - India: 919876543210
  // - USA: 15551234567
  // - UK: 447700900000
  
  const message = encodeURIComponent("Hi! I need help with CityGuardian.")
  window.open(\`https://wa.me/\${phoneNumber}?text=\${message}\`, "_blank")
}
```

**How to get WhatsApp Business Number:**
1. Download **WhatsApp Business** app
2. Set up your business profile
3. Use that number in the code above
4. Or use your regular WhatsApp number temporarily

---

### Step 2: Twilio Setup (15-20 minutes)

**A. Create Twilio Account**
1. Go to https://www.twilio.com/try-twilio
2. Sign up for free account (you get $15 free credit)
3. Verify your phone number

**B. Get Twilio Credentials**
1. From Twilio Console: https://console.twilio.com/
2. Copy these three values:
   - **Account SID** (looks like: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
   - **Auth Token** (click "Show" to reveal)
   - **Twilio Phone Number** (buy one or use trial number)

**C. Create `.env.local` file**

Create this file in your project root:

```bash
# .env.local
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

**⚠️ Important:** Add `.env.local` to `.gitignore` (already done)

**D. Install Twilio SDK**

```bash
pnpm add twilio
```

**E. Update Twilio API Endpoint**

In `app/api/twilio/call/route.ts`, **uncomment** lines 20-38:

```typescript
// Remove the /* and */ comments to activate
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
```

**F. Create TwiML for Call Script (Optional)**

Create `app/api/twilio/twiml/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Hello! Thank you for contacting City Guardian. 
    A support representative will be with you shortly.
  </Say>
  <Pause length="1"/>
  <Say voice="alice">
    Please stay on the line.
  </Say>
</Response>`

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}
```

Then update the call URL in the API:
```typescript
url: 'https://your-domain.vercel.app/api/twilio/twiml',
```

---

## 🎨 Customization Options

### Change Chatbot Colors

In `components/floating-chatbot.tsx`:

```typescript
// Line ~195 - Floating button color
className="... bg-green-500 hover:bg-green-600 ..."
// Change to: bg-blue-500, bg-purple-500, etc.

// Line ~218 - Header gradient
className="bg-gradient-to-r from-green-500 to-green-600 ..."
// Change to your brand colors
```

### Add More Bot Responses

In `components/floating-chatbot.tsx`, update `getBotResponse` function:

```typescript
const getBotResponse = (userMessage: string): string => {
  const msg = userMessage.toLowerCase()
  
  // Add your custom responses
  if (msg.includes("pricing") || msg.includes("cost")) {
    return "Our pricing starts at $X/month. Would you like to schedule a demo?"
  }
  
  if (msg.includes("demo")) {
    return "Great! Please contact us on WhatsApp to schedule a demo."
  }
  
  // ... existing responses
}
```

### Change Chatbot Position

```typescript
// Bottom-right (default)
className="fixed bottom-6 right-6 ..."

// Bottom-left
className="fixed bottom-6 left-6 ..."

// Top-right
className="fixed top-20 right-6 ..."
```

---

## 📱 Features Overview

### Current Features:
- ✅ **Floating button** with pulse animation
- ✅ **Smart bot responses** based on keywords
- ✅ **WhatsApp quick action** button
- ✅ **Twilio call** button (needs setup)
- ✅ **Message history** with timestamps
- ✅ **Typing indicators** for bot
- ✅ **Auto-scroll** to latest message
- ✅ **Mobile responsive**
- ✅ **Enter key** to send messages

### Quick Contact Options:
1. **WhatsApp** - Opens WhatsApp chat (works immediately after phone number update)
2. **Call Me** - Initiates Twilio call (needs Twilio setup)

---

## 🧪 Testing

### Test WhatsApp Integration:
1. Update phone number in code
2. Deploy or run locally: `pnpm dev`
3. Open any page
4. Click chatbot button (bottom-right)
5. Click "WhatsApp" button
6. Should open WhatsApp with pre-filled message ✅

### Test Twilio (After Setup):
1. Complete Twilio setup above
2. Click "Call Me" button
3. Enter phone number (you'll need to add input field)
4. Should receive a call ✅

---

## 🚀 Deployment Checklist

- [ ] Update WhatsApp phone number
- [ ] Set up Twilio account (if using calls)
- [ ] Add Twilio credentials to Vercel environment variables
- [ ] Install `pnpm add twilio`
- [ ] Uncomment Twilio code in API route
- [ ] Test on localhost
- [ ] Deploy to Vercel
- [ ] Test on production

---

## 🔐 Vercel Environment Variables

If using Twilio, add these to Vercel:

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add:
   - `TWILIO_ACCOUNT_SID` = your_account_sid
   - `TWILIO_AUTH_TOKEN` = your_auth_token
   - `TWILIO_PHONE_NUMBER` = +15551234567

---

## 📞 What You Need to Provide

### Immediate (WhatsApp):
- ✅ Your WhatsApp Business phone number (with country code)

### Optional (Twilio Calls):
- ⏳ Twilio Account SID
- ⏳ Twilio Auth Token
- ⏳ Twilio Phone Number

---

## 💡 Next Steps

1. **Update WhatsApp number** in `floating-chatbot.tsx` line 92
2. **Test locally**: `pnpm dev`
3. **Decide if you want Twilio** calls feature
4. **If yes**: Follow Step 2 above for Twilio setup
5. **If no**: Remove "Call Me" button or disable it
6. **Deploy**: Commit and push to GitHub

---

## 🎯 Quick Start Commands

```bash
# Test locally
pnpm dev

# Install Twilio (if using calls)
pnpm add twilio

# Create .env.local file
touch .env.local
# Then add Twilio credentials

# Commit changes
git add .
git commit -m "feat: Add floating chatbot with WhatsApp and Twilio integration"
git push origin main
```

---

## 🆘 Need Help?

**Where you need to act:**
1. ⚠️ **Line 92** of `floating-chatbot.tsx` - Add your WhatsApp number
2. ⚠️ **Create `.env.local`** file - Add Twilio credentials (if using calls)
3. ⚠️ **Install Twilio** - Run `pnpm add twilio` (if using calls)
4. ⚠️ **Uncomment code** in `app/api/twilio/call/route.ts` (if using calls)

**What's already done:**
- ✅ Chatbot UI component
- ✅ Message handling
- ✅ WhatsApp integration (just needs phone number)
- ✅ Twilio API endpoint (just needs credentials)
- ✅ Global integration in layout

---

**Let me know which phone number to use for WhatsApp, and if you want to set up Twilio calls!** 📱
