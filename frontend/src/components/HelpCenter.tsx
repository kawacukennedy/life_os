import { useState } from 'react'
import { Button } from './ui/Button'
import { Search, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

interface HelpArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
}

const faqs: FAQItem[] = [
  {
    id: 'getting-started',
    question: 'How do I get started with LifeOS?',
    answer: 'Welcome to LifeOS! Start by completing the onboarding process to set up your profile and connect your services. You can access onboarding anytime from the settings page.',
    category: 'Getting Started'
  },
  {
    id: 'connect-services',
    question: 'How do I connect my health and finance accounts?',
    answer: 'Go to Settings > Integrations to connect Google Calendar, Fitbit, and Plaid (banking). Click "Connect" next to each service and follow the authorization prompts.',
    category: 'Integrations'
  },
  {
    id: 'ai-assistant',
    question: 'How does the AI assistant work?',
    answer: 'The AI assistant analyzes your data to provide personalized recommendations. You can ask questions, get health insights, financial advice, or request daily planning assistance.',
    category: 'AI Features'
  },
  {
    id: 'offline-mode',
    question: 'Does LifeOS work offline?',
    answer: 'Yes! LifeOS has offline capabilities. Your data is cached locally and syncs when you reconnect. You can view your dashboard and most features without an internet connection.',
    category: 'Features'
  },
  {
    id: 'privacy',
    question: 'How is my data protected?',
    answer: 'LifeOS uses end-to-end encryption, secure API connections, and follows privacy best practices. You control what data is shared and can delete your account anytime.',
    category: 'Privacy & Security'
  },
  {
    id: 'voice-commands',
    question: 'Can I use voice commands?',
    answer: 'Yes! Click the microphone icon in the AI assistant or use voice input in forms. LifeOS supports speech recognition for hands-free interaction.',
    category: 'Features'
  }
]

const helpArticles: HelpArticle[] = [
  {
    id: 'dashboard-guide',
    title: 'Understanding Your Dashboard',
    content: `
      <h3>Dashboard Overview</h3>
      <p>Your dashboard provides a comprehensive view of your life metrics and AI-powered insights.</p>

      <h4>Key Components:</h4>
      <ul>
        <li><strong>Health Score:</strong> Calculated from your vital signs and activity data</li>
        <li><strong>Financial Balance:</strong> Current account balances from connected banks</li>
        <li><strong>Learning Progress:</strong> Completion percentage of active courses</li>
        <li><strong>AI Recommendations:</strong> Personalized suggestions based on your data</li>
      </ul>

      <h4>Mobile Gestures:</h4>
      <p>Swipe left/right to navigate between sections, swipe up/down for quick actions.</p>
    `,
    category: 'Dashboard',
    tags: ['overview', 'metrics', 'navigation']
  },
  {
    id: 'integrations-setup',
    title: 'Setting Up Integrations',
    content: `
      <h3>Connecting Your Services</h3>
      <p>Integrations allow LifeOS to access your data from various platforms for comprehensive insights.</p>

      <h4>Available Integrations:</h4>
      <ul>
        <li><strong>Google Calendar:</strong> Sync your schedule and events</li>
        <li><strong>Fitbit:</strong> Track health metrics, steps, and sleep</li>
        <li><strong>Plaid:</strong> Connect bank accounts for financial insights</li>
      </ul>

      <h4>Setup Process:</h4>
      <ol>
        <li>Go to Settings > Integrations</li>
        <li>Click "Connect" next to desired service</li>
        <li>Authorize LifeOS access</li>
        <li>Data will sync automatically</li>
      </ol>
    `,
    category: 'Integrations',
    tags: ['setup', 'google', 'fitbit', 'plaid']
  },
  {
    id: 'ai-features',
    title: 'Using AI Features',
    content: `
      <h3>AI-Powered Assistance</h3>
      <p>LifeOS uses advanced AI to provide personalized recommendations and automation.</p>

      <h4>AI Capabilities:</h4>
      <ul>
        <li><strong>Daily Planning:</strong> AI-optimized schedules based on your patterns</li>
        <li><strong>Health Insights:</strong> Predictive health recommendations</li>
        <li><strong>Financial Advice:</strong> Budget optimization and spending analysis</li>
        <li><strong>Learning Paths:</strong> Personalized course recommendations</li>
      </ul>

      <h4>Voice Interaction:</h4>
      <p>Use voice commands for hands-free operation. Say "Plan my day" or "Show health summary".</p>
    `,
    category: 'AI Features',
    tags: ['ai', 'voice', 'planning', 'insights']
  }
]

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)

  const categories = ['all', ...Array.from(new Set([...faqs.map(f => f.category), ...helpArticles.map(a => a.category)]))]

  const filteredFAQs = faqs.filter(faq =>
    (selectedCategory === 'all' || faq.category === selectedCategory) &&
    (searchQuery === '' ||
     faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
     faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredArticles = helpArticles.filter(article =>
    (selectedCategory === 'all' || article.category === selectedCategory) &&
    (searchQuery === '' ||
     article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
     article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Help Center</h1>
        <p className="text-gray-600">Find answers to common questions and learn how to make the most of LifeOS.</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search help articles and FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-start"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All Topics' : category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {selectedArticle ? (
            <div>
              <Button
                variant="ghost"
                onClick={() => setSelectedArticle(null)}
                className="mb-4"
              >
                ← Back to Help Center
              </Button>
              <article className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedArticle.title}</h2>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
                <div className="mt-6 flex flex-wrap gap-2">
                  {selectedArticle.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </div>
          ) : (
            <>
              {/* FAQs */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-2">
                  {filteredFAQs.map(faq => (
                    <div key={faq.id} className="bg-white rounded-lg shadow">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-primary-start rounded-lg"
                        aria-expanded={expandedFAQ === faq.id}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{faq.question}</h3>
                          {expandedFAQ === faq.id ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="px-4 pb-4">
                          <p className="text-gray-600">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Help Articles */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Help Articles</h2>
                <div className="grid gap-4">
                  {filteredArticles.map(article => (
                    <div key={article.id} className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">{article.title}</h3>
                          <p className="text-gray-600 text-sm mb-3">
                            {article.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {article.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedArticle(article)}
                        >
                          Read More
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                📞 Contact Support
              </Button>
              <Button variant="outline" className="w-full justify-start">
                🐛 Report a Bug
              </Button>
              <Button variant="outline" className="w-full justify-start">
                💡 Suggest a Feature
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Need More Help?</h3>
            <div className="space-y-3 text-sm">
              <p>
                <strong>Email:</strong><br />
                support@lifeos.com
              </p>
              <p>
                <strong>Documentation:</strong><br />
                <a href="#" className="text-primary-start hover:underline flex items-center">
                  Full API Reference <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </p>
              <p>
                <strong>Community:</strong><br />
                <a href="#" className="text-primary-start hover:underline flex items-center">
                  Join our Discord <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </p>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Quick Search</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+K</kbd>
              </div>
              <div className="flex justify-between">
                <span>Go to Dashboard</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+D</kbd>
              </div>
              <div className="flex justify-between">
                <span>Go to Health</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+H</kbd>
              </div>
              <div className="flex justify-between">
                <span>Go to Settings</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+,</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}