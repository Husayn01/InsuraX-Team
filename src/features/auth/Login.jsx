import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, AlertCircle, ArrowRight, Sparkles, CheckCircle } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { Button, Input, Alert } from '@shared/components'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/'

  // Check for success message from signup redirect
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      // Clear the message from location state
      navigate(location.pathname, { replace: true, state: {} })
      
      // Auto-hide success message after 10 seconds
      const timer = setTimeout(() => {
        setSuccessMessage('')
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [location, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn(email, password)
      
      if (!result.success) {
        setError(result.error || 'Failed to sign in')
        setLoading(false)
        return
      }
      
      // Navigation is handled by AuthContext after successful sign in
      setLoading(false)
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const fillDemoCredentials = (type) => {
    if (type === 'customer') {
      setEmail('customer@demo.com')
      setPassword('demo123')
    } else {
      setEmail('insurer@demo.com')
      setPassword('demo123')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Panel - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">InsuraX</span>
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
              <p className="text-gray-400">Sign in to your account</p>
            </div>

            {/* Success Message from Signup */}
            {successMessage && (
              <div className="mb-6 bg-green-900/20 border border-green-500/50 rounded-lg p-4 animate-in slide-in-from-top">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-300">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={Mail}
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={Lock}
                required
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2" />
                  <span className="ml-2 text-sm text-gray-400">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full group"
              >
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">Or try demo accounts</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('customer')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Customer Demo
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('insurer')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  <Shield className="w-4 h-4" />
                  Insurer Demo
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Right Panel - Features */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gray-800/50 backdrop-blur-xl">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-6">Insurance made simple</h2>
            <div className="space-y-4">
              {[
                { icon: Shield, text: 'Secure and trusted by thousands' },
                { icon: Sparkles, text: 'AI-powered claim processing' },
                { icon: AlertCircle, text: '24/7 support and assistance' }
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <p className="text-gray-300">{feature.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gray-700/50 rounded-xl border border-gray-600">
              <p className="text-gray-300 italic">
                "InsuraX transformed how we handle claims. The process is now faster, more transparent, and our customers love it!"
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-200">Sarah Johnson</p>
                  <p className="text-sm text-gray-400">CEO, TechCorp Insurance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}