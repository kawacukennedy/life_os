'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import AuthGuard from '@/components/AuthGuard'

const goals = [
  { id: 'productivity', label: 'Boost Productivity', icon: '🚀' },
  { id: 'health', label: 'Improve Health', icon: '💚' },
  { id: 'learning', label: 'Accelerate Learning', icon: '📚' },
  { id: 'finance', label: 'Manage Finances', icon: '💰' },
]

const integrations = [
  { id: 'google-calendar', label: 'Google Calendar', icon: '📅' },
  { id: 'apple-health', label: 'Apple Health', icon: '🍎' },
  { id: 'plaid', label: 'Bank Accounts', icon: '🏦' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([])

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    )
  }

  const handleIntegrationToggle = (integrationId: string) => {
    if (integrationId === 'google-calendar') {
      // Redirect to Google OAuth
      window.location.href = '/api/auth/google'
    } else {
      setSelectedIntegrations(prev =>
        prev.includes(integrationId)
          ? prev.filter(id => id !== integrationId)
          : [...prev, integrationId]
      )
    }
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleComplete = () => {
    // TODO: Save onboarding data
    console.log('Onboarding complete:', { goals: selectedGoals, integrations: selectedIntegrations })
    window.location.href = '/app/dashboard'
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Welcome to LifeOS</h1>
            <span className="text-sm text-gray-500">Step {step} of 3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-start h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">What are your main goals?</h2>
            <p className="text-gray-600 mb-6">Select all that apply to personalize your experience.</p>
            <div className="grid grid-cols-2 gap-4">
              {goals.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => handleGoalToggle(goal.id)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedGoals.includes(goal.id)
                      ? 'border-primary-start bg-primary-start/10'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">{goal.icon}</div>
                  <div className="font-medium">{goal.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Connect your accounts</h2>
            <p className="text-gray-600 mb-6">Integrate with your favorite apps for a seamless experience.</p>
            <div className="space-y-4">
              {integrations.map(integration => (
                <div
                  key={integration.id}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    selectedIntegrations.includes(integration.id)
                      ? 'border-primary-start bg-primary-start/10'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-4">{integration.icon}</div>
                      <div className="font-medium">{integration.label}</div>
                    </div>
                    <button
                      onClick={() => handleIntegrationToggle(integration.id)}
                      className="px-4 py-2 bg-primary-start text-white rounded-md hover:bg-primary-start/90"
                    >
                      {selectedIntegrations.includes(integration.id) ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">You're all set!</h2>
            <p className="text-gray-600 mb-6">
              LifeOS is now personalized for you. Let's start optimizing your life.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">Your setup:</h3>
              <p className="text-sm text-gray-600">
                Goals: {selectedGoals.join(', ')}<br />
                Integrations: {selectedIntegrations.join(', ')}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} className="ml-auto">
              Next
            </Button>
          ) : (
            <Button onClick={handleComplete} className="ml-auto">
              Get Started
            </Button>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}