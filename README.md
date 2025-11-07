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