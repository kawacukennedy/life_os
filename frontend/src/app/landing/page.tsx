import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LifeOS - AI-Powered Life Management Platform',
  description: 'Transform your life with AI-driven insights, unified dashboards, and smart integrations. Manage health, finance, tasks, learning, and social connections all in one place.',
  keywords: 'life management, AI assistant, productivity, health tracking, finance management, task management, learning platform',
  openGraph: {
    title: 'LifeOS - AI-Powered Life Management Platform',
    description: 'Transform your life with AI-driven insights, unified dashboards, and smart integrations.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LifeOS Platform Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LifeOS - AI-Powered Life Management Platform',
    description: 'Transform your life with AI-driven insights, unified dashboards, and smart integrations.',
    images: ['/og-image.png'],
  },
}

export default function LandingPage() {
  const features = [
    {
      title: 'AI-Powered Assistant',
      description: 'Get personalized recommendations and automate your daily routines with our intelligent AI companion.',
      icon: '🤖',
    },
    {
      title: 'Unified Dashboard',
      description: 'See all your health, finance, tasks, and learning progress in one beautiful, organized view.',
      icon: '📊',
    },
    {
      title: 'Smart Integrations',
      description: 'Connect your favorite tools - Google Calendar, Fitbit, Plaid, and more for seamless data flow.',
      icon: '🔗',
    },
    {
      title: 'Privacy First',
      description: 'Your data belongs to you. Control what you share and export anytime with GDPR compliance.',
      icon: '🔒',
    },
    {
      title: 'Continuous Learning',
      description: 'Personalized learning paths and spaced repetition to help you grow and achieve your goals.',
      icon: '📚',
    },
    {
      title: 'Goal Tracking',
      description: 'Set, track, and achieve your personal and professional goals with intelligent insights.',
      icon: '🎯',
    },
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Product Manager',
      content: 'LifeOS transformed how I manage my day. The AI insights are incredibly accurate and the unified dashboard saves me hours.',
      avatar: 'SJ',
    },
    {
      name: 'Mike Chen',
      role: 'Software Engineer',
      content: 'The privacy controls give me peace of mind. I can see all my data in one place without worrying about security.',
      avatar: 'MC',
    },
    {
      name: 'Emma Rodriguez',
      role: 'Fitness Coach',
      content: 'As someone who tracks everything, LifeOS integrations with my wearables and calendar are game-changing.',
      avatar: 'ER',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">LifeOS</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-500 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-500 hover:text-gray-900">Pricing</a>
              <a href="#about" className="text-gray-500 hover:text-gray-900">About</a>
              <Link href="/auth/login" className="text-gray-500 hover:text-gray-900">Sign In</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Life, <span className="text-blue-600">Optimized</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Consolidate your health, finances, productivity, learning, and social life into one intelligent platform.
              Get personalized AI recommendations and take control of your digital life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 py-3">
                  Start Free Trial
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-3">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need in one place
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              LifeOS brings together all your digital life into a unified, intelligent experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Loved by thousands of users
            </h2>
            <p className="text-xl text-gray-600">
              See what our community says about LifeOS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to optimize your life?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who have transformed their productivity and wellbeing with LifeOS.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
                Start Your Free Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3">
              Schedule Demo
            </Button>
          </div>
          <p className="text-blue-200 text-sm mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">LifeOS</h3>
              <p className="text-gray-400">
                Your personal operating system for optimized living.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LifeOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}