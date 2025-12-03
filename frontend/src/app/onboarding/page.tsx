'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'

const focusAreas = [
  { id: 'productivity', label: 'Productivity & Tasks', icon: '✅', description: 'Task management and time optimization' },
  { id: 'health', label: 'Health & Fitness', icon: '❤️', description: 'Wellness tracking and health goals' },
  { id: 'finance', label: 'Finance & Budgeting', icon: '💰', description: 'Financial planning and expense tracking' },
  { id: 'learning', label: 'Learning & Growth', icon: '📚', description: 'Personal development and skill building' },
  { id: 'social', label: 'Social & Networking', icon: '👥', description: 'Connections and social goals' },
]

const scheduleOptions = [
  { id: 'early', label: 'Early Bird', time: '5:00 AM - 9:00 PM', description: 'Early riser, productive mornings' },
  { id: 'standard', label: 'Standard', time: '8:00 AM - 6:00 PM', description: 'Traditional 9-5 schedule' },
  { id: 'night', label: 'Night Owl', time: '10:00 AM - 2:00 AM', description: 'Late nights, flexible mornings' },
  { id: 'flexible', label: 'Flexible', time: 'Varies', description: 'Irregular schedule, adapt to needs' },
]

const privacyLevels = [
  { id: 'minimal', label: 'Minimal Sharing', description: 'Only essential data, maximum privacy', icon: '🔒' },
  { id: 'balanced', label: 'Balanced', description: 'Share for insights, moderate privacy', icon: '⚖️' },
  { id: 'insights', label: 'AI Insights', description: 'Share for personalized recommendations', icon: '🤖' },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [selectedPrivacyLevel, setSelectedPrivacyLevel] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const handleFocusAreaToggle = (areaId: string) => {
    setSelectedFocusAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    )
  }

  const handleNext = () => {
    if (currentStep === 1 && selectedFocusAreas.length === 0) {
      addToast({
        title: 'Selection Required',
        description: 'Please select at least one focus area.',
        variant: 'destructive',
      })
      return
    }

    if (currentStep === 2 && !selectedSchedule) {
      addToast({
        title: 'Selection Required',
        description: 'Please select your daily schedule.',
        variant: 'destructive',
      })
      return
    }

    if (currentStep === 3 && !selectedPrivacyLevel) {
      addToast({
        title: 'Selection Required',
        description: 'Please select your privacy level.',
        variant: 'destructive',
      })
      return
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      trackEvent('onboarding_step_completed', { step: currentStep })
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      // Save onboarding preferences
      const preferences = {
        focusAreas: selectedFocusAreas,
        schedule: selectedSchedule,
        privacyLevel: selectedPrivacyLevel,
      }

      // In a real app, this would save to the backend
      localStorage.setItem('onboardingComplete', 'true')
      localStorage.setItem('userPreferences', JSON.stringify(preferences))

      trackEvent('onboarding_completed', preferences)

      addToast({
        title: 'Welcome to LifeOS!',
        description: 'Your personalized experience is ready.',
      })

      router.push('/')
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      {[1, 2, 3].map(step => (
        <div
          key={step}
          className={`w-3 h-3 rounded-full mx-1 ${
            step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What are your main goals?</h2>
        <p className="text-gray-600">Select the areas you want to focus on with LifeOS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {focusAreas.map(area => (
          <div
            key={area.id}
            onClick={() => handleFocusAreaToggle(area.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedFocusAreas.includes(area.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{area.icon}</span>
              <div>
                <h3 className="font-medium text-gray-900">{area.label}</h3>
                <p className="text-sm text-gray-600">{area.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What&apos;s your daily schedule?</h2>
        <p className="text-gray-600">This helps us optimize your experience</p>
      </div>

      <div className="space-y-4">
        {scheduleOptions.map(option => (
          <div
            key={option.id}
            onClick={() => setSelectedSchedule(option.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedSchedule === option.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{option.label}</h3>
                <p className="text-sm text-gray-600">{option.description}</p>
                <p className="text-xs text-gray-500 mt-1">{option.time}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedSchedule === option.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy & Data Preferences</h2>
        <p className="text-gray-600">Choose how you want to share your data</p>
      </div>

      <div className="space-y-4">
        {privacyLevels.map(level => (
          <div
            key={level.id}
            onClick={() => setSelectedPrivacyLevel(level.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedPrivacyLevel === level.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{level.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{level.label}</h3>
                  <p className="text-sm text-gray-600">{level.description}</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPrivacyLevel === level.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Privacy Note:</strong> You can change these settings anytime in your account settings.
          We take your privacy seriously and only use your data to provide the services you&apos;ve requested.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {renderStepIndicator()}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Step {currentStep} of 3</span>
              <span className="text-sm text-gray-500">
                {currentStep === 1 && 'Focus Areas'}
                {currentStep === 2 && 'Daily Schedule'}
                {currentStep === 3 && 'Privacy Settings'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="min-h-[400px]">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </CardContent>
          <div className="px-6 pb-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading}
            >
              {currentStep === 3
                ? (isLoading ? 'Setting up...' : 'Complete Setup')
                : 'Next'
              }
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}