import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, AlertCircle, ArrowRight, Sparkles, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { Button, Input, Alert } from '@shared/components'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
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
    
    if (result.error) {
      setError(result.error.message || 'Failed to sign in')
      setLoading(false)
      return
    }
    
    // ✅ Sign in successful - navigation will be handled by auth context
    // Just set a timeout to remove loading state if navigation doesn't happen
    setTimeout(() => {
      setLoading(false)
    }, 2000) // Fallback to remove loading state
    
  } catch (err) {
    console.error('Unexpected error during sign in:', err)
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
            <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
              <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">InsuraX</span>
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Welcome back
              </h1>
              <p className="text-gray-400">Sign in to your account</p>
            </div>

            {/* Success Message from Signup */}
            {successMessage && (
              <Alert 
                type="success" 
                title="Success" 
                className="mb-6 bg-emerald-900/20 border-emerald-500/50"
              >
                {successMessage}
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert 
                type="error" 
                title="Error" 
                className="mb-6 bg-red-900/20 border-red-500/50"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-12 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-400">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading || !email || !password}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-400">
                    Or try demo accounts
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('customer')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Customer Demo
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('insurer')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Shield className="w-4 h-4 text-purple-400" />
                  Insurer Demo
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Right Panel - Hero */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-cyan-500/25">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Insurance Made Simple
              </h2>
              <p className="text-gray-400 mb-6">
                Experience the future of insurance with AI-powered claim processing and instant payouts.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0 w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI-Powered Processing</h3>
                  <p className="text-sm text-gray-400">Claims processed in seconds, not days</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Instant Approvals</h3>
                  <p className="text-sm text-gray-400">Get approved and paid within hours</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Secure & Trusted</h3>
                  <p className="text-sm text-gray-400">Bank-level security for your data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default Login