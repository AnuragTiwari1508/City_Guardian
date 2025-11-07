"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ImageIcon, MapPin, AlertCircle, Loader2 } from "lucide-react"

const ISSUE_CATEGORIES = [
  { value: "air-quality", label: "Air Quality", emoji: "💨" },
  { value: "pothole", label: "Pothole/Road Damage", emoji: "🕳️" },
  { value: "street-light", label: "Broken Street Light", emoji: "💡" },
  { value: "noise", label: "Noise Pollution", emoji: "🔊" },
  { value: "waste", label: "Waste/Debris", emoji: "🗑️" },
  { value: "water", label: "Water Issue", emoji: "💧" },
  { value: "vegetation", label: "Vegetation", emoji: "🌳" },
  { value: "other", label: "Other", emoji: "📍" },
]

export default function IssueForm() {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    severity: "medium",
  })

  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [loadingLocation, setLoadingLocation] = useState(false)

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
        
        // Update form with coordinates
        setFormData(prev => ({ ...prev, latitude, longitude }))
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await response.json()
          const address = data.locality 
            ? `${data.locality}, ${data.city || data.principalSubdivision}` 
            : `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`
          
          setFormData(prev => ({ ...prev, location: address }))
        } catch (error) {
          // If reverse geocoding fails, just show coordinates
          setFormData(prev => ({ 
            ...prev, 
            location: `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}` 
          }))
        }
        
        setLoadingLocation(false)
      },
      (error) => {
        console.error("Geolocation error:", error)
        alert(`Unable to get location: ${error.message}. Please enter manually.`)
        setLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Submitting issue:", formData)
    console.log("Coordinates:", { lat: formData.latitude, lng: formData.longitude })
    // Reset form
    setFormData({ 
      title: "", 
      category: "", 
      description: "", 
      location: "", 
      latitude: null,
      longitude: null,
      severity: "medium" 
    })
    setUploadedImages([])
  }

  const selectedCategory = ISSUE_CATEGORIES.find((cat) => cat.value === formData.category)

  return (
    <Card className="p-8 border-accent/30 bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="w-6 h-6 text-accent" />
        <h2 className="text-2xl font-bold text-foreground">Report an Issue</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">Category</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ISSUE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.value })}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  formData.category === cat.value
                    ? "border-accent bg-accent/10"
                    : "border-border/30 bg-card/30 hover:border-accent/50"
                }`}
              >
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <div className="text-xs font-semibold text-foreground">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Issue Title</label>
          <Input
            type="text"
            placeholder="Brief title of the issue..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-input border-border/50 text-foreground placeholder:text-foreground/40"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Location</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Street address or location..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="flex-1 bg-input border-border/50 text-foreground placeholder:text-foreground/40"
              required
            />
            <Button 
              type="button" 
              variant="outline" 
              className="border-accent/30 bg-transparent hover:bg-accent/10"
              onClick={getCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
            </Button>
          </div>
          {formData.latitude && formData.longitude && (
            <p className="text-xs text-green-400 mt-1">
              ✓ Location captured: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </p>
          )}
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Severity Level</label>
          <div className="flex gap-2">
            {["low", "medium", "high"].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData({ ...formData, severity: level })}
                className={`flex-1 py-2 px-3 rounded-lg border-2 font-semibold capitalize transition-all ${
                  formData.severity === level
                    ? level === "low"
                      ? "border-green-500/50 bg-green-500/10 text-green-400"
                      : level === "medium"
                        ? "border-secondary/50 bg-secondary/10 text-secondary"
                        : "border-destructive/50 bg-destructive/10 text-destructive"
                    : "border-border/30 bg-card/30 text-foreground/60 hover:border-border/60"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
          <Textarea
            placeholder="Provide detailed description of the issue..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-input border-border/50 text-foreground placeholder:text-foreground/40 min-h-32"
            required
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">Photos (Optional)</label>
          <div className="border-2 border-dashed border-accent/30 rounded-lg p-8 text-center hover:border-accent/60 transition-colors cursor-pointer">
            <ImageIcon className="w-8 h-8 text-accent/50 mx-auto mb-2" />
            <p className="text-foreground/70">Click or drag to upload photos</p>
            <p className="text-sm text-foreground/50 mt-1">Max 5 photos, 10MB each</p>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-accent to-secondary text-foreground font-bold h-12 neon-glow"
        >
          Submit Issue Report
        </Button>

        <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 text-sm text-foreground/80">
          <p className="font-semibold text-accent mb-2">💰 You'll earn:</p>
          <p>Base reward: 100 points + 50 bonus if resolved</p>
        </div>
      </form>
    </Card>
  )
}
