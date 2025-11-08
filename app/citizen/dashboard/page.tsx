"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import NavigationHeader from "@/components/navigation-header"
import InteractiveMap from "@/components/interactive-map"
import { 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  Camera, 
  MapPin, 
  Phone, 
  Mail,
  Upload,
  Heart,
  MessageCircle,
  Share,
  Clock,
  CheckCircle2,
  Bell,
  Menu,
  Loader2,
  Map
} from "lucide-react"

// Dynamically import LiveLocationMap to avoid SSR issues with Leaflet
const LiveLocationMap = dynamic(
  () => import("@/components/live-location-map"),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed z-50 bg-black border-2 border-green-400/50 rounded-lg shadow-2xl shadow-green-500/30 p-4" style={{ left: '20px', top: '100px' }}>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-green-400" />
          <span className="text-sm text-gray-400 font-mono">Loading map...</span>
        </div>
      </div>
    )
  }
)

export default function CitizenDashboard() {
  const [activeTab, setActiveTab] = useState("feed")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [location, setLocation] = useState("")
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null)
  const [showLocationMap, setShowLocationMap] = useState(false)
  const [showInteractiveMap, setShowInteractiveMap] = useState(false)
  
  // Complaint form state
  const [formData, setFormData] = useState({
    issueType: '',
    title: '',
    description: '',
    phone: '',
    email: '',
    priority: ''
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Handle location selection from map
  const handleLocationSelect = (locationData: { lat: number; lng: number; address: string }) => {
    setLocation(locationData.address)
    setCoordinates({ lat: locationData.lat, lng: locationData.lng })
  }

  // Handle location selection from interactive map
  const handleInteractiveMapSelect = (locationData: { lat: number; lng: number; address?: string }) => {
    setLocation(locationData.address || `${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`)
    setCoordinates({ lat: locationData.lat, lng: locationData.lng })
  }

  // Get current location
  const getCurrentLocation = () => {
    setLoadingLocation(true)
    
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      setLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        // Store coordinates
        setCoordinates({ lat: latitude, lng: longitude })
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await response.json()
          const address = data.locality 
            ? `${data.locality}, ${data.city || data.principalSubdivision}` 
            : `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`
          
          setLocation(address)
        } catch (error) {
          // If reverse geocoding fails, just show coordinates
          setLocation(`Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`)
        }
        
        setLoadingLocation(false)
      },
      (error) => {
        console.error("Geolocation error:", error)
        let errorMessage = "Unable to get location. "
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access in your browser settings."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again."
            break
          default:
            errorMessage += "Please enter location manually."
        }
        alert(errorMessage)
        setLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    const fileArray = Array.from(files)
    
    // Limit to 5 photos
    if (photos.length + fileArray.length > 5) {
      alert('Maximum 5 photos allowed')
      return
    }
    
    // Check file sizes (10MB max each)
    const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('Each photo must be less than 10MB')
      return
    }
    
    // Update photos state
    setPhotos(prev => [...prev, ...fileArray])
    
    // Create preview URLs
    fileArray.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreviewUrls(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  // Handle form submission
  const handleComplaintSubmit = async () => {
    // Validation
    if (!formData.issueType) {
      alert('Please select an issue type')
      return
    }
    if (!formData.title.trim()) {
      alert('Please enter an issue title')
      return
    }
    if (!formData.description.trim()) {
      alert('Please provide a description')
      return
    }
    if (!location.trim()) {
      alert('Please enter or select a location')
      return
    }
    if (!formData.phone.trim() && !formData.email.trim()) {
      alert('Please provide at least one contact method (phone or email)')
      return
    }
    if (!formData.priority) {
      alert('Please select a priority level')
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call - in production, this would upload photos and create complaint
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Success
      setSubmitSuccess(true)
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          issueType: '',
          title: '',
          description: '',
          phone: '',
          email: '',
          priority: ''
        })
        setLocation('')
        setCoordinates(null)
        setPhotos([])
        setPhotoPreviewUrls([])
        setSubmitSuccess(false)
        setIsSubmitting(false)
        setActiveTab('feed') // Switch back to feed
      }, 3000)
    } catch (error) {
      alert('Failed to submit complaint. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Mock data for feed posts with actual problem photos
  const feedPosts = [
    {
      id: 1,
      type: "complaint",
      author: "Rajesh Kumar",
      location: "MG Road, Sector 14",
      time: "2 hours ago",
      title: "Major Pothole Causing Traffic Issues",
      description: "Large pothole formed after recent rains. Multiple vehicles getting damaged. Urgent repair needed.",
      image: "/road-pothole.svg",
      category: "Road Infrastructure",
      status: "pending",
      likes: 23,
      comments: 8,
      priority: "high"
    },
    {
      id: 2,
      type: "municipal_post",
      author: "Municipal Corporation",
      location: "City Wide",
      time: "4 hours ago",
      title: "Waste Collection Schedule Update",
      description: "New waste collection timings: Morning 6-9 AM, Evening 6-8 PM. Please keep waste ready 30 minutes before collection.",
      image: "/waste-collection.svg",
      category: "Municipal Notice",
      status: "active",
      likes: 45,
      comments: 12,
      priority: "info"
    },
    {
      id: 3,
      type: "complaint",
      author: "Priya Sharma",
      location: "Green Park Extension",
      time: "1 day ago",
      title: "Air Pollution from Construction Site",
      description: "Heavy dust and poor air quality due to construction activities. Affecting nearby residential areas.",
      image: "/air-pollution.svg",
      category: "Environment",
      status: "in_progress",
      likes: 31,
      comments: 15,
      priority: "medium"
    },
    {
      id: 4,
      type: "complaint",
      author: "Amit Singh",
      location: "Nehru Place Market",
      time: "2 days ago",
      title: "Garbage Overflow in Market Area",
      description: "Large pile of garbage accumulating near market entrance. Creating hygiene issues and attracting pests.",
      image: "/garbage-dump.svg",
      category: "Waste Management",
      status: "pending",
      likes: 18,
      comments: 6,
      priority: "high"
    }
  ]

  const TabNavigation = () => (
    <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 py-4">
          <Button 
            variant={activeTab === "community" ? "default" : "ghost"}
            onClick={() => setActiveTab("community")}
            className={activeTab === "community" ? "bg-green-400 text-black" : "text-green-400 hover:bg-green-400/10"}
          >
            <Users className="w-4 h-4 mr-2" />
            Community
          </Button>
          <Button 
            variant={activeTab === "feed" ? "default" : "ghost"}
            onClick={() => setActiveTab("feed")}
            className={activeTab === "feed" ? "bg-green-400 text-black" : "text-green-400 hover:bg-green-400/10"}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Feed
          </Button>
          <Button 
            variant={activeTab === "complain" ? "default" : "ghost"}
            onClick={() => {
              setActiveTab("complain")
              setShowLocationMap(true)
            }}
            className={activeTab === "complain" ? "bg-green-400 text-black" : "text-green-400 hover:bg-green-400/10"}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Complain
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-3">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={activeTab === "community" ? "default" : "ghost"}
              onClick={() => setActiveTab("community")}
              size="sm"
              className={activeTab === "community" ? "bg-green-400 text-black" : "text-green-400"}
            >
              <Users className="w-4 h-4 mr-1" />
              Community
            </Button>
            <Button 
              variant={activeTab === "feed" ? "default" : "ghost"}
              onClick={() => setActiveTab("feed")}
              size="sm"
              className={activeTab === "feed" ? "bg-green-400 text-black" : "text-green-400"}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Feed
            </Button>
            <Button 
              variant={activeTab === "complain" ? "default" : "ghost"}
              onClick={() => {
                setActiveTab("complain")
                setShowLocationMap(true)
              }}
              size="sm"
              className={activeTab === "complain" ? "bg-green-400 text-black" : "text-green-400"}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Complain
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  const FeedPost = ({ post }: { post: any }) => (
    <Card className="border border-gray-700 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
      <div className="p-4">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-cyan-400 rounded-full flex items-center justify-center text-black font-bold">
              {post.author.charAt(0)}
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">{post.author}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
                <span>{post.location}</span>
                <Clock className="w-3 h-3 ml-2" />
                <span>{post.time}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${
                post.type === 'municipal_post' 
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10' 
                  : 'border-red-500 text-red-400 bg-red-500/10'
              }`}
            >
              {post.type === 'municipal_post' ? 'Municipal' : 'Complaint'}
            </Badge>
            {post.status === 'pending' && <Badge variant="outline" className="border-yellow-500 text-yellow-400 bg-yellow-500/10 text-xs">Pending</Badge>}
            {post.status === 'in_progress' && <Badge variant="outline" className="border-blue-500 text-blue-400 bg-blue-500/10 text-xs">In Progress</Badge>}
            {post.status === 'active' && <Badge variant="outline" className="border-green-500 text-green-400 bg-green-500/10 text-xs">Active</Badge>}
          </div>
        </div>

        {/* Post Content */}
        <h3 className="text-white font-bold mb-2">{post.title}</h3>
        <p className="text-gray-300 text-sm mb-3 leading-relaxed">{post.description}</p>

        {/* Post Image with Enhanced Frame */}
        {post.image && (
          <div className="mb-4 relative">
            {/* Gaming-style frame with neon glow */}
            <div className="relative rounded-lg overflow-hidden border-2 border-green-400/30 bg-gradient-to-r from-green-400/10 to-cyan-400/10 p-1">
              <div className="relative rounded-md overflow-hidden bg-gray-900">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover transition-transform duration-300 hover:scale-105"
                />
                {/* Overlay grid pattern for cyberpunk effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                  backgroundImage: `linear-gradient(rgba(0,255,153,0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(0,255,153,0.1) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>
            </div>
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-green-400"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-green-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-green-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-green-400"></div>
          </div>
        )}

        {/* Category and Priority */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="border-gray-600 text-gray-300 bg-gray-800/50 text-xs">
            {post.category}
          </Badge>
          {post.priority === 'high' && <Badge variant="outline" className="border-red-500 text-red-400 bg-red-500/10 text-xs">High Priority</Badge>}
          {post.priority === 'medium' && <Badge variant="outline" className="border-yellow-500 text-yellow-400 bg-yellow-500/10 text-xs">Medium Priority</Badge>}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between border-t border-gray-700 pt-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400 p-0 h-auto">
              <Heart className="w-4 h-4 mr-1" />
              <span className="text-xs">{post.likes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400 p-0 h-auto">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-xs">{post.comments}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400 p-0 h-auto">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="w-full min-h-screen bg-black">
      <NavigationHeader title="CITIZEN DASHBOARD" customBackPath="/citizen" />
      <TabNavigation />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Community Tab */}
        {activeTab === "community" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-black text-green-400 mb-2">COMMUNITY HUB</h2>
              <p className="text-gray-400 font-mono">Municipal updates and community announcements</p>
            </div>
            
            <div className="grid gap-6">
              {feedPosts.filter(post => post.type === 'municipal_post').map(post => (
                <FeedPost key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* Feed Tab */}
        {activeTab === "feed" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-black text-green-400 mb-2">COMMUNITY FEED</h2>
              <p className="text-gray-400 font-mono">Latest complaints and issues from your area</p>
            </div>
            
            <div className="grid gap-6">
              {feedPosts.map(post => (
                <FeedPost key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* Complain Tab */}
        {activeTab === "complain" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-green-400 mb-2">REPORT ISSUE</h2>
              <p className="text-gray-400 font-mono">Submit your complaint with details and photos</p>
            </div>

            <Card className="border border-gray-700 bg-gray-900/50 backdrop-blur-sm p-6">
              <div className="space-y-6">
                {/* Issue Type */}
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">ISSUE TYPE</label>
                  <Select value={formData.issueType} onValueChange={(value) => setFormData({...formData, issueType: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select issue category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pothole">Road/Pothole</SelectItem>
                      <SelectItem value="waste">Waste Management</SelectItem>
                      <SelectItem value="air_pollution">Air Pollution</SelectItem>
                      <SelectItem value="noise">Noise Pollution</SelectItem>
                      <SelectItem value="streetlight">Street Light</SelectItem>
                      <SelectItem value="water">Water Supply</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">ISSUE TITLE</label>
                  <Input 
                    placeholder="Brief title of the issue"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">DESCRIPTION</label>
                  <Textarea 
                    placeholder="Describe the issue in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 min-h-[100px]"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">LOCATION</label>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Input 
                        placeholder="Enter address or landmark"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-green-400"
                        onClick={getCurrentLocation}
                        disabled={loadingLocation}
                        title="Get Current Location"
                      >
                        {loadingLocation ? (
                          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-green-400"
                        onClick={() => setShowInteractiveMap(!showInteractiveMap)}
                        title="Interactive Map"
                      >
                        <Map className="w-4 h-4" />
                        {showInteractiveMap ? 'Hide' : 'Map'}
                      </Button>
                    </div>

                    {/* Interactive Map */}
                    {showInteractiveMap && (
                      <div className="border border-gray-600 rounded-lg overflow-hidden">
                        <InteractiveMap 
                          onLocationSelect={handleInteractiveMapSelect}
                          onLocationClear={() => {
                            setCoordinates(null)
                            setLocation('')
                          }}
                          initialLocation={coordinates ? { lat: coordinates.lat, lng: coordinates.lng, address: location } : undefined}
                        />
                      </div>
                    )}

                    {coordinates && (
                      <p className="text-xs text-green-400 mt-2 font-mono">
                        ✓ Location captured: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">PHOTO EVIDENCE</label>
                  <label className="block border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-green-400 transition-colors mb-4 cursor-pointer">
                    <Camera className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">Click to upload photos</p>
                    <p className="text-xs text-gray-500 font-mono">Maximum 5 photos, 10MB each</p>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={photos.length >= 5}
                    />
                  </label>
                  
                  {/* Photo Previews */}
                  {photoPreviewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {photoPreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-700"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Sample Problem Photos for Reference */}
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 font-mono mb-3">COMMON PROBLEMS (Reference Examples):</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="relative group cursor-pointer">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-green-400 transition-colors">
                          <img 
                            src="/road-pothole.svg" 
                            alt="Road Pothole Example"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1">Road Damage</p>
                      </div>
                      <div className="relative group cursor-pointer">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-green-400 transition-colors">
                          <img 
                            src="/garbage-dump.svg" 
                            alt="Garbage Problem Example"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1">Waste Issue</p>
                      </div>
                      <div className="relative group cursor-pointer">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-green-400 transition-colors">
                          <img 
                            src="/air-pollution.svg" 
                            alt="Air Pollution Example"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1">Air Quality</p>
                      </div>
                      <div className="relative group cursor-pointer">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-green-400 transition-colors">
                          <img 
                            src="/waste-collection.svg" 
                            alt="Waste Collection Example"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1">Collection</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">MOBILE NUMBER</label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-gray-800 border border-gray-600 border-r-0 rounded-l-md">
                        <Phone className="w-4 h-4 text-gray-400" />
                      </div>
                      <Input 
                        placeholder="Your mobile number"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 rounded-l-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">EMAIL ADDRESS</label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-gray-800 border border-gray-600 border-r-0 rounded-l-md">
                        <Mail className="w-4 h-4 text-gray-400" />
                      </div>
                      <Input 
                        placeholder="Your email address"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 rounded-l-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Priority Level */}
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">PRIORITY LEVEL</label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Can wait</SelectItem>
                      <SelectItem value="medium">Medium - Should be addressed</SelectItem>
                      <SelectItem value="high">High - Urgent attention needed</SelectItem>
                      <SelectItem value="critical">Critical - Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Success Message */}
                {submitSuccess && (
                  <div className="bg-green-500/20 border border-green-400 rounded-lg p-4 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 font-bold text-lg">Complaint Submitted Successfully!</p>
                    <p className="text-gray-400 text-sm mt-1">Redirecting to feed...</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  onClick={handleComplaintSubmit}
                  disabled={isSubmitting || submitSuccess}
                  className="w-full bg-gradient-to-r from-green-400 to-cyan-400 text-black font-black text-lg h-12 hover:from-green-300 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      SUBMITTING...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      SUBMIT COMPLAINT
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Show Live Location Map when in Complain tab */}
            {showLocationMap && (
              <LiveLocationMap onLocationSelect={handleLocationSelect} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
