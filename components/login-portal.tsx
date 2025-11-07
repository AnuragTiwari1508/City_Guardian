"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ChevronLeft, LogIn, Shield, Users, Target } from "lucide-react"

export default function LoginPortal({ onBack }: { onBack: () => void }) {
  const [userType, setUserType] = useState<"citizen" | "employee" | "office" | "environmental" | null>(null)
  const [credentials, setCredentials] = useState({ email: "", password: "" })
  const router = useRouter()

  const handleLogin = (type: string) => {
    // Navigate to respective dashboard with proper routing
    if (type === "environmental") {
      router.push("/environmental")
    } else if (type === "office") {
      router.push("/control/dashboard")
    } else if (type === "employee") {
      router.push("/employee/dashboard")
    } else if (type === "citizen") {
      router.push("/citizen/dashboard")
    }
  }

  if (!userType) {
    return (
      <div className="w-full min-h-screen bg-black overflow-hidden relative">
        {/* Background Effects */}
        <div className="fixed inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,153,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,153,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
          <div className="max-w-4xl w-full">
            <button
              onClick={onBack}
              className="mb-8 flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              <ChevronLeft className="w-5 h-5" />
              BACK_TO_MAIN
            </button>

            <Card className="p-12 border-green-500/30 bg-gray-900/80 backdrop-blur-sm">
              <div className="text-center mb-12">
                <h2 className="text-5xl font-black mb-4 text-green-400 tracking-wider neon-glow">
                  SELECT OPERATIVE CLASS
                </h2>
                <p className="text-gray-400 font-mono">Choose your mission profile to access the network</p>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                {[
                  {
                    id: "citizen",
                    title: "CITIZEN OPERATIVE",
                    description: "Field reconnaissance & evidence collection",
                    icon: Users,
                    color: "border-green-500/50 hover:border-green-400",
                    bg: "bg-green-500/10 hover:bg-green-500/20",
                    glow: "hover:shadow-green-400/20"
                  },
                  {
                    id: "employee",
                    title: "FIELD AGENT",
                    description: "Mission execution & tactical operations",
                    icon: Target,
                    color: "border-blue-500/50 hover:border-blue-400",
                    bg: "bg-blue-500/10 hover:bg-blue-500/20",
                    glow: "hover:shadow-blue-400/20"
                  },
                  {
                    id: "office",
                    title: "COMMAND CENTER",
                    description: "Strategic oversight & zone management",
                    icon: Shield,
                    color: "border-purple-500/50 hover:border-purple-400",
                    bg: "bg-purple-500/10 hover:bg-purple-500/20",
                    glow: "hover:shadow-purple-400/20"
                  },
                  {
                    id: "environmental",
                    title: "SENSOR NETWORK",
                    description: "Real-time environmental monitoring",
                    icon: () => (
                      <div className="w-8 h-8 flex items-center justify-center text-cyan-400 font-black text-lg">
                        ⚡
                      </div>
                    ),
                    color: "border-cyan-500/50 hover:border-cyan-400",
                    bg: "bg-cyan-500/10 hover:bg-cyan-500/20",
                    glow: "hover:shadow-cyan-400/20"
                  }
                ].map((role) => {
                  const Icon = role.icon
                  return (
                    <button
                      key={role.id}
                      onClick={() => setUserType(role.id as any)}
                      className={`p-8 rounded-lg border-2 transition-all duration-300 ${role.color} ${role.bg} hover:shadow-lg ${role.glow} group`}
                    >
                      <div className="mb-6">
                        {role.id === 'environmental' ? (
                          <div className="w-8 h-8 flex items-center justify-center text-cyan-400 font-black text-lg">
                            ⚡
                          </div>
                        ) : (
                          <Icon className="w-8 h-8 text-green-400 group-hover:animate-pulse" />
                        )}
                      </div>
                      <h3 className="font-black text-lg text-white mb-2 tracking-wide">{role.title}</h3>
                      <p className="text-sm text-gray-400 font-mono leading-relaxed">{role.description}</p>
                      
                      {/* Access Level Indicator */}
                      <div className="mt-4 text-xs font-mono text-gray-500 flex items-center justify-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        ACCESS_GRANTED
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,153,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,153,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="max-w-md w-full relative z-10">
        <button
          onClick={() => setUserType(null)}
          className="mb-8 flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors font-mono"
        >
          <ChevronLeft className="w-5 h-5" />
          CHANGE_CLASS
        </button>

        <Card className="p-8 border-green-500/30 bg-gray-900/90 backdrop-blur-sm fade-in-scale">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-400 rounded-full mb-4">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-3xl font-black text-green-400 mb-2 tracking-wider">
              {userType === "environmental" ? "SENSOR_ACCESS" : `${userType?.toUpperCase()}_LOGIN`}
            </h2>
            <p className="text-gray-400 font-mono text-sm">Enter authentication credentials</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2">OPERATIVE_ID</label>
              <Input
                type="email"
                placeholder="operative@cityguardian.net"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                className="bg-gray-800 border-gray-600 text-green-400 placeholder:text-gray-500 font-mono focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2">ACCESS_CODE</label>
              <Input
                type="password"
                placeholder="••••••••••••••••"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="bg-gray-800 border-gray-600 text-green-400 placeholder:text-gray-500 font-mono focus:border-green-400"
              />
            </div>
          </div>

          <Button
            onClick={() => handleLogin(userType)}
            className="w-full bg-gradient-to-r from-green-400 to-cyan-400 text-black font-black h-12 hover:from-green-300 hover:to-cyan-300 shadow-lg shadow-green-400/25 font-mono tracking-wide"
          >
            <LogIn className="w-5 h-5 mr-2" />
            INITIALIZE_SESSION
          </Button>

          <div className="mt-6 p-4 bg-gray-800/50 rounded border border-gray-700">
            <p className="text-center text-gray-400 text-xs font-mono mb-2">DEMO_CREDENTIALS</p>
            <div className="text-center text-green-400 text-xs font-mono">
              ID: demo@cityguardian.net<br/>
              CODE: guardian2025
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
