import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { Button, Input, Alert } from '@shared/components'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/'

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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                InsuraX
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  Home
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-2">Welcome back</h2>
            <p className="text-gray-400">Sign in to your InsuraX account</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert type="error" title="Sign in failed" className="bg-red-900/20 border-red-500/50">
                  {error}
                </Alert>
              )}

              <div>
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-gray-700/50 border-gray-600 focus:border-cyan-500 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-gray-700/50 border-gray-600 focus:border-cyan-500 text-white placeholder-gray-400"
                />
              </div>

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-300"
                loading={loading}
                disabled={loading}
              >
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-800/50 px-4 text-gray-400">Or use demo account</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fillDemoCredentials('customer')}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Customer Demo
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fillDemoCredentials('insurer')}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Insurer Demo
                </Button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}