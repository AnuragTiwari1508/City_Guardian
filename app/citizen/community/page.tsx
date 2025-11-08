"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NavigationHeader from "@/components/navigation-header"
import { 
  Globe, 
  Target, 
  Users, 
  MessageSquare, 
  Bell, 
  ExternalLink,
  Leaf,
  Droplets,
  Zap,
  Building,
  Heart,
  GraduationCap,
  Equal,
  TreePine,
  Scale,
  Handshake,
  Activity,
  Recycle,
  Sun,
  Fish
} from "lucide-react"

export default function CitizenCommunityPage() {
  const [activeTab, setActiveTab] = useState("sdgs")

  // UN Sustainability Goals with custom icons
  const sustainabilityGoals = [
    { id: 1, title: "No Poverty", description: "End poverty in all its forms everywhere", icon: Heart, color: "from-red-500 to-red-600", target: "2030" },
    { id: 2, title: "Zero Hunger", description: "End hunger, achieve food security", icon: Leaf, color: "from-yellow-600 to-orange-500", target: "2030" },
    { id: 3, title: "Good Health", description: "Ensure healthy lives and well-being", icon: Activity, color: "from-green-500 to-green-600", target: "2030" },
    { id: 4, title: "Quality Education", description: "Inclusive and equitable quality education", icon: GraduationCap, color: "from-red-600 to-red-700", target: "2030" },
    { id: 5, title: "Gender Equality", description: "Achieve gender equality", icon: Equal, color: "from-orange-500 to-red-500", target: "2030" },
    { id: 6, title: "Clean Water", description: "Clean water and sanitation for all", icon: Droplets, color: "from-cyan-400 to-blue-500", target: "2030" },
    { id: 7, title: "Affordable Energy", description: "Sustainable and modern energy", icon: Sun, color: "from-yellow-400 to-yellow-500", target: "2030" },
    { id: 8, title: "Economic Growth", description: "Sustained economic growth", icon: Building, color: "from-purple-500 to-pink-500", target: "2030" },
    { id: 9, title: "Innovation", description: "Build resilient infrastructure", icon: Zap, color: "from-orange-600 to-red-600", target: "2030" },
    { id: 10, title: "Reduced Inequalities", description: "Reduce inequality within countries", icon: Scale, color: "from-pink-500 to-purple-500", target: "2030" },
    { id: 11, title: "Sustainable Cities", description: "Sustainable cities and communities", icon: Building, color: "from-yellow-600 to-orange-600", target: "2030" },
    { id: 12, title: "Responsible Consumption", description: "Sustainable consumption patterns", icon: Recycle, color: "from-green-600 to-yellow-600", target: "2030" },
    { id: 13, title: "Climate Action", description: "Urgent action on climate change", icon: TreePine, color: "from-green-700 to-green-800", target: "2030" },
    { id: 14, title: "Life Below Water", description: "Conserve oceans and marine life", icon: Fish, color: "from-blue-500 to-cyan-500", target: "2030" },
    { id: 15, title: "Life on Land", description: "Protect terrestrial ecosystems", icon: TreePine, color: "from-green-600 to-green-700", target: "2030" },
    { id: 16, title: "Peace & Justice", description: "Peaceful and inclusive societies", icon: Scale, color: "from-blue-600 to-blue-700", target: "2030" },
    { id: 17, title: "Partnerships", description: "Global partnerships for goals", icon: Handshake, color: "from-indigo-600 to-purple-600", target: "2030" }
  ]

  const communityUpdates = [
    {
      id: 1,
      title: "Clean Water Initiative Launch",
      description: "New water purification systems installed in 15 locations across the city",
      type: "SDG-6",
      date: "2025-11-08",
      priority: "high"
    },
    {
      id: 2,
      title: "Solar Panel Installation Drive",
      description: "Free solar panel installation for residential buildings under SDG-7 initiative",
      type: "SDG-7", 
      date: "2025-11-07",
      priority: "medium"
    },
    {
      id: 3,
      title: "Digital Education Program",
      description: "Tablets distributed to 500+ students for quality education access",
      type: "SDG-4",
      date: "2025-11-06",
      priority: "high"
    }
  ]

  return (
    <div className="w-full min-h-screen bg-black">
      <NavigationHeader title="COMMUNITY HUB" customBackPath="/citizen" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full mb-4">
            <Globe className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-blue-400 mb-4 neon-glow">
            COMMUNITY MISSION CONTROL
          </h1>
          <p className="text-gray-300 text-lg font-mono max-w-2xl mx-auto">
            Collaborative platform for sustainable development and community engagement
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-gray-900/50 border border-gray-700">
            <TabsTrigger value="sdgs" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              UN SDGs
            </TabsTrigger>
            <TabsTrigger value="updates" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Updates
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Forums
            </TabsTrigger>
          </TabsList>

          {/* UN Sustainability Goals Tab */}
          <TabsContent value="sdgs" className="mt-8">
            <div className="text-center mb-8">
              <Card className="border border-blue-500/50 bg-blue-900/20 backdrop-blur-sm p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Target className="w-8 h-8 text-blue-400" />
                  <h2 className="text-3xl font-black text-blue-400">UN SUSTAINABILITY GOALS</h2>
                  <Target className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-300 text-lg font-mono mb-4">
                  OFFICIAL SUSTAINABILITY TARGETS TO BE ACHIEVED BY 2030
                </p>
                <Button
                  variant="outline"
                  className="border-blue-400 text-blue-400 hover:bg-blue-400/10"
                  onClick={() => window.open('https://india.un.org/en/sdgs', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit UN India SDGs Portal
                </Button>
              </Card>
            </div>

            {/* SDG Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sustainabilityGoals.map((goal) => (
                <Card 
                  key={goal.id}
                  className="border border-gray-700 bg-gray-900/50 backdrop-blur-sm p-4 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${goal.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <goal.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-xs bg-blue-900/30 text-blue-400 border-blue-400/30">
                      SDG-{goal.id}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                      {goal.target}
                    </Badge>
                  </div>
                  <h3 className="text-white font-bold text-sm mb-2">{goal.title}</h3>
                  <p className="text-gray-400 text-xs">{goal.description}</p>
                </Card>
              ))}
            </div>

            {/* CityGuardian Contribution */}
            <Card className="border border-green-500/50 bg-green-900/20 backdrop-blur-sm p-6 mt-8">
              <div className="flex items-center gap-3 mb-4">
                <Leaf className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-green-400">CITYGUARDIAN'S CONTRIBUTION</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-green-400 mb-1">SDG-11</div>
                  <div className="text-xs text-gray-300">Sustainable Cities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-400 mb-1">SDG-6</div>
                  <div className="text-xs text-gray-300">Clean Water</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-yellow-400 mb-1">SDG-7</div>
                  <div className="text-xs text-gray-300">Clean Energy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-purple-400 mb-1">SDG-13</div>
                  <div className="text-xs text-gray-300">Climate Action</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Community Updates Tab */}
          <TabsContent value="updates" className="mt-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-400 mb-6">Latest Community Updates</h2>
              {communityUpdates.map((update) => (
                <Card key={update.id} className="border border-gray-700 bg-gray-900/50 backdrop-blur-sm p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`${update.priority === 'high' ? 'bg-red-900/30 text-red-400 border-red-400/30' : 'bg-yellow-900/30 text-yellow-400 border-yellow-400/30'}`}>
                        {update.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-900/30 text-blue-400 border-blue-400/30">
                        {update.type}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">{update.date}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{update.title}</h3>
                  <p className="text-gray-400">{update.description}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Community Forums Tab */}
          <TabsContent value="community" className="mt-8">
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">Community Forums</h3>
              <p className="text-gray-500 mb-6">Connect with neighbors and discuss local issues</p>
              <Button variant="outline" className="border-gray-600 text-gray-400">
                Coming Soon
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}