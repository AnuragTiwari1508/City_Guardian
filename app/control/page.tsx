"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import NavigationHeader from "@/components/navigation-header"
import { 
  Shield, 
  BarChart3, 
  Users,
  MapPin,
  Settings,
  Monitor,
  AlertTriangle,
  TrendingUp
} from "lucide-react"

export default function ControlPage() {
  const router = useRouter()

  const features = [
    {
      title: "Command Dashboard",
      description: "Real-time city overview, zone management, and strategic control",
      icon: Shield,
      path: "/control/dashboard",
      color: "from-purple-400 to-pink-400"
    },
    {
      title: "Analytics Center",
      description: "Performance metrics, trends analysis, and resource optimization",
      icon: BarChart3,
      path: "/control/analytics", 
      color: "from-green-400 to-cyan-400"
    },
    {
      title: "Zone Management",
      description: "Geographic oversight, resource allocation, and area monitoring",
      icon: MapPin,
      path: "/control/dashboard?tab=zones",
      color: "from-yellow-400 to-orange-400"
    }
  ]

  return (
    <div className="w-full min-h-screen bg-black">
      <NavigationHeader title="COMMAND CENTER" customBackPath="/" />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full mb-4">
            <Shield className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-purple-400 mb-4 neon-glow">
            STRATEGIC COMMAND
          </h1>
          <p className="text-gray-300 text-lg font-mono max-w-2xl mx-auto">
            High-level oversight, strategic planning, and comprehensive city management operations
          </p>
        </div>

        {/* Command Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="border border-gray-700 bg-gray-900/50 p-4 text-center">
            <div className="text-2xl font-black text-green-400 mb-1">1.2K</div>
            <div className="text-xs text-gray-400">ACTIVE AGENTS</div>
          </Card>
          <Card className="border border-gray-700 bg-gray-900/50 p-4 text-center">
            <div className="text-2xl font-black text-purple-400 mb-1">15</div>
            <div className="text-xs text-gray-400">ZONES MANAGED</div>
          </Card>
          <Card className="border border-gray-700 bg-gray-900/50 p-4 text-center">
            <div className="text-2xl font-black text-cyan-400 mb-1">96%</div>
            <div className="text-xs text-gray-400">SYSTEM UPTIME</div>
          </Card>
          <Card className="border border-gray-700 bg-gray-900/50 p-4 text-center">
            <div className="text-2xl font-black text-yellow-400 mb-1">48</div>
            <div className="text-xs text-gray-400">AVG RESPONSE (MIN)</div>
          </Card>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {features.map((feature) => (
            <Card 
              key={feature.title} 
              className="border border-gray-700 bg-gray-900/50 backdrop-blur-sm p-6 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer group"
              onClick={() => router.push(feature.path)}
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{feature.description}</p>
              <Button 
                variant="outline" 
                className="w-full border-gray-600 text-gray-300 hover:bg-purple-400/10 hover:border-purple-400 group-hover:text-purple-400"
              >
                Access Control
              </Button>
            </Card>
          ))}
        </div>

        {/* System Status */}
        <Card className="border border-gray-700 bg-gray-900/50 backdrop-blur-sm p-6">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-purple-400" />
            System Status & Alerts
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-green-400 font-mono text-sm mb-2">✓ ALL SYSTEMS OPERATIONAL</h4>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Network Connectivity</span>
                  <span className="text-green-400">100%</span>
                </div>
                <div className="flex justify-between">
                  <span>Agent Communications</span>
                  <span className="text-green-400">ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Processing</span>
                  <span className="text-green-400">OPTIMAL</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-yellow-400 font-mono text-sm mb-2">⚠ PRIORITY ALERTS</h4>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  <span>Zone 7: High traffic congestion</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-blue-400" />
                  <span>Environmental sensors: Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-green-400" />
                  <span>Agent efficiency: Above average</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}