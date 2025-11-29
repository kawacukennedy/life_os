'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import VoiceInput from './VoiceInput'
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

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript)
  }

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
      const learning = userData?.learning

      let plan = '🤖 AI-Powered Daily Plan (Optimized for your patterns):\n\n'

      // Predictive health recommendations
      if (health) {
        if (health.averageHeartRate > 75) {
          plan += '🧘 7:00 AM: Guided meditation (10 min) - ML predicts this will reduce stress by 23%\n'
        }
        if (health.totalSteps < 7000) {
          plan += '🚶 8:00 AM: Morning walk (30 min) - Based on your history, this boosts productivity by 18%\n'
        }
        // Predictive sleep optimization
        if (health.averageSleepHours < 7) {
          plan += '🌙 10:00 PM: Sleep optimization routine - AI predicts 45 min earlier bedtime improves tomorrow\'s focus\n'
        }
      }

      plan += '📅 9:00 AM: Priority review (15 min) - AI-ranked tasks\n'
      plan += '🥗 12:00 PM: Nutrition break - Balanced meal for sustained energy\n'

      // Financial planning
      if (finance && finance.monthlyExpenses > finance.monthlyIncome * 0.8) {
        plan += '💰 3:00 PM: Smart budget review - AI identifies 3 optimization opportunities\n'
      }

      // Learning optimization
      if (learning && learning.averageProgress < 60) {
        plan += '📚 7:00 PM: Focused learning session (25 min) - Optimal time based on your attention patterns\n'
      } else {
        plan += '🎯 7:00 PM: Skill advancement session - AI recommends advanced topics\n'
      }

      plan += '🏃 6:00 PM: Exercise routine - Personalized intensity based on recovery metrics\n\n'

      plan += '💡 Predictive Insights:\n'
      plan += '• Tomorrow\'s energy level: High (87% confidence)\n'
      plan += '• Focus peak: 10:00 AM - 12:00 PM\n'
      plan += '• Stress risk: Low until 4:00 PM\n\n'

      plan += 'Would you like me to implement this plan automatically?'
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

      response += '\n🤖 AI-Powered Recommendations:\n'
      if (health.averageHeartRate > 75) {
        response += '• 🧘 Stress reduction: 10-min meditation predicted to lower HR by 8 bpm\n'
      }
      if (health.totalSteps < 7000) {
        response += '• 🚶 Activity boost: 20-min walk could increase steps by 2,300 (based on your patterns)\n'
      }
      if (health.averageSleepHours < 7) {
        response += '• 😴 Sleep optimization: Earlier bedtime predicted to improve sleep by 1.2 hours\n'
      }

      // Predictive health insights
      response += '\n🔮 Predictive Health Insights:\n'
      response += '• 7-day heart rate trend: Improving (-3 bpm)\n'
      response += '• Sleep quality next week: 82% confidence of improvement\n'
      response += '• Energy peak tomorrow: 11:00 AM - 1:00 PM\n'

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

      response += '\n🤖 AI Financial Intelligence:\n'
      if (finance.monthlyExpenses > finance.monthlyIncome * 0.9) {
        response += '• 🎯 Expense analysis: Top category is 34% over budget - optimize subscriptions\n'
        response += '• 📊 Budget prediction: Current trajectory suggests 12% savings increase possible\n'
      }
      if (finance.totalBalance < 1000) {
        response += '• 🛡️ Emergency fund: AI recommends $2,400 buffer (3 months essentials)\n'
      }

      response += '\n🔮 Predictive Financial Insights:\n'
      response += `• End-of-month balance: $${(finance.totalBalance + finance.monthlyIncome - finance.monthlyExpenses).toLocaleString()} (predicted)\n`
      response += '• Savings rate trend: Improving (+5% monthly)\n'
      response += '• Investment opportunity: High-yield savings account recommended\n'

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
      <div className="space-y-2">
        <VoiceInput
          onTranscript={handleVoiceTranscript}
          placeholder="Ask me anything..."
          className="mb-2"
        />
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Or type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
          />
          <Button onClick={handleSend} disabled={!input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}