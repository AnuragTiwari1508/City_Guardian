"use client"

import { useState, useEffect } from 'react'
import { MapPin, Maximize2, Minimize2, X, Navigation, Loader2 } from 'lucide-react'

interface LiveLocationMapProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void
}

export default function LiveLocationMap({ onLocationSelect }: LiveLocationMapProps) {
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [map, setMap] = useState<any>(null)
  const [L, setL] = useState<any>(null)

  // Load Leaflet only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default)
        
        // Load CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        // Fix default marker icon
        delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
      })
    }
  }, [])

  // Get user's current location
  useEffect(() => {
    if (!L) return
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          setUserLocation({ lat: latitude, lng: longitude })
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            )
            const data = await response.json()
            const addr = data.locality 
              ? `${data.locality}, ${data.city || data.principalSubdivision}` 
              : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            setAddress(addr)
            
            // Notify parent
            if (onLocationSelect) {
              onLocationSelect({ lat: latitude, lng: longitude, address: addr })
            }
            
            setLoading(false)
          } catch (err) {
            const addr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            setAddress(addr)
            
            if (onLocationSelect) {
              onLocationSelect({ lat: latitude, lng: longitude, address: addr })
            }
            
            setLoading(false)
          }
        },
        (err) => {
          setError('Unable to get your location. Please enable location access.')
          setLoading(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } else {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
    }
  }, [L, onLocationSelect])

  // Initialize map when location is available
  useEffect(() => {
    if (!L || !userLocation || map) return

    const mapElement = document.getElementById('live-map')
    if (!mapElement) return

    try {
      const newMap = L.map('live-map').setView([userLocation.lat, userLocation.lng], 15)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(newMap)

      L.marker([userLocation.lat, userLocation.lng])
        .addTo(newMap)
        .bindPopup(`<strong>You are here</strong><br/>${address}`)
        .openPopup()

      setMap(newMap)
    } catch (error) {
      console.error('Map initialization error:', error)
      setError('Failed to load map')
    }

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [L, userLocation, address])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.map-controls')) return
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const refreshLocation = () => {
    setLoading(true)
    setError('')
    
    if (!navigator.geolocation) return
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLocation({ lat: latitude, lng: longitude })
        
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await response.json()
          const addr = data.locality 
            ? `${data.locality}, ${data.city || data.principalSubdivision}` 
            : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          setAddress(addr)
          
          if (onLocationSelect) {
            onLocationSelect({ lat: latitude, lng: longitude, address: addr })
          }
          
          if (map) {
            map.setView([latitude, longitude], 15)
          }
          
          setLoading(false)
        } catch (err) {
          const addr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          setAddress(addr)
          setLoading(false)
        }
      },
      (err) => {
        setError('Unable to refresh location')
        setLoading(false)
      }
    )
  }

  if (isMinimized) {
    return (
      <div
        className="fixed z-50 bg-black border-2 border-green-400/50 rounded-lg shadow-2xl shadow-green-500/30 cursor-pointer hover:scale-105 transition-transform"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '60px',
          height: '60px'
        }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="w-full h-full flex items-center justify-center">
          <MapPin className="w-6 h-6 text-green-400 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fixed z-50 bg-black/95 backdrop-blur-sm border-2 border-green-400/50 rounded-lg shadow-2xl shadow-green-500/30 cursor-move transition-all ${
        isDragging ? 'cursor-grabbing scale-[1.02]' : ''
      } ${isExpanded ? 'w-[600px] h-[500px]' : 'w-[350px] h-[300px]'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="bg-black border-b-2 border-green-400/50 p-3 flex items-center justify-between relative">
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,153,0.1) 2px, rgba(0,255,153,0.1) 4px)',
            }}
          />
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <MapPin className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-bold text-green-400 font-mono">LIVE LOCATION</h3>
        </div>

        <div className="flex items-center gap-2 map-controls relative z-10">
          <button
            onClick={refreshLocation}
            disabled={loading}
            className="p-1 hover:bg-green-400/10 rounded transition-colors"
            title="Refresh Location"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-green-400" />
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-green-400/10 rounded transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-green-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-green-400" />
            )}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-green-400/10 rounded transition-colors"
            title="Minimize to Icon"
          >
            <X className="w-4 h-4 text-green-400" />
          </button>
        </div>
      </div>

      {/* Map Content */}
      <div className="p-3 h-[calc(100%-120px)]">
        {loading && (
          <div className="w-full h-full flex items-center justify-center bg-gray-900/50 rounded">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-green-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-mono">Getting your location...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="w-full h-full flex items-center justify-center bg-gray-900/50 rounded">
            <div className="text-center p-4">
              <MapPin className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-red-400 font-mono">{error}</p>
            </div>
          </div>
        )}

        {userLocation && !loading && !error && L && (
          <div 
            id="live-map" 
            className="w-full h-full rounded overflow-hidden border border-green-400/30"
          />
        )}
      </div>

      {/* Footer - Location Info */}
      <div className="border-t-2 border-green-400/50 p-3 bg-black">
        <div className="flex items-start gap-2">
          <MapPin className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {loading ? (
              <p className="text-xs text-gray-400 font-mono animate-pulse">Locating...</p>
            ) : error ? (
              <p className="text-xs text-red-400 font-mono truncate">{error}</p>
            ) : (
              <>
                <p className="text-xs text-green-400 font-mono font-bold truncate">{address}</p>
                {userLocation && (
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
