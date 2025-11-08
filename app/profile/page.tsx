"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Edit2, 
  Save, 
  X,
  LogOut,
  ChevronLeft
} from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")

  useEffect(() => {
    if (!user) {
      router.push('/')
    } else {
      setEditedName(user.name)
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono">Loading profile...</div>
      </div>
    )
  }

  const handleSave = () => {
    const updatedUser = { ...user, name: editedName }
    localStorage.setItem('cityguardian_user', JSON.stringify(updatedUser))
    setIsEditing(false)
    window.location.reload()
  }

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'citizen': return 'Citizen Operative'
      case 'employee': return 'Field Agent'
      case 'office': return 'Command Center'
      case 'environmental': return 'Sensor Network'
      default: return type
    }
  }

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'citizen': return 'text-green-400 border-green-400/50 bg-green-400/10'
      case 'employee': return 'text-blue-400 border-blue-400/50 bg-blue-400/10'
      case 'office': return 'text-purple-400 border-purple-400/50 bg-purple-400/10'
      case 'environmental': return 'text-cyan-400 border-cyan-400/50 bg-cyan-400/10'
      default: return 'text-green-400 border-green-400/50 bg-green-400/10'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,153,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,153,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors font-mono"
          >
            <ChevronLeft className="w-5 h-5" />
            BACK_TO_DASHBOARD
          </button>

          {/* Profile Header */}
          <Card className="p-8 border-green-500/30 bg-gray-900/90 backdrop-blur-sm mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-32 h-32 border-4 border-green-400/50">
                <AvatarFallback className="bg-green-400 text-black text-4xl font-black">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                {isEditing ? (
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="bg-gray-800 border-green-400/50 text-green-400 font-mono text-2xl font-black max-w-md"
                    />
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="bg-green-400 text-black hover:bg-green-300"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setEditedName(user.name)
                        setIsEditing(false)
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                    <h1 className="text-4xl font-black text-green-400 neon-glow">
                      {user.name}
                    </h1>
                    <Button
                      onClick={() => setIsEditing(true)}
                      size="sm"
                      variant="ghost"
                      className="text-green-400 hover:text-green-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getUserTypeColor(user.userType)} font-mono font-bold mb-4`}>
                  <Shield className="w-5 h-5" />
                  {getUserTypeLabel(user.userType)}
                </div>

                <div className="flex flex-col md:flex-row gap-4 text-sm font-mono text-gray-400 mt-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-400" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-400" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                onClick={logout}
                variant="outline"
                className="border-red-400/50 text-red-400 hover:bg-red-400/10 hover:text-red-300 font-mono"
              >
                <LogOut className="w-4 h-4 mr-2" />
                LOGOUT
              </Button>
            </div>
          </Card>

          {/* Account Details */}
          <Card className="p-8 border-green-500/30 bg-gray-900/90 backdrop-blur-sm mb-6">
            <h2 className="text-2xl font-black text-green-400 mb-6 flex items-center gap-2">
              <User className="w-6 h-6" />
              ACCOUNT_DETAILS
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                <label className="block text-xs font-mono text-gray-400 mb-2">USER_ID</label>
                <p className="text-green-400 font-mono font-bold">{user.id}</p>
              </div>

              <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                <label className="block text-xs font-mono text-gray-400 mb-2">EMAIL_ADDRESS</label>
                <p className="text-green-400 font-mono">{user.email}</p>
              </div>

              <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                <label className="block text-xs font-mono text-gray-400 mb-2">OPERATIVE_CLASS</label>
                <p className="text-green-400 font-mono">{getUserTypeLabel(user.userType)}</p>
              </div>

              <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                <label className="block text-xs font-mono text-gray-400 mb-2">ACCOUNT_STATUS</label>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-green-400 font-mono font-bold">ACTIVE</p>
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                <label className="block text-xs font-mono text-gray-400 mb-2">REGISTRATION_DATE</label>
                <p className="text-green-400 font-mono">
                  {new Date(user.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-8 border-green-500/30 bg-gray-900/90 backdrop-blur-sm">
            <h2 className="text-2xl font-black text-green-400 mb-6">QUICK_ACTIONS</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={() => router.push(`/${user.userType === 'citizen' ? 'citizen' : user.userType === 'employee' ? 'employee' : user.userType === 'office' ? 'control' : 'environmental'}/dashboard`)}
                className="h-16 bg-gradient-to-r from-green-400 to-cyan-400 text-black font-black hover:from-green-300 hover:to-cyan-300"
              >
                <Shield className="w-5 h-5 mr-2" />
                GO_TO_DASHBOARD
              </Button>

              <Button
                onClick={logout}
                variant="outline"
                className="h-16 border-red-400/50 text-red-400 hover:bg-red-400/10 font-black"
              >
                <LogOut className="w-5 h-5 mr-2" />
                TERMINATE_SESSION
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
