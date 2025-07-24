import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, User, Building, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { useNotifications } from '@contexts/NotificationContext'
import { Button, Input, Select, Alert } from '@shared/components'
import { NotificationToast } from '@features/notifications/components/NotificationComponents'

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
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  
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
      
      // Show success notification
      const notification = {
        id: Date.now().toString(),
        title: 'Welcome to InsuraX!',
        message: `Your account has been created successfully. ${
          result.data.session 
            ? 'You are now logged in.' 
            : 'Please check your email to confirm your account.'
        }`,
        type: 'success',
        color: 'success',
        icon: 'check-circle',
        created_at: new Date().toISOString()
      }
      
      setSuccessMessage(notification)
      setShowSuccessToast(true)
      
      // If email confirmation is disabled, user will be automatically signed in
      // and redirected by the AuthContext
      
      // If email confirmation is enabled, redirect after showing notification
      if (!result.data.session) {
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Account created successfully! Please check your email to confirm your account.',
              type: 'success'
            } 
          })
        }, 3000)
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
        'File and track claims online',
        'Upload documents instantly',
        'Real-time claim updates',
        '24/7 customer support'
      ]
    : [
        'Manage claims efficiently',
        'Advanced fraud detection',
        'Analytics dashboard',
        'Customer management tools'
      ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Show success toast */}
      {showSuccessToast && successMessage && (
        <NotificationToast 
          notification={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

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
              <h1 className="text-3xl font-bold mb-2">Create your account</h1>
              <p className="text-gray-400">Join thousands who trust InsuraX</p>
            </div>

            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Select
                label="Account Type"
                name="role"
                value={formData.role}
                onChange={handleChange}
                options={roleOptions}
                icon={Building}
              />

              {formData.role === 'customer' ? (
              <Input
                label="Full Name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Adamu Garba"
                icon={User}
                required
              />
            ) : (
              <Input
                label="Company Name"
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Premier Insurance Nigeria Ltd."
                icon={Building}
                required
              />
            )}

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                icon={Mail}
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                icon={Lock}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                icon={Lock}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full group"
              >
                <span>Create Account</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <p className="mt-6 text-center text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right Panel - Benefits */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gray-800/50 backdrop-blur-xl">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-6">
              {formData.role === 'customer' ? 'Customer Benefits' : 'Insurer Benefits'}
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-gray-300">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gray-700/50 rounded-xl border border-gray-600">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-8 h-8 text-cyan-400" />
                <h3 className="font-semibold">Bank-level Security</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Your data is protected with enterprise-grade encryption and security measures.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}