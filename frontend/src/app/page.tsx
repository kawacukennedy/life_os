import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-start to-primary-end">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            Get control of your life
          </h1>
          <p className="text-xl text-white/80 mb-8">
            One app to manage health, work, learning and finances
          </p>
          <Link href="/auth/signup" className="bg-white text-primary-start px-8 py-4 rounded-lg font-semibold hover:bg-white/90 transition-colors inline-block">
            Get started — it's free
          </Link>
        </div>
      </div>
    </main>
  )
}