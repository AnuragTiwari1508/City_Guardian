"use client"

import { useEffect, useState, useRef } from "react"
import { X, Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, AlertCircle } from "lucide-react"

interface WeatherData {
  temperature: number
  humidity: number
  weatherCode: number
  weatherDescription: string
  city: string
}

interface Position {
  x: number
  y: number
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 })
  
  const widgetRef = useRef<HTMLDivElement>(null)

  // Initialize position to bottom-right
  useEffect(() => {
    const initPosition = () => {
      if (widgetRef.current) {
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const widgetWidth = 220
        const widgetHeight = widgetRef.current.offsetHeight || 150
        
        setPosition({
          x: windowWidth - widgetWidth - 20,
          y: windowHeight - widgetHeight - 20
        })
      }
    }
    
    initPosition()
    window.addEventListener('resize', initPosition)
    return () => window.removeEventListener('resize', initPosition)
  }, [weather])

  useEffect(() => {
    fetchWeatherData()
  }, [])

  const getWeatherDescription = (code: number): string => {
    const weatherCodes: { [key: number]: string } = {
      0: "Clear Sky",
      1: "Mainly Clear",
      2: "Partly Cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Depositing Rime Fog",
      51: "Light Drizzle",
      53: "Moderate Drizzle",
      55: "Dense Drizzle",
      61: "Slight Rain",
      63: "Moderate Rain",
      65: "Heavy Rain",
      71: "Slight Snow",
      73: "Moderate Snow",
      75: "Heavy Snow",
      77: "Snow Grains",
      80: "Slight Rain Showers",
      81: "Moderate Rain Showers",
      82: "Violent Rain Showers",
      85: "Slight Snow Showers",
      86: "Heavy Snow Showers",
      95: "Thunderstorm",
      96: "Thunderstorm with Hail",
      99: "Thunderstorm with Heavy Hail"
    }
    return weatherCodes[code] || "Unknown"
  }

  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) return <Sun className="w-6 h-6 text-yellow-400" />
    if (code >= 2 && code <= 3) return <Cloud className="w-6 h-6 text-gray-300" />
    if (code >= 51 && code <= 67) return <CloudRain className="w-6 h-6 text-blue-400" />
    if (code >= 71 && code <= 86) return <CloudSnow className="w-6 h-6 text-blue-200" />
    if (code >= 95) return <CloudRain className="w-6 h-6 text-purple-400" />
    return <Wind className="w-6 h-6 text-gray-400" />
  }

  const getCityName = async (lat: number, lon: number): Promise<string> => {
    try {
      // Use BigDataCloud free reverse geocoding API (no key required, no rate limits)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      )
      const data = await response.json()
      
      // Get the most relevant location name
      return data.city || 
             data.locality || 
             data.principalSubdivision || 
             data.countryName || 
             "Your Location"
    } catch (error) {
      console.error("Error fetching city name:", error)
      // Return a friendly fallback instead of "Unknown"
      return "Your Location"
    }
  }

  const fetchWeatherData = async () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError("Geolocation is not supported")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // Fetch weather from Open-Meteo API (free, no API key required)
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
          )

          if (!response.ok) {
            throw new Error("Failed to fetch weather data")
          }

          const data = await response.json()
          const city = await getCityName(latitude, longitude)

          setWeather({
            temperature: Math.round(data.current.temperature_2m),
            humidity: data.current.relative_humidity_2m,
            weatherCode: data.current.weather_code,
            weatherDescription: getWeatherDescription(data.current.weather_code),
            city
          })
          setLoading(false)
        } catch (err) {
          setError("Unable to fetch weather data")
          setLoading(false)
        }
      },
      (err) => {
        setError("Unable to access location")
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // Constrain to window bounds
    const maxX = window.innerWidth - 220
    const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 150)

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    })
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return

    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    const maxX = window.innerWidth - 220
    const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 150)

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("touchmove", handleTouchMove)
      window.addEventListener("touchend", handleTouchEnd)
    } else {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, dragStart])

  if (!isVisible) return null

  return (
    <div
      ref={widgetRef}
      className={`fixed z-50 w-[220px] bg-gray-900/90 backdrop-blur-sm border border-green-500/30 rounded-lg shadow-lg shadow-green-500/20 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: "none"
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="p-3 relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsVisible(false)
          }}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Close weather widget"
        >
          <X className="w-4 h-4" />
        </button>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Fetching weather...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 py-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {!loading && !error && weather && (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-green-400 truncate">
                  {weather.city}
                </h3>
                <p className="text-xs text-gray-400 truncate">
                  {weather.weatherDescription}
                </p>
              </div>
              <div className="flex-shrink-0 pr-4">
                {getWeatherIcon(weather.weatherCode)}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-white">
                  {weather.temperature}°C
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Droplets className="w-4 h-4" />
              <span>Humidity: {weather.humidity}%</span>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  fetchWeatherData()
                }}
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
