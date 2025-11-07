"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Phone, FileText, Paperclip, Image as ImageIcon, Video, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  fileUrl?: string
  fileName?: string
  fileType?: "image" | "video" | "document" | "pdf" | "other"
}

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! 👋 How can I help you today?",
      sender: "bot",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Bot responses based on keywords
  const getBotResponse = (userMessage: string, hasFile?: boolean, fileType?: string): string => {
    const msg = userMessage.toLowerCase()
    
    // Handle file uploads
    if (hasFile) {
      if (fileType?.startsWith('image')) {
        return "✅ Image received! Our team will review it and get back to you soon. You can also visit the Citizen Dashboard to track your report."
      }
      if (fileType?.startsWith('video')) {
        return "✅ Video received! We're analyzing the footage. Our team will investigate within 24 hours. Track your report on the Citizen Dashboard."
      }
      if (fileType?.includes('pdf') || fileType?.includes('document')) {
        return "✅ Document received! Our team will review the file and respond accordingly. Check the Citizen Dashboard for updates."
      }
      return "✅ File received! We've got your submission. Our team will process it shortly. Visit the Citizen Dashboard to track progress."
    }
    
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      return "👋 Hello! Welcome to CityGuardian.\n\nI can help you with:\n📊 Environmental monitoring\n📋 Report issues (with photos/videos/documents)\n📞 Contact support\n🌍 Check air quality data\n\nHow can I assist you today?"
    }
    if (msg.includes("environmental") || msg.includes("sensor") || msg.includes("air quality") || msg.includes("aqi")) {
      return "🌍 **Environmental Monitoring**\n\nView real-time data:\n• Air Quality Index (AQI)\n• Temperature & Humidity\n• PM2.5 & PM10 levels\n• Noise pollution\n• Live weather updates\n\n📊 Visit: /environmental page"
    }
    if (msg.includes("report") || msg.includes("issue") || msg.includes("problem") || msg.includes("complaint")) {
      return "📋 **Report an Issue**\n\n1. Go to Citizen Dashboard → Reports\n2. Upload photos/videos/documents\n3. Use current location feature\n4. Our team responds within 24-48 hours\n\nOr attach files right here in chat!"
    }
    if (msg.includes("upload") || msg.includes("file") || msg.includes("photo") || msg.includes("document")) {
      return "📎 **File Upload**\n\nYou can attach:\n• Images (JPG, PNG, GIF)\n• Videos (MP4, MOV, AVI)\n• Documents (PDF, DOC, DOCX)\n• Spreadsheets (XLS, XLSX)\n• Max size: 25MB\n\nClick the 📎 button below to attach!"
    }
    if (msg.includes("location")) {
      return "📍 **Location Feature**\n\nWhen reporting issues:\n• Click 'Use Current Location' in the form\n• We'll automatically capture your GPS coordinates\n• Helps us respond faster and more accurately!\n\nVisit: Citizen Dashboard → Reports"
    }
    if (msg.includes("contact") || msg.includes("support") || msg.includes("help")) {
      return "📞 **Contact Support**\n\n1. **Chat:** Right here! I'm available 24/7\n2. **Call:** Click 'Request Call' button below\n3. **Email:** support@cityguardian.com\n4. **Dashboard:** Visit Citizen Portal\n\nHow can I help you today?"
    }
    if (msg.includes("track") || msg.includes("status")) {
      return "🔍 **Track Your Reports**\n\nTo check complaint status:\n1. Go to Citizen Dashboard\n2. Click 'My Reports'\n3. View real-time updates\n4. Get notifications\n\nAll your submissions are tracked!"
    }
    if (msg.includes("thank")) {
      return "😊 You're welcome! Feel free to reach out anytime.\n\n💬 I'm here 24/7 to help!\n📱 Use the chat for quick questions\n� Or request a call for urgent matters"
    }
    
    return "🤖 **CityGuardian Assistant**\n\nI can help you with:\n\n📸 Upload photos/videos/documents\n📊 Check environmental data\n📋 Report issues with location\n🔍 Track your complaints\n📞 Contact support team\n\nWhat would you like to do?"
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return

    // Determine file type
    let fileType: "image" | "video" | "document" | "pdf" | "other" | undefined
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) fileType = 'image'
      else if (selectedFile.type.startsWith('video/')) fileType = 'video'
      else if (selectedFile.type.includes('pdf')) fileType = 'pdf'
      else if (selectedFile.type.includes('document') || selectedFile.type.includes('word') || selectedFile.type.includes('text')) fileType = 'document'
      else fileType = 'other'
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue || (selectedFile ? `Sent ${fileType === 'image' ? 'an image' : fileType === 'video' ? 'a video' : fileType === 'pdf' ? 'a PDF' : 'a document'}` : ""),
      sender: "user",
      timestamp: new Date(),
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
      fileName: selectedFile?.name,
      fileType: fileType
    }
    setMessages(prev => [...prev, userMessage])
    const messageText = inputValue
    const hadFile = !!selectedFile
    const uploadedFileType = selectedFile?.type
    setInputValue("")
    setSelectedFile(null)
    setIsTyping(true)

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(messageText, hadFile, uploadedFileType),
        sender: "bot",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        alert("File size must be less than 25MB")
        return
      }
      setSelectedFile(file)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Twilio call integration
  const initiateTwilioCall = async () => {
    const userPhone = prompt("Enter your phone number with country code (e.g., +11234567890 for USA, +919876543210 for India):")
    
    if (!userPhone) return

    if (!userPhone.startsWith('+')) {
      alert("Please include country code with + sign (e.g., +1 for USA, +91 for India)")
      return
    }

    try {
      const response = await fetch("/api/twilio/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: userPhone })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        alert("We'll call you shortly! 📞")
      } else {
        alert(data.message || "Unable to initiate call. Please try again or use chat.")
      }
    } catch (error) {
      console.error("Twilio call error:", error)
      alert("Error initiating call. Please use chat support.")
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-400 hover:bg-green-500 rounded-full shadow-lg shadow-green-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 animate-pulse"
          aria-label="Open chat"
        >
          <MessageCircle className="w-8 h-8 text-black" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-black border-2 border-green-400/50 rounded-2xl shadow-2xl shadow-green-500/30 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-black border-b-2 border-green-400/50 text-green-400 p-4 flex items-center justify-between relative">
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
              <div className="w-full h-full" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,153,0.1) 2px, rgba(0,255,153,0.1) 4px)',
              }} />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                <MessageCircle className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-lg font-mono">CITYGUARDIAN</h3>
                <p className="text-xs text-green-300/70 font-mono">ONLINE • OPERATIVE MODE</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-green-400/10 rounded-full p-1 transition-colors relative z-10"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-black space-y-4 relative">
            {/* Grid background */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
              <div className="w-full h-full" style={{
                backgroundImage: `
                  linear-gradient(rgba(0,255,153,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,255,153,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }} />
            </div>
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} relative z-10`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 font-mono text-sm ${
                    message.sender === "user"
                      ? "bg-green-400 text-black border border-green-300"
                      : "bg-gray-900 text-green-400 border border-green-500/30"
                  }`}
                >
                  {/* Display file preview if exists */}
                  {message.fileUrl && message.fileType === 'image' && (
                    <img 
                      src={message.fileUrl} 
                      alt="Uploaded" 
                      className="max-w-full rounded mb-2 border border-green-400/30"
                    />
                  )}
                  {message.fileUrl && message.fileType === 'video' && (
                    <video 
                      src={message.fileUrl} 
                      controls 
                      className="max-w-full rounded mb-2 border border-green-400/30"
                    />
                  )}
                  {message.fileUrl && (message.fileType === 'document' || message.fileType === 'pdf' || message.fileType === 'other') && (
                    <div className="flex items-center gap-2 p-2 bg-black/30 border border-green-400/30 rounded mb-2">
                      <FileText className="w-5 h-5 text-green-400" />
                      <span className="text-sm truncate">{message.fileName}</span>
                    </div>
                  )}
                  <p className="whitespace-pre-line">{message.text}</p>
                  <span className={`text-xs ${message.sender === "user" ? "text-black/60" : "text-green-400/60"} mt-1 block`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start relative z-10">
                <div className="bg-gray-900 border border-green-500/30 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="border-t-2 border-green-400/50 bg-black p-3">
            <p className="text-xs text-green-400/70 mb-2 font-mono font-bold">QUICK_ACTIONS:</p>
            <div className="flex gap-2">
              <button
                onClick={initiateTwilioCall}
                className="flex-1 bg-green-400 hover:bg-green-500 text-black px-3 py-2 rounded-lg text-sm font-mono font-bold flex items-center justify-center gap-2 transition-all border border-green-300"
              >
                <Phone className="w-4 h-4" />
                REQUEST_CALL
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-green-400/50 bg-black p-4">
            {/* File preview */}
            {selectedFile && (
              <div className="mb-2 p-2 bg-gray-900 border border-green-400/30 rounded flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-400 text-sm font-mono">
                  {selectedFile.type.startsWith('image/') && <ImageIcon className="w-4 h-4" />}
                  {selectedFile.type.startsWith('video/') && <Video className="w-4 h-4" />}
                  {(selectedFile.type.includes('pdf') || selectedFile.type.includes('document') || !selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) && <FileText className="w-4 h-4" />}
                  <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  <span className="text-xs text-green-400/60">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-red-400 hover:text-red-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-900 hover:bg-gray-800 border border-green-400/30 text-green-400 p-2 rounded-lg transition-colors"
                aria-label="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <Input
                type="text"
                placeholder="TYPE_MESSAGE..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-gray-900 border-green-400/30 focus:border-green-400 focus:ring-green-400 text-green-400 placeholder:text-green-400/40 font-mono"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() && !selectedFile}
                className="bg-green-400 hover:bg-green-500 text-black px-4 font-mono font-bold border border-green-300"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
