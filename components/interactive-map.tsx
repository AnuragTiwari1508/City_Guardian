'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { MapPin, Maximize2, Minimize2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Map coordinates and location interface
interface Location {
  lat: number
  lng: number
  address?: string
}

interface InteractiveMapProps {
  onLocationSelect?: (location: Location) => void
  onLocationClear?: () => void
  initialLocation?: Location
  className?: string
  height?: string
}

// Enhanced mock map component with smooth interactions
const MockMapView = ({ 
  location, 
  onLocationClick, 
  onLocationClear,
  isExpanded, 
  onToggleExpanded,
  isLoadingAddress 
}: {
  location: Location | null
  onLocationClick: (lat: number, lng: number) => void
  onLocationClear: () => void
  isExpanded: boolean
  onToggleExpanded: () => void
  isLoadingAddress: boolean
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const mapRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    setDragStart({ 
      x: e.clientX - offset.x, 
      y: e.clientY - offset.y 
    })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    
    const newOffset = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }
    setOffset(newOffset)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return
    
    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Convert pixel coordinates to lat/lng (mock conversion for Delhi area)
    const lat = 28.6139 + ((rect.height / 2 - y) / rect.height) * 0.02
    const lng = 77.2090 + ((x - rect.width / 2) / rect.width) * 0.02
    
    onLocationClick(lat, lng)
  }

  const resetView = () => {
    setOffset({ x: 0, y: 0 })
    setZoom(1)
  }

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  return (
    <div 
      ref={mapRef}
      className={`relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 rounded-lg overflow-hidden cursor-crosshair transition-all duration-300 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      style={{ 
        height: isExpanded ? '400px' : '200px',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* Grid pattern to simulate map */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'center',
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`
        }}
      />
      
      {/* Street pattern and buildings */}
      <div 
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'center',
        }}
      >
        {/* Main roads - horizontal */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`h-main-${i}`}
            className="absolute bg-gray-500 opacity-60"
            style={{
              top: `${30 + i * 70}px`,
              left: '0',
              right: '0',
              height: '4px'
            }}
          />
        ))}
        {/* Main roads - vertical */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`v-main-${i}`}
            className="absolute bg-gray-500 opacity-60"
            style={{
              left: `${40 + i * 50}px`,
              top: '0',
              bottom: '0',
              width: '4px'
            }}
          />
        ))}
        
        {/* Secondary streets - horizontal */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`h-sec-${i}`}
            className="absolute bg-gray-600 opacity-30"
            style={{
              top: `${15 + i * 35}px`,
              left: '0',
              right: '0',
              height: '1px'
            }}
          />
        ))}
        {/* Secondary streets - vertical */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`v-sec-${i}`}
            className="absolute bg-gray-600 opacity-30"
            style={{
              left: `${20 + i * 30}px`,
              top: '0',
              bottom: '0',
              width: '1px'
            }}
          />
        ))}

        {/* Building blocks */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`building-${i}`}
            className="absolute bg-gray-700 opacity-20 rounded-sm"
            style={{
              left: `${Math.random() * 300 + 50}px`,
              top: `${Math.random() * 200 + 30}px`,
              width: `${Math.random() * 30 + 20}px`,
              height: `${Math.random() * 40 + 15}px`
            }}
          />
        ))}

        {/* Parks/green areas */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`park-${i}`}
            className="absolute bg-green-600 opacity-20 rounded-lg"
            style={{
              left: `${100 + i * 120}px`,
              top: `${80 + i * 60}px`,
              width: '60px',
              height: '40px'
            }}
          />
        ))}
      </div>

      {/* Location pin with pulse effect */}
      {location && (
        <>
          {/* Pulse ring */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: '50%',
              top: '50%',
            }}
          >
            <div className="w-16 h-16 rounded-full bg-red-500 bg-opacity-20 animate-ping" />
          </div>
          
          {/* Main pin */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-full z-20 animate-bounce"
            style={{
              left: '50%',
              top: '50%',
            }}
          >
            <div className="relative">
              <MapPin className="w-8 h-8 text-red-500 drop-shadow-lg" fill="currentColor" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
          </div>
        </>
      )}

      {/* Top Controls */}
      <div className="absolute top-3 right-3 flex gap-2">
        {location && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onLocationClear()
            }}
            className="bg-red-700 border-red-600 text-red-300 hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            resetView()
          }}
          className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpanded()
          }}
          className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            zoomIn()
          }}
          className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 px-2"
          disabled={zoom >= 3}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="bg-gray-900 bg-opacity-75 px-2 py-1 rounded text-xs text-gray-400 font-mono text-center">
          {zoom.toFixed(1)}x
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            zoomOut()
          }}
          className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 px-2"
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-3 left-3 bg-gray-900 bg-opacity-75 px-2 py-1 rounded text-xs text-gray-400 font-mono border border-gray-700">
        {location ? 'Pin placed • Drag to pan' : 'Click to place pin • Drag to pan'}
      </div>

      {/* Location info card */}
      {location && (
        <div className="absolute bottom-3 right-3 bg-gray-900 bg-opacity-95 backdrop-blur-sm px-4 py-3 rounded-lg border border-gray-600 shadow-lg max-w-xs">
          <div className="text-xs text-gray-300 font-mono space-y-1">
            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              LOCATION SELECTED
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-gray-500 text-[10px]">LATITUDE</div>
                <div className="text-white">{location.lat.toFixed(6)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-[10px]">LONGITUDE</div>
                <div className="text-white">{location.lng.toFixed(6)}</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-gray-500 text-[10px]">ADDRESS</div>
              {isLoadingAddress ? (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-400">Loading address...</span>
                </div>
              ) : location.address ? (
                <div className="text-green-400 text-xs leading-tight">{location.address}</div>
              ) : (
                <div className="text-gray-500 text-xs">Address not available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InteractiveMap({ 
  onLocationSelect, 
  onLocationClear,
  initialLocation,
  className = "",
  height = "200px"
}: InteractiveMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  const handleLocationClear = useCallback(() => {
    setSelectedLocation(null)
    onLocationClear?.()
  }, [onLocationClear])

  // Simulate address lookup
  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number): Promise<string> => {
    // Mock address generation based on Delhi/NCR area
    const addresses = [
      "MG Road, Sector 14, Gurugram",
      "Nehru Place, New Delhi",
      "Green Park Extension, Delhi",
      "Cyber City, Gurugram",
      "Connaught Place, New Delhi",
      "Karol Bagh, Delhi",
      "India Gate, New Delhi",
      "Lajpat Nagar, Delhi",
      "Rajouri Garden, Delhi",
      "Saket, New Delhi"
    ]
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    return addresses[Math.floor(Math.random() * addresses.length)]
  }, [])

  const handleLocationClick = useCallback(async (lat: number, lng: number) => {
    const location: Location = { lat, lng }
    
    setSelectedLocation(location)
    setIsLoadingAddress(true)
    
    // Get address in background
    try {
      const address = await getAddressFromCoordinates(lat, lng)
      const locationWithAddress = { ...location, address }
      setSelectedLocation(locationWithAddress)
      onLocationSelect?.(locationWithAddress)
    } catch (error) {
      onLocationSelect?.(location)
    } finally {
      setIsLoadingAddress(false)
    }
  }, [onLocationSelect, getAddressFromCoordinates])

  return (
    <div className={`w-full ${className}`}>
      <MockMapView
        location={selectedLocation}
        onLocationClick={handleLocationClick}
        onLocationClear={handleLocationClear}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded(!isExpanded)}
        isLoadingAddress={isLoadingAddress}
      />
    </div>
  )
}