# 🎮 CityGuardian - Environmental Monitoring Dashboard

A gaming-themed environmental monitoring platform with Matrix/Cyberpunk aesthetics. Real-time sensor data visualization with a mission control interface.

## 🚀 Live Demo

- **Main App**: [Vercel Deployment Link]
- **Environmental Dashboard**: `/environmental`

## ✨ Features

### 🎯 Gaming Theme
- **Matrix/Cyberpunk Aesthetic**: Dark theme with neon green accents
- **Real-time Animations**: Glitch effects, neon glow, scanlines
- **Mission Control Interface**: Gaming-style UI with operative classes
- **Interactive Particles**: Dynamic background effects

### 📊 Environmental Monitoring
- **Live Sensor Data**: Real-time air quality monitoring
- **Interactive Charts**: PM10, PM2.5, CO2, Temperature tracking
- **Alert System**: Real-time environmental alerts
- **Coverage Analytics**: Sensor network status monitoring

### 🎮 User Roles
- **Citizen Operative**: Field reconnaissance & evidence collection
- **Field Agent**: Mission execution & tactical operations  
- **Command Center**: Strategic oversight & zone management
- **Sensor Network**: Real-time environmental monitoring

## 🛠 Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Package Manager**: pnpm (Vercel optimized)
- **Deployment**: Vercel

## 🔧 Hardware Models

> **📸 How to add images**: 
> 1. **Direct Paste**: Copy your image and paste it directly in the gallery area below
> 2. **Base64 Embed**: Convert your image to base64 and paste in the `src="data:image/jpeg;base64,YOUR_BASE64_HERE"`
> 3. **GitHub Drag-Drop**: In GitHub editor, simply drag and drop your images in the marked areas

### 📷 Hardware Gallery - Complete Device Collection

<!-- ===== PASTE ALL YOUR HARDWARE IMAGES HERE ===== -->
<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="d![alt text](<WhatsApp Image 2025-11-08 at 10.12.03_09594631.jpg>)," alt="Main Environmental Sensor Array" width="280" height="200" />
        <br><b>Environmental Monitoring Device</b>
        <br><i>Arduino-based sensor array with LCD display</i>
      </td>
      <td align="center">
        <img src="data:image/jpeg;base64," alt="Compact Monitoring Unit" width="280" height="200" />
        <br><b>Compact Monitoring Unit</b>
        <br><i>Portable personal air quality tracker</i>
      </td>
      <td align="center">
        <img src="data:image/jpeg;base64," alt="Network Gateway Device" width="280" height="200" />
        <br><b>Network Gateway Hub</b>
        <br><i>Central coordination device</i>
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="data:image/jpeg;base64," alt="Sensor Assembly View" width="280" height="200" />
        <br><b>Sensor Assembly</b>
        <br><i>Internal component layout</i>
      </td>
      <td align="center">
        <img src="data:image/jpeg;base64," alt="Field Deployment Setup" width="280" height="200" />
        <br><b>Field Deployment</b>
        <br><i>Outdoor installation setup</i>
      </td>
      <td align="center">
        <img src="data:image/jpeg;base64," alt="Control Panel Interface" width="280" height="200" />
        <br><b>Control Panel</b>
        <br><i>User interface and controls</i>
      </td>
    </tr>
  </table>
</div>

<!-- ===== END OF IMAGE GALLERY ===== -->

### Device Specifications Overview

#### 🌡️ Environmental Monitoring Device
**Components:**
- **Microcontroller**: Arduino-based processing unit
- **Sensors**: 
  - Air Quality Sensor (PM2.5, PM10)
  - Temperature & Humidity Sensor
  - CO2 Detection Module
  - Ultrasonic Distance Sensor
- **Display**: LCD Screen for real-time data visualization
- **Connectivity**: WiFi module for cloud data transmission
- **Power**: Rechargeable battery with solar panel option

**Features:**
- **Real-time Data Collection**: Continuous environmental monitoring
- **Local Display**: Instant readings on LCD screen
- **Cloud Integration**: Automatic data upload to dashboard
- **Weather Resistant**: Outdoor deployment capability
- **Low Power Consumption**: Extended battery life
- **Modular Design**: Easy sensor replacement and upgrades

#### 📱 Compact Monitoring Unit
**Features:**
- **Portable Design**: Lightweight and battery-powered
- **Personal Monitoring**: Individual air quality tracking
- **Mobile App Integration**: Real-time data on smartphone
- **Quick Setup**: Plug-and-play installation

#### 🌐 Network Gateway Device
**Capabilities:**
- **Multi-Sensor Management**: Coordinate up to 50 devices
- **Data Aggregation**: Central processing and analytics
- **Edge Computing**: Local AI processing capabilities
- **Redundant Connectivity**: Multiple communication protocols

#### ⚡ Technical Specifications
| Parameter | Value | Range |
|-----------|-------|-------|
| **Operating Voltage** | 5V DC | 4.5V - 5.5V |
| **Data Transmission** | WiFi 802.11 b/g/n | 2.4GHz |
| **Temperature Range** | -40°C to +85°C | ±2% accuracy |
| **Humidity Range** | 0-100% RH | ±3% accuracy |
| **PM2.5/PM10 Range** | 0-999 μg/m³ | ±10% accuracy |
| **Sampling Rate** | Every 30 seconds | Configurable |
| **Power Consumption** | 150mA average | Sleep: 10μA |
| **Deployment** | Indoor/Outdoor | IP65 rated |

---

### 📸 Image Integration Guide

#### Method 1: Direct GitHub Paste (Recommended)
1. Open this README file on GitHub
2. Click "Edit" button
3. Copy your image (Ctrl+C)
4. Paste directly where you see the placeholder comments
5. GitHub will automatically upload and embed the image

#### Method 2: Base64 Embedding
```bash
# Convert image to base64 (Linux/Mac)
base64 -i your-image.jpg

# Then replace the empty base64 string in the HTML img tags above
```

#### Method 3: Upload to Issues/PR (Quick)
1. Create a new issue or comment
2. Drag and drop your image
3. Copy the generated markdown link
4. Paste in README

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended for Vercel deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/AnuragTiwari1508/cityguardian_FRONTEND

# Navigate to project directory  
cd cityguardian_FRONTEND

# Install dependencies with pnpm
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### 🌐 Access Points

- **Home**: `http://localhost:3000/`
- **Environmental Dashboard**: `http://localhost:3000/environmental`
- **Login Portal**: Click "INITIALIZE" button on home page

## 🎨 Design System

### Color Scheme
```css
--primary: Matrix Green (#00ff99)
--secondary: Cyber Cyan (#00b8ff)  
--accent: Neon Green (#00ff99)
--background: Deep Black (#000000)
--surface: Dark Gray (#0a0a0a)
```

### Typography
- **Font**: Monospace (Terminal/Console style)
- **Headers**: Black weight with neon glow effects
- **Body**: Regular weight with green/cyan accents

## 📱 Responsive Design

- **Desktop**: Full dashboard experience
- **Tablet**: Responsive grid layouts
- **Mobile**: Optimized interface with touch interactions

## 🔧 Environment Variables

```env
# Optional - for analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect GitHub Repository**
   ```bash
   # Vercel will auto-detect Next.js and pnpm
   # No additional configuration needed
   ```

2. **Environment Setup**
   - Framework Preset: `Next.js`
   - Node Version: `18.x`
   - Package Manager: `pnpm`

3. **Build Settings**
   ```bash
   # Build Command (auto-detected)
   pnpm build
   
   # Output Directory (auto-detected)  
   .next
   ```

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 📊 Features Breakdown

### Environmental Dashboard (`/environmental`)
- **Live Metrics**: Active sensors, alerts, PM2.5 averages
- **24H Air Quality Chart**: PM10 and PM2.5 tracking
- **Environmental Parameters**: CO2 and temperature monitoring
- **Real-time Updates**: Simulated sensor data updates every 3 seconds

### Landing Page (`/`)
- **Hero Section**: Gaming-style mission briefing
- **Operation Modes**: Three distinct user classes
- **Live Statistics**: Real-time network status
- **Interactive Particles**: Dynamic background effects

### Login Portal
- **Role Selection**: Four operative classes
- **Gaming Authentication**: Mission control login interface
- **Demo Credentials**: Provided for testing

## 🎮 Gaming Elements

### Animations
- **Neon Glow**: CSS animations for text and buttons
- **Glitch Effects**: Random displacement animations  
- **Particle System**: Canvas-based interactive background
- **Scanlines**: Retro terminal overlay effects

### Sound Design (Future Enhancement)
- Terminal beep sounds for interactions
- Ambient cyberpunk background music
- Alert notification sounds

## 🔮 Future Enhancements

### Phase 2
- [ ] Real IoT sensor integration
- [ ] User authentication system  
- [ ] Data persistence with database
- [ ] Mobile app companion

### Phase 3  
- [ ] AI-powered predictions
- [ ] Gamification system with XP/levels
- [ ] Social features and leaderboards
- [ ] AR/VR environmental visualization

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Design Inspiration**: Matrix, Cyberpunk 2077, Terminal interfaces
- **UI Components**: Radix UI team
- **Icons**: Lucide React contributors

---

**Built with 💚 by the CityGuardian Team**

*Protecting cities through gamified environmental monitoring* 🌍⚡