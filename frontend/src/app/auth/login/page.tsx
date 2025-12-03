'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import AuthLayout from '@/components/layouts/AuthLayout'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaCode, setMfaCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.mfaRequired) {
          setMfaRequired(true)
        } else {
          localStorage.setItem('accessToken', data.accessToken)
          console.log('Login successful:', data)
          // Redirect to dashboard
          window.location.href = '/app/dashboard'
        }
      } else {
        console.error('Login failed')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mfaCode }),
      })
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('accessToken', data.accessToken)
        window.location.href = '/app/dashboard'
      } else {
        console.error('MFA verification failed')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSSOLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`
  }

  if (mfaRequired) {
    return (
      <AuthLayout title="Two-Factor Authentication">
        <form onSubmit={handleMfaSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Enter your 6-digit code</label>
            <Input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" loading={isLoading}>
            Verify
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => setMfaRequired(false)}
            className="text-primary-start hover:underline"
          >
            Back to login
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Sign In">
      <div className="space-y-6">
        {/* SSO Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => handleSSOLogin('google')}
            variant="outline"
            className="w-full"
          >
            Continue with Google
          </Button>
          <Button
            onClick={() => handleSSOLogin('microsoft')}
            variant="outline"
            className="w-full"
          >
            Continue with Microsoft
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              required
            />
          </div>
          <Button type="submit" className="w-full" loading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="text-center space-y-2">
          <Link href="/auth/forgot-password" className="text-sm text-primary-start hover:underline">
            Forgot your password?
          </Link>
          <div>
            <Link href="/auth/signup" className="text-sm text-primary-start hover:underline">
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}