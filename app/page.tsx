"use client"

import { useState } from "react"
import LandingPage from "@/components/landing-page"
import LoginPortal from "@/components/login-portal"

export default function Home() {
  const [showLogin, setShowLogin] = useState(false)

  if (showLogin) {
    return <LoginPortal onBack={() => setShowLogin(false)} />
  }

  return <LandingPage onGetStarted={() => setShowLogin(true)} />
}
