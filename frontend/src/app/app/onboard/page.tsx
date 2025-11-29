'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { AuthAPI } from '@/lib/api/auth'
import { HealthAPI } from '@/lib/api/health'
import { FinanceAPI } from '@/lib/api/finance'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

const steps = [
  { id: 'welcome', title: 'Welcome to LifeOS' },
  { id: 'account', title: 'Set Up Your Account' },
  { id: 'preferences', title: 'Your Preferences' },
  { id: 'integrations', title: 'Connect Your Services' },
  { id: 'ai', title: 'Meet Your AI Assistant' },
  { id: 'complete', title: 'You\'re All Set!' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [accountData, setAccountData] = useState({
    fullName: '',
    email: '',
    timezone: 'America/New_York',
    language: 'en',
  })

  const [preferences, setPreferences] = useState({
    notifications: true,
    analytics: true,
    aiTraining: true,
  })

  const [integrations, setIntegrations] = useState({
    google: false,
    fitbit: false,
    plaid: false,
  })

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 1) {
        // Save account data
        setLoading(true)
        try {
          await AuthAPI.updateProfile(accountData)
          setLoading(false)
          setCurrentStep(currentStep + 1)
        } catch (err) {
          console.error('Error saving account:', err)
          setLoading(false)
        }
      } else if (currentStep === 2) {
        // Save preferences
        setLoading(true)
        try {
          await AuthAPI.updatePreferences(preferences)
          setLoading(false)
          setCurrentStep(currentStep + 1)
        } catch (err) {
          console.error('Error saving preferences:', err)
          setLoading(false)
        }
      } else {
        setCurrentStep(currentStep + 1)
      }
    } else {
      // Complete onboarding
      try {
        await AuthAPI.completeOnboarding()
        router.push('/app/dashboard')
      } catch (err) {
        console.error('Error completing onboarding:', err)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleIntegrationConnect = async (service: 'google' | 'fitbit' | 'plaid') => {
    try {
      if (service === 'google') {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`
      } else if (service === 'fitbit') {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/health/fitbit/auth`
      } else if (service === 'plaid') {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/finance/plaid/auth`
      }
    } catch (err) {
      console.error(`Error connecting ${service}:`, err)
    }
  }

  // Keyboard navigation
  useKeyboardShortcuts({
    'ArrowRight': () => {
      if (currentStep < steps.length - 1) handleNext()
    },
    'ArrowLeft': () => {
      if (currentStep > 0) handleBack()
    },
    'Enter': () => {
      if (currentStep < steps.length - 1) handleNext()
    },
  })

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center">
            <div className="w-24 h-24 bg-primary-start rounded-full flex items-center justify-center mx-auto mb-8" aria-hidden="true">
              <span className="text-4xl">🚀</span>
            </div>
            <h1 id="step-0" className="text-4xl font-bold text-gray-900 mb-4">Welcome to LifeOS</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Your personal operating system for a healthier, more productive, and balanced life.
              Let's get you set up in just a few minutes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900">Track Everything</h3>
                <p className="text-sm text-gray-600">Health, finance, learning, and more in one place</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600">🤖</span>
                </div>
                <h3 className="font-semibold text-gray-900">AI-Powered Insights</h3>
                <p className="text-sm text-gray-600">Personalized recommendations and automation</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600">🎯</span>
                </div>
                <h3 className="font-semibold text-gray-900">Achieve Goals</h3>
                <p className="text-sm text-gray-600">Set and track progress towards your objectives</p>
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="max-w-md mx-auto">
            <h2 id="step-1" className="text-2xl font-bold text-gray-900 mb-6 text-center">Set Up Your Account</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={accountData.fullName}
                  onChange={(e) => setAccountData({ ...accountData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
                  placeholder="Enter your full name"
                  aria-describedby="fullName-help"
                  required
                />
                <span id="fullName-help" className="sr-only">Enter your full name to personalize your LifeOS experience</span>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
                  placeholder="Enter your email"
                  aria-describedby="email-help"
                  required
                />
                <span id="email-help" className="sr-only">Enter your email address for account setup and notifications</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={accountData.timezone}
                  onChange={(e) => setAccountData({ ...accountData, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={accountData.language}
                  onChange={(e) => setAccountData({ ...accountData, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="max-w-md mx-auto">
            <h2 id="step-2" className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">Notifications</span>
                  <p className="text-sm text-gray-500">Receive updates about your progress</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.notifications}
                    onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">Analytics</span>
                  <p className="text-sm text-gray-500">Help improve LifeOS with usage data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">AI Training</span>
                  <p className="text-sm text-gray-500">Allow data to improve AI recommendations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.aiTraining}
                    onChange={(e) => setPreferences({ ...preferences, aiTraining: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                </label>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 id="step-3" className="text-2xl font-bold text-gray-900 mb-6 text-center">Connect Your Services</h2>
            <p className="text-gray-600 mb-8 text-center">
              Connect your favorite services to get the most out of LifeOS. You can skip this and connect later.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-red-600 font-bold">G</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Google Calendar</h3>
                    <p className="text-sm text-gray-500">Sync your schedule and optimize your time</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleIntegrationConnect('google')}
                >
                  Connect
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-600">🏃</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Fitbit</h3>
                    <p className="text-sm text-gray-500">Track your health and fitness data</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleIntegrationConnect('fitbit')}
                >
                  Connect
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600">💳</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Banking (Plaid)</h3>
                    <p className="text-sm text-gray-500">Connect your bank accounts for budgeting</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleIntegrationConnect('plaid')}
                >
                  Connect
                </Button>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-8" aria-hidden="true">
              <span className="text-4xl">🤖</span>
            </div>
            <h2 id="step-4" className="text-2xl font-bold text-gray-900 mb-4">Meet Your AI Assistant</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Your personal AI assistant is here to help you optimize your life. It can provide recommendations,
              automate tasks, and help you achieve your goals.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-sm text-gray-700 italic">
                "Based on your recent activity, I recommend scheduling a 30-minute workout today to maintain your fitness goals."
              </p>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8" aria-hidden="true">
              <span className="text-4xl">✅</span>
            </div>
            <h2 id="step-5" className="text-2xl font-bold text-gray-900 mb-4">You're All Set!</h2>
            <p className="text-lg text-gray-600 mb-8">
              Welcome to LifeOS. Your journey to a better life starts now.
            </p>
            <Button onClick={handleNext} size="lg">
              Get Started
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-start to-primary-end flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-white/10">
        <div
          className="h-1 bg-white transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="flex justify-center py-8">
        <div className="text-white">
          <h1 className="text-2xl font-bold">LifeOS</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4" role="main">
        <div
          className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full"
          role="region"
          aria-labelledby={`step-${currentStep}`}
        >
          {renderStep()}
        </div>
      </main>

      {/* Navigation */}
      {currentStep < steps.length - 1 && (
        <footer className="flex justify-between items-center p-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="text-white hover:bg-white/10"
          >
            Back
          </Button>
          <div className="text-white text-sm">
            {currentStep + 1} of {steps.length}
          </div>
          <Button
            onClick={handleNext}
            disabled={loading || (currentStep === 1 && (!accountData.fullName || !accountData.email))}
            className="bg-white text-primary-start hover:bg-gray-100"
          >
            {loading ? 'Saving...' : currentStep === steps.length - 2 ? 'Complete' : 'Next'}
          </Button>
        </footer>
      )}
    </div>
  )
}