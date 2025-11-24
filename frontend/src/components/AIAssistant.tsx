'use client'

import React, { useState } from 'react'
import { Button } from './ui/Button'
import { useVoiceInput } from '@/hooks/useVoiceInput'

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
  const { isListening, transcript, startListening, stopListening, clearTranscript } = useVoiceInput()

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

    // Advanced AI response simulation
    setTimeout(() => {
      let response = ''
      const lowerInput = input.toLowerCase()

      if (lowerInput.includes('plan') || lowerInput.includes('schedule')) {
        response = 'I\'ve analyzed your calendar and health data. Here\'s your optimized daily plan:\n\n• 9:00 AM: Team standup (30 min)\n• 11:00 AM: Doctor appointment\n• 2:00 PM: Budget review\n• 6:00 PM: Exercise (recommended based on your heart rate trends)\n\nWould you like me to add these to your calendar?'
      } else if (lowerInput.includes('health') || lowerInput.includes('fitness')) {
        response = 'Based on your recent vitals:\n\n• Your average heart rate is within normal range\n• You\'ve been consistently active with 8,500+ daily steps\n• Sleep quality could improve - aim for 7-9 hours\n\nI recommend a 20-minute walk today to maintain your streak!'
      } else if (lowerInput.includes('finance') || lowerInput.includes('budget')) {
        response = 'Your financial overview:\n\n• Current balance: $15,432\n• Monthly income: $3,200\n• Top spending category: Food ($97.82)\n\nYou\'re on track to save 20% this month. Consider reviewing your entertainment subscriptions.'
      } else if (lowerInput.includes('learn') || lowerInput.includes('course')) {
        response = 'Your learning progress:\n\n• Productivity course: 75% complete\n• Next lesson: "Time Management Techniques"\n• Estimated completion: 2 weeks\n\nYou\'ve been consistent! Keep up the great work.'
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