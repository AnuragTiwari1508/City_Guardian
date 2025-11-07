"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, Eye, LogOut, Target, Trophy, Zap } from "lucide-react"
import WeatherWidget from "@/components/weather-widget"

interface SensorData {
  activeSensors: number
  alerts: number
  avgPM25: number
  coverage: number
}

interface ChartData {
  time: string
  pm10: number
  pm25: number
  co2: number
  temp: number
}

export default function EnvironmentalDashboard() {
  const [sensorData, setSensorData] = useState<SensorData>({
    activeSensors: 5,
    alerts: 3,
    avgPM25: 45.7,
    coverage: 100
  })

  const [currentTime, setCurrentTime] = useState<string>("")
  
  // Mock real-time data for charts
  const [chartData] = useState<ChartData[]>([
    { time: "00:00", pm10: 85, pm25: 45, co2: 400, temp: 24 },
    { time: "04:00", pm10: 78, pm25: 38, co2: 380, temp: 22 },
    { time: "08:00", pm10: 95, pm25: 52, co2: 450, temp: 26 },
    { time: "12:00", pm10: 88, pm25: 48, co2: 420, temp: 28 },
    { time: "16:00", pm10: 105, pm25: 56, co2: 480, temp: 30 },
    { time: "20:00", pm10: 92, pm25: 42, co2: 390, temp: 25 },
    { time: "23:59", pm10: 68, pm25: 32, co2: 360, temp: 23 }
  ])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toTimeString().slice(0, 5))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    // Simulate real-time data updates
    const dataInterval = setInterval(() => {
      setSensorData(prev => ({
        ...prev,
        activeSensors: Math.floor(Math.random() * 3) + 4,
        alerts: Math.floor(Math.random() * 5) + 1,
        avgPM25: parseFloat((Math.random() * 20 + 35).toFixed(1))
      }))
    }, 3000)

    return () => {
      clearInterval(interval)
      clearInterval(dataInterval)
    }
  }, [])

  const maxPM10 = Math.max(...chartData.map(d => d.pm10))
  const maxPM25 = Math.max(...chartData.map(d => d.pm25))
  const maxCO2 = Math.max(...chartData.map(d => d.co2))
  const maxTemp = Math.max(...chartData.map(d => d.temp))

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono relative overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,153,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,153,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Animated scanlines */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,153,0.1) 2px, rgba(0,255,153,0.1) 4px)',
        }} />
      </div>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900/90 border-r border-green-500/30 backdrop-blur-sm z-20">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-green-400 rounded flex items-center justify-center text-black font-black">
              ⚡
            </div>
            <div>
              <div className="text-green-400 font-black text-lg">SQUAD</div>
              <div className="text-green-300/70 text-xs">OPERATIVE MODE</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {[
              { icon: Target, label: "MISSION_CONTROL", active: false },
              { icon: Activity, label: "SENSOR_NETWORK", active: true },
              { icon: Trophy, label: "MISSIONS", active: false },
              { icon: Trophy, label: "LEADERBOARD", active: false }
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <Button
                  key={i}
                  variant={item.active ? "default" : "ghost"}
                  className={`w-full justify-start font-mono text-left ${
                    item.active 
                      ? 'bg-green-400 text-black hover:bg-green-300' 
                      : 'text-green-400 hover:bg-green-400/10 border border-gray-700 hover:border-green-400/50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-6 left-6 right-6">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:bg-red-400/10 border border-gray-700 hover:border-red-400/50 font-mono"
          >
            <LogOut className="w-4 h-4 mr-3" />
            LOGOUT
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-6xl font-black text-green-400 mb-2 tracking-wider neon-glow">
            ENVIRONMENTAL SENSORS
          </h1>
          <p className="text-green-300/70 text-lg">Real-time monitoring network status & data</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { 
              label: "Active Sensors", 
              value: sensorData.activeSensors.toString(), 
              icon: Activity, 
              color: "text-green-400",
              bg: "border-green-500/50 bg-green-500/10"
            },
            { 
              label: "Alerts", 
              value: sensorData.alerts.toString(), 
              icon: AlertTriangle, 
              color: "text-red-400",
              bg: "border-red-500/50 bg-red-500/10"
            },
            { 
              label: "Avg PM2.5", 
              value: sensorData.avgPM25.toString(), 
              icon: Eye, 
              color: "text-cyan-400",
              bg: "border-cyan-500/50 bg-cyan-500/10"
            },
            { 
              label: "Coverage", 
              value: `${sensorData.coverage}%`, 
              icon: Target, 
              color: "text-green-400",
              bg: "border-green-500/50 bg-green-500/10"
            }
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card key={i} className={`${stat.bg} border-2 backdrop-blur-sm`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                    <div className="w-6 h-6 rounded-full border-2 border-green-400 animate-pulse"></div>
                  </div>
                  <div className={`text-4xl font-black ${stat.color} mb-2 number-update`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm font-mono">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          {/* Air Quality 24H */}
          <Card className="border-green-500/50 bg-gray-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-green-400 font-black text-xl">AIR_QUALITY_24H</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 relative">
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  {/* Grid lines */}
                  {[0, 30, 60, 90, 120].map(y => (
                    <line 
                      key={y} 
                      x1="0" 
                      y1={200 - y * 1.5} 
                      x2="400" 
                      y2={200 - y * 1.5} 
                      stroke="rgba(0,255,153,0.1)" 
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* PM10 Line (Orange) */}
                  <polyline
                    fill="none"
                    stroke="rgb(255, 149, 0)"
                    strokeWidth="3"
                    points={chartData.map((d, i) => 
                      `${(i * 400) / (chartData.length - 1)},${200 - (d.pm10 / maxPM10) * 180}`
                    ).join(' ')}
                  />
                  
                  {/* PM2.5 Line (Green) */}
                  <polyline
                    fill="none"
                    stroke="rgb(0, 255, 153)"
                    strokeWidth="3"
                    points={chartData.map((d, i) => 
                      `${(i * 400) / (chartData.length - 1)},${200 - (d.pm25 / maxPM25) * 180}`
                    ).join(' ')}
                  />
                  
                  {/* Data points */}
                  {chartData.map((d, i) => (
                    <g key={i}>
                      <circle
                        cx={(i * 400) / (chartData.length - 1)}
                        cy={200 - (d.pm10 / maxPM10) * 180}
                        r="4"
                        fill="rgb(255, 149, 0)"
                      />
                      <circle
                        cx={(i * 400) / (chartData.length - 1)}
                        cy={200 - (d.pm25 / maxPM25) * 180}
                        r="4"
                        fill="rgb(0, 255, 153)"
                      />
                    </g>
                  ))}
                </svg>
                
                {/* Time labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-2">
                  {chartData.map((d, i) => (
                    <span key={i}>{d.time}</span>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="absolute top-4 right-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-orange-500"></div>
                    <span className="text-xs text-orange-400">PM10</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-green-500"></div>
                    <span className="text-xs text-green-400">PM2.5</span>
                  </div>
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-8">
                  <span>120</span>
                  <span>90</span>
                  <span>60</span>
                  <span>30</span>
                  <span>0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environmental Params */}
          <Card className="border-cyan-500/50 bg-gray-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-cyan-400 font-black text-xl">ENVIRONMENTAL_PARAMS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 relative">
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  {/* Grid lines */}
                  {[0, 150, 300, 450, 600].map(y => (
                    <line 
                      key={y} 
                      x1="0" 
                      y1={200 - y * 0.3} 
                      x2="400" 
                      y2={200 - y * 0.3} 
                      stroke="rgba(0,184,255,0.1)" 
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* CO2 Area Chart (Orange gradient) */}
                  <defs>
                    <linearGradient id="co2Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255, 149, 0, 0.6)" />
                      <stop offset="100%" stopColor="rgba(255, 149, 0, 0.1)" />
                    </linearGradient>
                  </defs>
                  
                  <polygon
                    fill="url(#co2Gradient)"
                    stroke="rgb(255, 149, 0)"
                    strokeWidth="2"
                    points={`0,200 ${chartData.map((d, i) => 
                      `${(i * 400) / (chartData.length - 1)},${200 - (d.co2 / maxCO2) * 180}`
                    ).join(' ')} 400,200`}
                  />
                  
                  {/* Temperature Line (Cyan) */}
                  <polyline
                    fill="none"
                    stroke="rgb(0, 184, 255)"
                    strokeWidth="3"
                    points={chartData.map((d, i) => 
                      `${(i * 400) / (chartData.length - 1)},${200 - ((d.temp - 20) / (maxTemp - 20)) * 180}`
                    ).join(' ')}
                  />
                </svg>
                
                {/* Time labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-2">
                  {chartData.map((d, i) => (
                    <span key={i}>{d.time}</span>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="absolute top-4 right-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-orange-500"></div>
                    <span className="text-xs text-orange-400">CO2 (ppm)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-cyan-500"></div>
                    <span className="text-xs text-cyan-400">Temp (°C)</span>
                  </div>
                </div>
                
                {/* Current time indicator */}
                <div className="absolute bottom-4 right-4 text-xs text-green-400 font-mono">
                  {currentTime}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Built with indicator */}
        <div className="fixed bottom-4 right-4 flex items-center gap-2 text-xs text-gray-500">
          <span>Built with</span>
          <Zap className="w-4 h-4 text-green-400" />
        </div>

        {/* Weather Widget */}
        <WeatherWidget />
      </div>
    </div>
  )
}