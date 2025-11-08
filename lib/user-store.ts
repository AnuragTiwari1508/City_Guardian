// Shared in-memory user storage
// In production, replace this with a real database

export const users = new Map<string, any>()

// Pre-populate with demo user
users.set('demo@cityguardian.net', {
  id: '1',
  email: 'demo@cityguardian.net',
  name: 'Demo User',
  password: 'guardian2025',
  userType: 'citizen',
  createdAt: new Date().toISOString()
})
