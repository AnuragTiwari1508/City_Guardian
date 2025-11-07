# 📱 WhatsApp Bot Setup Guide

## ✅ What's Been Updated

### 1. **Chatbot UI - Now Matches Website Theme!**
- ✅ Dark background with green neon accents
- ✅ Matrix/Cyberpunk aesthetic matching environmental dashboard
- ✅ Green scanline effects and grid background
- ✅ Mono font for that terminal/hacker vibe
- ✅ Green buttons and borders

### 2. **File Upload Feature**
- ✅ Attach button (📎) to upload images and videos
- ✅ File preview before sending
- ✅ Max 10MB file size
- ✅ Supports images and videos
- ✅ Shows file previews in chat

### 3. **WhatsApp Bot Integration**
- ✅ Webhook endpoint created (`/api/whatsapp/webhook`)
- ✅ Smart bot responses
- ✅ Handles text messages
- ✅ Can receive photos/videos from users
- ✅ 24/7 automated responses

---

## 🤖 WhatsApp Bot Setup (Step-by-Step)

### Step 1: Get a Twilio WhatsApp Number

1. **Go to:** https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. **Click:** "Get your Twilio WhatsApp Sandbox"
3. **Follow instructions:**
   - Send a WhatsApp message to the Twilio sandbox number
   - Message format: `join <your-code>`
   - Example: Send "join green-tiger" to +14155238886

4. **Test it:** You should get a welcome message back

---

### Step 2: Configure Webhook URL

Once your site is deployed on Vercel:

1. **Go to:** https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
2. **Under "Sandbox Configuration":**
   - **When a message comes in:** 
     ```
     https://cityguardian.vercel.app/api/whatsapp/webhook
     ```
   - **HTTP Method:** POST
3. **Click:** Save

---

### Step 3: Test the WhatsApp Bot

1. **Send a message to your Twilio WhatsApp number**
2. **Try these:**
   - "hello" → Get greeting
   - "help" → See all options
   - "environmental" → Get monitoring info
   - "report issue" → Learn how to report
   - Send a photo → Bot confirms receipt

3. **Test media upload:**
   - Take a photo in WhatsApp
   - Send it to the bot
   - Bot will acknowledge receipt

---

## 📱 WhatsApp Bot Features

### Smart Responses:
- ✅ Greetings (hello, hi, hey)
- ✅ Environmental data queries
- ✅ Issue reporting guidance
- ✅ Contact information
- ✅ Photo/video upload instructions
- ✅ Status check guidance

### Media Handling:
- ✅ Receives photos from users
- ✅ Receives videos from users
- ✅ Stores media URLs (you can process them)
- ✅ Confirms receipt automatically

---

## 🎨 Updated Chatbot Design

### New Theme (Matches Environmental Dashboard):
```
Background: Black (#000000)
Primary Text: Green (#00FF99)
Borders: Green with glow effect
Buttons: Bright green (#22D366 for WhatsApp, #00FF99 for others)
Font: Monospace (terminal style)
Effects: Scanlines, grid pattern, pulse animations
```

### File Upload UI:
- Paperclip button (📎) on the left
- File preview shows image/video thumbnail
- Remove button (X) to cancel
- File name truncated for long names

---

## 🔧 For Production (Your Action Required)

### Option A: Use Twilio WhatsApp Sandbox (Quick Test)
**Pros:** Free, works immediately  
**Cons:** Users must "join" first, not production-ready

**Setup:**
1. Already done above
2. Users send "join <code>" first time
3. Then they can chat normally

---

### Option B: Get Approved WhatsApp Business Account (Production)
**Pros:** Professional, your own number, no "join" needed  
**Cons:** Takes 1-2 weeks for approval

**Setup:**
1. **Apply for WhatsApp Business API:**
   - Go to: https://www.twilio.com/docs/whatsapp/tutorial/connect-number-business-profile
   - Request WhatsApp Business approval
   - Provide business details
   - Wait for Meta approval (~1-2 weeks)

2. **Once approved:**
   - Get your dedicated WhatsApp number
   - Configure webhook (same as sandbox)
   - Users can message directly without "join"

---

## 📝 Environment Variables Needed

Add to Vercel (use your Twilio credentials):

```
TWILIO_ACCOUNT_SID=<your_twilio_account_sid>
TWILIO_AUTH_TOKEN=<your_twilio_auth_token>
TWILIO_PHONE_NUMBER=+<your_twilio_number>
```

**Also add (new):**
```
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
# (This is the Twilio sandbox number, or your approved number)
```

**Note:** Your actual credentials are stored in `.env.local` (already configured)

---

## 🧪 Testing Checklist

### Website Chatbot:
- [ ] Open chatbot (bottom-right button)
- [ ] See dark theme with green accents
- [ ] Type a message (text is visible)
- [ ] Click paperclip button
- [ ] Upload an image
- [ ] See image preview
- [ ] Send message with image
- [ ] Click WhatsApp button (opens WhatsApp)

### WhatsApp Bot:
- [ ] Join Twilio sandbox (send "join" message)
- [ ] Send "hello" → Get greeting
- [ ] Send "help" → See options
- [ ] Send a photo → Get confirmation
- [ ] Ask about environmental data
- [ ] Ask about reporting issues

---

## 🎯 What Users Can Do

### On Website:
1. **Chat with bot** (text)
2. **Upload photos/videos** (attach button)
3. **Get smart responses**
4. **Click WhatsApp** button → Opens WhatsApp
5. **Request callback** (Twilio call)

### On WhatsApp:
1. **Chat 24/7** with automated bot
2. **Send photos** of issues
3. **Send videos** of problems
4. **Get instant responses**
5. **Track complaints**
6. **Contact support team**

---

## 📞 Next Steps for You

1. **Test website chatbot:**
   ```bash
   pnpm dev
   # Open http://localhost:3000
   # Click chatbot, try uploading image
   ```

2. **Set up WhatsApp sandbox:**
   - Go to Twilio console
   - Join WhatsApp sandbox
   - Configure webhook URL

3. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "feat: Update chatbot theme and add WhatsApp bot"
   git push origin main
   ```

4. **Add webhook URL in Twilio:**
   - Wait for Vercel deployment
   - Add webhook: `https://cityguardian.vercel.app/api/whatsapp/webhook`

5. **Test WhatsApp bot:**
   - Send messages
   - Upload photos
   - Verify responses

---

## 💡 Tips

- **Sandbox limitations:** Users must "join" first
- **File size:** Max 10MB for uploads
- **Media types:** Images (jpg, png, gif), Videos (mp4, mov)
- **Response time:** Instant for automated responses
- **24/7 availability:** Bot never sleeps!

---

## 🆘 Need Help?

**Common Issues:**

1. **"Can't upload file"**
   - Check file size (<10MB)
   - Ensure it's image/video format

2. **"WhatsApp bot not responding"**
   - Verify webhook URL is correct
   - Check Twilio console logs
   - Ensure you've "joined" sandbox

3. **"Dark theme not showing"**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)

---

**The chatbot now looks amazing with your website theme! 🎮**  
**WhatsApp bot is ready to deploy! 📱**

Let me know if you want to test or need any adjustments!
