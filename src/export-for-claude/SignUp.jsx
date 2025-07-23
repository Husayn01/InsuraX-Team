import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, User, Building, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { Button, Input, Select, Alert } from '@shared/components'

export const SignUp = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    fullName: '',
    companyName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const result = await signUp(formData.email, formData.password, {
        role: formData.role,
        fullName: formData.fullName,
        companyName: formData.companyName
      })
      
      if (!result.success) {
        setError(result.error || 'Failed to create account')
        setLoading(false)
        return
      }
      
      // Set loading to false on success
      setLoading(false)
      
      // If email confirmation is disabled, user will be automatically signed in
      // and redirected by the AuthContext
      
      // If email confirmation is enabled, show success message
      if (!result.data.session) {
        navigate('/login', { 
          state: { message: 'Account created successfully! Please check your email to confirm.' } 
        })
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred: ' + err.message)
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'customer', label: 'Customer' },
    { value: 'insurer', label: 'Insurance Company' }
  ]

  const benefits = formData.role === 'customer' 
    ? [
        'Submit claims in seconds',
        'Track claim status in real-time',
        'Multiple payment options',
        'Instant claim payouts'
      ]
    : [
        'AI-powered claim processing',
        'Advanced fraud detection',
        'Comprehensive analytics',
        'Streamlined workflows'
      ]

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
              <Link to="/login">
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl w-full animate-fade-in">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Form */}
            <div>
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-4xl font-bold mb-2">Create your account</h2>
                <p className="text-gray-400">Join InsuraX and transform your insurance experience</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 p-8 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert type="error" title="Registration failed" className="bg-red-900/20 border-red-500/50">
                      {error}
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-700/50 rounded-lg">
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: option.value }))}
                        className={`py-2 px-4 rounded-md font-medium transition-all duration-300 ${
                          formData.role === option.value
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <Input
                    label="Email address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="bg-gray-700/50 border-gray-600 focus:border-cyan-500 text-white placeholder-gray-400"
                  />

                  {formData.role === 'customer' ? (
                    <Input
                      label="Full Name"
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="bg-gray-700/50 border-gray-600 focus:border-cyan-500 text-white placeholder-gray-400"
                    />
                  ) : (
                    <Input
                      label="Company Name"
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="ABC Insurance Ltd."
                      required
                      className="bg-gray-700/50 border-gray-600 focus:border-cyan-500 text-white placeholder-gray-400"
                    />
                  )}

                  <Input
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="bg-gray-700/50 border-gray-600 focus:border-cyan-500 text-white placeholder-gray-400"
                  />

                  <Input
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="bg-gray-700/50 border-gray-600 focus:border-cyan-500 text-white placeholder-gray-400"
                  />

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                      required
                    />
                    <label className="ml-2 text-sm text-gray-400">
                      I agree to the{' '}
                      <Link to="/terms" className="text-cyan-400 hover:text-cyan-300">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-300"
                    loading={loading}
                    disabled={loading}
                  >
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Right Side - Benefits */}
            <div className="hidden lg:block">
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl border border-cyan-500/20 p-8">
                <h3 className="text-2xl font-bold mb-6">
                  {formData.role === 'customer' ? 'Customer Benefits' : 'Insurer Benefits'}
                </h3>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <p className="text-gray-300">{benefit}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-gray-800/50 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Trusted by</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    50,000+ Users
                  </p>
                  <p className="text-gray-400 mt-2">Join our growing community</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
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

export default SignUp