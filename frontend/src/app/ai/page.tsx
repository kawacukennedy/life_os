'use client'

import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'
import { print } from 'graphql'
import { useQuery } from '@apollo/client'

export const dynamic = 'force-dynamic'

const GET_CONVERSATION = gql`
  query GetConversation($userId: String!) {
    getConversation(userId: $userId) {
      id
      messages {
        id
        content
        role
        timestamp
      }
    }
  }
`

const SEND_MESSAGE = gql`
  mutation SendMessage($userId: String!, $message: String!) {
    sendMessage(userId: $userId, message: $message) {
      id
      content
      role
      timestamp
    }
  }
`

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: conversationData, refetch: refetchConversation } = useQuery(GET_CONVERSATION, {
    variables: { userId },
    onCompleted: (data) => {
      if (data?.getConversation?.messages) {
        setMessages(data.getConversation.messages)
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error)
      addToast({
        title: 'Error',
        description: 'Unable to load conversation.',
        variant: 'destructive'
      })
    }
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: print(SEND_MESSAGE),
          variables: { userId, message },
        }),
      })
      const result = await response.json()
      if (result.errors) {
        throw new Error(result.errors[0].message)
      }
      return result.data.sendMessage
    },
    onSuccess: (newMessage) => {
      setMessages(prev => [...prev, newMessage])
      setInputMessage('')
      trackEvent('ai_message_sent')
    },
    onError: (error) => {
      addToast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive'
      })
    }
  })

  useEffect(() => {
    refetchConversation()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      await sendMessageMutation.mutateAsync(inputMessage)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestedPrompts = [
    "What's my schedule for today?",
    "How am I doing on my health goals?",
    "Any financial insights for me?",
    "Help me plan my learning session",
    "What's trending in my social circle?",
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
            <p className="mt-2 text-gray-600">Your intelligent companion for productivity and life optimization</p>
          </div>

          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <h2 className="text-xl font-semibold">Conversation</h2>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !isTyping && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to LifeOS AI</h3>
                   <p className="text-gray-600 mb-6">I&apos;m here to help you optimize your life. Ask me anything about your health, finances, tasks, learning, or social connections.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {suggestedPrompts.map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => setInputMessage(prompt)}
                        className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <p className="text-sm text-gray-700">{prompt}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sendMessageMutation.isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendMessageMutation.isLoading}
                >
                  {sendMessageMutation.isLoading ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">📅</div>
                <h3 className="font-medium">Schedule Management</h3>
                <p className="text-sm text-gray-600">Optimize your time and productivity</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-medium">Goal Tracking</h3>
                <p className="text-sm text-gray-600">Monitor progress on your objectives</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">💡</div>
                <h3 className="font-medium">Smart Suggestions</h3>
                <p className="text-sm text-gray-600">AI-powered recommendations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}