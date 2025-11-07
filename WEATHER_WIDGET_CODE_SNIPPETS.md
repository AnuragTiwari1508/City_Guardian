# Weather Widget - Code Integration Snippets

## Complete WeatherWidget Component

**File**: `components/weather-widget.tsx`

```tsx
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

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  // Key Features:
  // ✅ Fetches real-time weather from Open-Meteo API (free, no key)
  // ✅ Uses browser geolocation for user's location
  // ✅ Draggable with mouse and touch support
  // ✅ Shows loading, error, and success states
  // ✅ Displays city, temp, humidity, weather icon
  // ✅ Close and refresh buttons
  // ✅ Responsive and mobile-friendly
  // ✅ Styled with Tailwind CSS

  // [... full implementation in actual file ...]
}
```

## Integration into Environmental Dashboard

**File**: `components/environmental-dashboard.tsx`

**Step 1: Import the component**
```tsx
import WeatherWidget from "@/components/weather-widget"
```

**Step 2: Add component to JSX (at the bottom, before closing divs)**
```tsx
export default function EnvironmentalDashboard() {
  // ... existing code ...

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono relative overflow-hidden">
      {/* ... existing dashboard content ... */}
      
      {/* Built with indicator */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 text-xs text-gray-500">
        <span>Built with</span>
        <Zap className="w-4 h-4 text-green-400" />
      </div>

      {/* Weather Widget */}
      <WeatherWidget />
    </div>
  )
}
```

## Key Code Sections Explained

### 1. Fetching Weather Data

```tsx
const fetchWeatherData = async () => {
  // Get user's location
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords

      // Fetch from Open-Meteo (free API, no key required)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
      )

      const data = await response.json()
      
      // Get city name via reverse geocoding
      const city = await getCityName(latitude, longitude)

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        weatherCode: data.current.weather_code,
        weatherDescription: getWeatherDescription(data.current.weather_code),
        city
      })
    },
    (err) => {
      setError("Unable to access location")
    }
  )
}
```

### 2. Drag Functionality

```tsx
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
  const maxY = window.innerHeight - 150

  setPosition({
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  })
}
```

### 3. Weather Code to Icon/Description Mapping

```tsx
const getWeatherIcon = (code: number) => {
  if (code === 0 || code === 1) return <Sun className="w-6 h-6 text-yellow-400" />
  if (code >= 2 && code <= 3) return <Cloud className="w-6 h-6 text-gray-300" />
  if (code >= 51 && code <= 67) return <CloudRain className="w-6 h-6 text-blue-400" />
  if (code >= 71 && code <= 86) return <CloudSnow className="w-6 h-6 text-blue-200" />
  if (code >= 95) return <CloudRain className="w-6 h-6 text-purple-400" />
  return <Wind className="w-6 h-6 text-gray-400" />
}

const getWeatherDescription = (code: number): string => {
  const weatherCodes: { [key: number]: string } = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    // ... more codes
    95: "Thunderstorm",
  }
  return weatherCodes[code] || "Unknown"
}
```

### 4. Responsive Positioning

```tsx
useEffect(() => {
  const initPosition = () => {
    if (widgetRef.current) {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const widgetWidth = 220
      const widgetHeight = widgetRef.current.offsetHeight || 150
      
      // Default to bottom-right with 20px padding
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
```

### 5. Widget JSX Structure

```tsx
return (
  <div
    ref={widgetRef}
    className="fixed z-50 w-[220px] bg-gray-900/90 backdrop-blur-sm border border-green-500/30 rounded-lg shadow-lg shadow-green-500/20"
    style={{
      left: `${position.x}px`,
      top: `${position.y}px`,
      cursor: isDragging ? "grabbing" : "grab"
    }}
    onMouseDown={handleMouseDown}
    onTouchStart={handleTouchStart}
  >
    <div className="p-3 relative">
      {/* Close Button */}
      <button onClick={(e) => { e.stopPropagation(); setIsVisible(false) }}>
        <X className="w-4 h-4" />
      </button>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Fetching weather...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Weather Data */}
      {!loading && !error && weather && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-green-400">{weather.city}</h3>
          <p className="text-xs text-gray-400">{weather.weatherDescription}</p>
          <div className="text-2xl font-bold text-white">{weather.temperature}°C</div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Droplets className="w-4 h-4" />
            <span>Humidity: {weather.humidity}%</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); fetchWeatherData() }}>
            Refresh
          </button>
        </div>
      )}
    </div>
  </div>
)
```

## Tailwind CSS Classes Used

### Layout & Positioning
- `fixed` - Fixed positioning
- `z-50` - High z-index (stays on top)
- `w-[220px]` - 220px width
- `bottom-4 right-4` - Default position

### Styling
- `bg-gray-900/90` - Semi-transparent dark background
- `backdrop-blur-sm` - Blur effect
- `border border-green-500/30` - Green border with opacity
- `rounded-lg` - Rounded corners
- `shadow-lg shadow-green-500/20` - Green glow shadow

### Typography
- `text-green-400` - Green text (dashboard theme)
- `text-white` - White text for temperature
- `text-gray-400` - Gray text for secondary info
- `text-xs` - Extra small text
- `text-sm` - Small text
- `text-2xl` - Large text for temperature
- `font-bold` - Bold font
- `font-semibold` - Semi-bold font

### Interactive
- `cursor-grab` / `cursor-grabbing` - Drag cursors
- `hover:text-white` - Hover effects
- `transition-colors` - Smooth color transitions

### Layout Utilities
- `flex items-center justify-between` - Flexbox layout
- `gap-2` - Spacing between elements
- `p-3` - Padding
- `space-y-2` - Vertical spacing

## API Endpoints Used

### 1. Weather Data API
```
GET https://api.open-meteo.com/v1/forecast
Parameters:
  - latitude: User's latitude
  - longitude: User's longitude
  - current: temperature_2m,relative_humidity_2m,weather_code
  - timezone: auto

Response:
{
  "current": {
    "temperature_2m": 28.5,
    "relative_humidity_2m": 65,
    "weather_code": 2
  }
}
```

### 2. Geocoding API (for city name)
```
GET https://geocoding-api.open-meteo.com/v1/search
Parameters:
  - latitude: User's latitude
  - longitude: User's longitude
  - count: 1
  - language: en

Response:
{
  "results": [
    {
      "name": "San Francisco",
      ...
    }
  ]
}
```

## Dependencies Required

All already in your project:
- ✅ `react` - React library
- ✅ `lucide-react` - Icon components
- ✅ `tailwindcss` - Styling

**NO additional npm packages needed!**

## File Structure

```
/workspaces/cityguardian_FRONTEND/
├── components/
│   ├── weather-widget.tsx           ← NEW: Weather widget component
│   └── environmental-dashboard.tsx  ← MODIFIED: Added WeatherWidget
├── app/
│   └── environmental/
│       └── page.tsx                 ← Uses EnvironmentalDashboard
├── WEATHER_WIDGET_IMPLEMENTATION.md ← Full documentation
├── WEATHER_WIDGET_QUICKSTART.md     ← Quick start guide
└── WEATHER_WIDGET_CODE_SNIPPETS.md  ← This file
```

## Testing the Widget

1. **Start dev server**: `pnpm dev`
2. **Navigate to**: http://localhost:3000/environmental
3. **Grant location permission** when prompted
4. **Test features**:
   - ✅ Weather data displays
   - ✅ Drag widget around
   - ✅ Click refresh
   - ✅ Click close
   - ✅ Resize window
   - ✅ Mobile responsiveness

## Common Customizations

### Change Default Position (Top-Left)
```tsx
setPosition({
  x: 20,  // 20px from left
  y: 20   // 20px from top
})
```

### Change Widget Width
```tsx
className="fixed z-50 w-[300px]"  // Change from 220px to 300px
```

### Add Fahrenheit Toggle
```tsx
const [unit, setUnit] = useState<'C' | 'F'>('C')
const displayTemp = unit === 'F' 
  ? Math.round(weather.temperature * 9/5 + 32)
  : weather.temperature

// In JSX:
<div>{displayTemp}°{unit}</div>
<button onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}>
  Toggle Unit
</button>
```

### Persist Widget Position
```tsx
// Save position to localStorage
useEffect(() => {
  localStorage.setItem('weatherWidgetPosition', JSON.stringify(position))
}, [position])

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('weatherWidgetPosition')
  if (saved) setPosition(JSON.parse(saved))
}, [])
```

---

**Status**: ✅ Fully Implemented  
**Server**: Running on http://localhost:3000  
**Route**: `/environmental`  
**Ready**: Yes!
