'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { AuthAPI } from '@/lib/api/auth'
import { HealthAPI } from '@/lib/api/health'
import { FinanceAPI } from '@/lib/api/finance'
import { LearningAPI } from '@/lib/api/learning'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! How can I help you optimize your day?', sender: 'ai' }
  ])
  const [input, setInput] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const { isListening, transcript, startListening, stopListening, clearTranscript } = useVoiceInput()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'user123'

      // Load data in parallel
      const [health, finance, learning] = await Promise.allSettled([
        HealthAPI.getHealthSummary(userId),
        FinanceAPI.getFinanceSummary(userId),
        LearningAPI.getLearningStats(userId),
      ])

      setUserData({
        health: health.status === 'fulfilled' ? health.value : null,
        finance: finance.status === 'fulfilled' ? finance.value : null,
        learning: learning.status === 'fulfilled' ? learning.value : null,
      })
    } catch (err) {
      console.error('Error loading user data for AI:', err)
    }
  }

  // Update input when voice transcript changes
  React.useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Advanced AI response simulation with real data
    setTimeout(() => {
      let response = ''
      const lowerInput = input.toLowerCase()

      if (lowerInput.includes('plan') || lowerInput.includes('schedule')) {
        response = generatePlanningResponse()
      } else if (lowerInput.includes('health') || lowerInput.includes('fitness')) {
        response = generateHealthResponse()
      } else if (lowerInput.includes('finance') || lowerInput.includes('budget')) {
        response = generateFinanceResponse()
      } else if (lowerInput.includes('learn') || lowerInput.includes('course')) {
        response = generateLearningResponse()
      } else if (lowerInput.includes('task') || lowerInput.includes('remind')) {
        response = 'I\'ve created a new task for you and set a reminder. You can view all your tasks in the dashboard. Is there anything else I can help you organize?'
      } else {
        response = `I understand you're asking about "${input}". As your AI assistant, I can help with:\n\n• Daily planning and scheduling\n• Health and fitness tracking\n• Financial management\n• Learning recommendations\n• Task and reminder management\n\nWhat would you like to focus on?`
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai'
      }
      setMessages(prev => [...prev, aiMessage])
    }, 1500)

    const generatePlanningResponse = () => {
      const health = userData?.health
      const finance = userData?.finance

      let plan = 'Here\'s your optimized daily plan based on your data:\n\n'

      if (health) {
        if (health.averageHeartRate > 75) {
          plan += '• 7:00 AM: Morning meditation (10 min) - Help lower stress\n'
        }
        if (health.totalSteps < 7000) {
          plan += '• 8:00 AM: Morning walk (30 min) - Boost your step count\n'
        }
      }

      plan += '• 9:00 AM: Review calendar and priorities\n'
      plan += '• 12:00 PM: Lunch break and quick walk\n'

      if (finance && finance.monthlyExpenses > finance.monthlyIncome * 0.8) {
        plan += '• 3:00 PM: Budget review (15 min)\n'
      }

      plan += '• 6:00 PM: Exercise routine\n'
      plan += '• 8:00 PM: Learning session\n'
      plan += '• 10:00 PM: Wind down and sleep prep\n\n'

      plan += 'Would you like me to add these to your calendar?'
      return plan
    }

    const generateHealthResponse = () => {
      const health = userData?.health

      if (!health) {
        return 'I don\'t have access to your health data yet. Please connect your Fitbit or add manual health entries to get personalized insights.'
      }

      let response = 'Based on your recent health data:\n\n'

      if (health.averageHeartRate < 60) {
        response += '• Resting heart rate: Excellent (' + Math.round(health.averageHeartRate) + ' bpm)\n'
      } else if (health.averageHeartRate < 80) {
        response += '• Resting heart rate: Good (' + Math.round(health.averageHeartRate) + ' bpm)\n'
      } else {
        response += '• Resting heart rate: Elevated (' + Math.round(health.averageHeartRate) + ' bpm) - Consider consulting a doctor\n'
      }

      if (health.totalSteps >= 10000) {
        response += '• Daily steps: Excellent (' + health.totalSteps.toLocaleString() + ') - Keep it up!\n'
      } else if (health.totalSteps >= 7000) {
        response += '• Daily steps: Good (' + health.totalSteps.toLocaleString() + ') - Aim for 10,000\n'
      } else {
        response += '• Daily steps: Below target (' + health.totalSteps.toLocaleString() + ') - Let\'s increase activity\n'
      }

      if (health.averageSleepHours >= 7) {
        response += '• Sleep: Great (' + health.averageSleepHours.toFixed(1) + ' hours)\n'
      } else {
        response += '• Sleep: Could improve (' + health.averageSleepHours.toFixed(1) + ' hours) - Aim for 7-9 hours\n'
      }

      response += '\nRecommendations:\n'
      if (health.averageHeartRate > 75) {
        response += '• Practice stress-reduction techniques\n'
      }
      if (health.totalSteps < 7000) {
        response += '• Take a 20-minute walk today\n'
      }
      if (health.averageSleepHours < 7) {
        response += '• Establish a consistent bedtime routine\n'
      }

      return response
    }

    const generateFinanceResponse = () => {
      const finance = userData?.finance

      if (!finance) {
        return 'I don\'t have access to your financial data yet. Please connect your bank accounts through Plaid to get personalized financial insights.'
      }

      let response = 'Your financial overview:\n\n'
      response += `• Current balance: $${finance.totalBalance.toLocaleString()}\n`
      response += `• Monthly income: $${finance.monthlyIncome.toLocaleString()}\n`
      response += `• Monthly expenses: $${finance.monthlyExpenses.toLocaleString()}\n`

      const savingsRate = ((finance.monthlyIncome - finance.monthlyExpenses) / finance.monthlyIncome) * 100
      if (savingsRate > 20) {
        response += `• Savings rate: Excellent (${savingsRate.toFixed(1)}%)\n`
      } else if (savingsRate > 10) {
        response += `• Savings rate: Good (${savingsRate.toFixed(1)}%)\n`
      } else if (savingsRate > 0) {
        response += `• Savings rate: ${savingsRate.toFixed(1)}% - Consider reducing expenses\n`
      } else {
        response += `• Savings rate: Negative - Expenses exceed income\n`
      }

      response += '\nRecommendations:\n'
      if (finance.monthlyExpenses > finance.monthlyIncome * 0.9) {
        response += '• Review your largest expense categories\n'
        response += '• Consider creating a detailed budget\n'
      }
      if (finance.totalBalance < 1000) {
        response += '• Build an emergency fund\n'
      }

      return response
    }

    const generateLearningResponse = () => {
      const learning = userData?.learning

      if (!learning) {
        return 'I don\'t have access to your learning data yet. Start a course to track your progress and get personalized recommendations.'
      }

      let response = 'Your learning progress:\n\n'
      response += `• Overall progress: ${Math.round(learning.averageProgress)}%\n`
      response += `• Courses completed: ${learning.coursesCompleted}\n`
      response += `• Total time spent: ${Math.round(learning.totalTimeSpent / 60)} hours\n`

      if (learning.averageProgress > 75) {
        response += '\nYou\'re doing great! Keep up the momentum.'
      } else if (learning.averageProgress > 50) {
        response += '\nYou\'re making good progress. Stay consistent!'
      } else {
        response += '\nLet\'s get you back on track with your learning goals.'
      }

      response += '\n\nRecommendations:\n'
      if (learning.averageProgress < 50) {
        response += '• Dedicate 30 minutes daily to learning\n'
        response += '• Break down courses into smaller, manageable sessions\n'
      }
      response += '• Consider exploring related courses to deepen your knowledge\n'

      return response
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 h-96 flex flex-col">
      <h3 className="text-lg font-medium text-gray-900 mb-4">AI Personal Assistant</h3>
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-primary-start text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Quick Actions:</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('Plan my day')}
          >
            📅 Plan My Day
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('Create a task for tomorrow')}
          >
            ✅ Create Task
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('Health summary')}
          >
            💚 Health Summary
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('Financial overview')}
          >
            💰 Finance Check
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('Learning progress')}
          >
            📚 Study Update
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('What should I focus on today?')}
          >
            🎯 Daily Focus
          </Button>
        </div>
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
        />
        <Button
          onClick={isListening ? stopListening : startListening}
          variant={isListening ? 'destructive' : 'outline'}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? '🎤' : '🎙️'}
        </Button>
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  )
}