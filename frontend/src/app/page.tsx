import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const features = [
  {
    title: 'AI Personal Assistant',
    description: 'Multi-turn conversational assistant for planning, reminders, and suggestions',
    icon: '🤖',
  },
  {
    title: 'Unified Dashboard',
    description: 'Health, finance, learning and tasks in one view',
    icon: '📊',
  },
  {
    title: 'Autonomous Routines',
    description: 'User-defined & AI-suggested routines that run automatically',
    icon: '⚙️',
  },
  {
    title: 'Secure Integrations',
    description: 'Calendar (Google/Apple), wearables (Fitbit/Apple Watch), banks (Plaid), messaging',
    icon: '🔒',
  },
  {
    title: 'Continuous Learning Engine',
    description: 'Personalized micro-courses and skill recommendations',
    icon: '📚',
  },
  {
    title: 'Privacy Controls',
    description: 'Export, delete, selective sharing, on-device model options',
    icon: '🛡️',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-start to-primary-end">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            LifeOS
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto">
            One app for everything
          </p>
          <p className="text-lg text-white/70 mb-12 max-w-3xl mx-auto">
            LifeOS is a unified, AI-driven personal operating system that centralizes health, productivity, finances, learning, social coordination and daily automation into a single, privacy-first web & mobile application.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-primary-start hover:bg-white/90 px-8 py-4 text-lg font-semibold">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything you need in one place
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Consolidate your digital life with powerful AI assistance and seamless integrations
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-colors p-6">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/80">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to take control?
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Join thousands of users optimizing their lives with LifeOS
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-primary-start hover:bg-white/90 px-8 py-4 text-lg font-semibold">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}