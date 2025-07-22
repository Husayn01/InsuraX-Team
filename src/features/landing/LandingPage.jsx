import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Shield, Brain, Zap, CreditCard, FileText, 
  ChevronRight, Check, ArrowRight, Play,
  Users, TrendingUp, Clock, Lock, Globe,
  Smartphone, Star, Menu, X, LogOut
} from 'lucide-react'
import { Button } from '@shared/components'
import { useAuth } from '@contexts/AuthContext'

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Processing',
      description: 'NeuroClaim AI analyzes and processes claims in seconds, not days',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Fraud Detection',
      description: 'Advanced algorithms detect fraudulent claims with 99% accuracy',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: CreditCard,
      title: 'Universal Payments',
      description: 'Accept payments via cards, mobile money, and cryptocurrency',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Zap,
      title: 'Instant Payouts',
      description: 'Approved claims are paid out instantly to customers',
      color: 'from-orange-500 to-red-500'
    }
  ]

  const stats = [
    { value: '99%', label: 'Claim Accuracy', icon: TrendingUp },
    { value: '60s', label: 'Processing Time', icon: Clock },
    { value: '50K+', label: 'Claims Processed', icon: FileText },
    { value: '4.9/5', label: 'Customer Rating', icon: Star }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Insurance Customer',
      image: 'https://i.pravatar.cc/150?img=1',
      content: 'InsuraX made filing my claim so easy. I got approved and paid within hours!'
    },
    {
      name: 'Michael Chen',
      role: 'Claims Manager',
      image: 'https://i.pravatar.cc/150?img=3',
      content: 'The AI processing has reduced our workload by 70%. It\'s a game-changer.'
    },
    {
      name: 'ABC Insurance Ltd',
      role: 'Partner Company',
      image: 'https://i.pravatar.cc/150?img=8',
      content: 'InsuraX helped us modernize our entire claims process. Highly recommended!'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-900/95 backdrop-blur-md shadow-lg' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                InsuraX
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How it Works</a>
              <a href="#testimonials" className="hover:text-cyan-400 transition-colors">Testimonials</a>
              
              {user ? (
                <>
                  <Link to={profile?.role === 'insurer' ? '/insurer/dashboard' : '/customer/dashboard'}>
                    <Button variant="ghost" className="text-white hover:text-cyan-400">
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleSignOut}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-white hover:text-cyan-400">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900/95 backdrop-blur-md">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block hover:text-cyan-400 transition-colors">Features</a>
              <a href="#how-it-works" className="block hover:text-cyan-400 transition-colors">How it Works</a>
              <a href="#testimonials" className="block hover:text-cyan-400 transition-colors">Testimonials</a>
              
              {user ? (
                <>
                  <Link to={profile?.role === 'insurer' ? '/insurer/dashboard' : '/customer/dashboard'} className="block">
                    <Button variant="ghost" className="w-full text-white hover:text-cyan-400">
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleSignOut}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block">
                    <Button variant="ghost" className="w-full text-white hover:text-cyan-400">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" className="block">
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Insurance Made
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Simple & Smart
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolutionary AI-powered claim processing and universal payment gateway. 
              Get claims approved in seconds, not weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to={profile?.role === 'insurer' ? '/insurer/dashboard' : '/customer/dashboard'}>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                    >
                      Get Started
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button 
                      size="lg" 
                      variant="secondary"
                      className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 hover:bg-gray-700/50 transform hover:scale-105 transition-all duration-300"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Watch Demo
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center p-6 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 hover:border-cyan-500/50 transition-all duration-300"
              >
                <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400">Everything you need to modernize insurance operations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gray-800 rounded-2xl p-6 hover:bg-gray-700 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl mb-4`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-400">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Sign Up',
                description: 'Create your account as a customer or insurance company',
                icon: Users
              },
              {
                step: '2',
                title: 'Submit or Review',
                description: 'Customers submit claims, insurers review with AI assistance',
                icon: FileText
              },
              {
                step: '3',
                title: 'Get Paid',
                description: 'Instant payouts upon approval through multiple channels',
                icon: CreditCard
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gray-800 rounded-2xl p-8 hover:bg-gray-700 transition-all duration-300">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                    {item.step}
                  </div>
                  <item.icon className="w-12 h-12 text-cyan-400 mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-gray-600 w-8 h-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-400">Trusted by thousands of customers and insurers</p>
          </div>

          <div className="relative bg-gray-800 rounded-2xl p-8 md:p-12">
            <div className="absolute -top-4 left-8">
              <div className="text-6xl text-cyan-500 opacity-50">"</div>
            </div>
            
            <div className="text-center">
              <p className="text-xl md:text-2xl text-gray-300 mb-8 italic">
                {testimonials[activeTestimonial].content}
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <img
                  src={testimonials[activeTestimonial].image}
                  alt={testimonials[activeTestimonial].name}
                  className="w-16 h-16 rounded-full"
                />
                <div className="text-left">
                  <p className="font-semibold text-gray-100">
                    {testimonials[activeTestimonial].name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {testimonials[activeTestimonial].role}
                  </p>
                </div>
              </div>
              
              {/* Dots indicator */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === activeTestimonial
                        ? 'bg-cyan-500 w-8'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                    onClick={() => setActiveTestimonial(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Transform Your Insurance Experience?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of users already benefiting from AI-powered insurance
          </p>
          {user ? (
            <Link to={profile?.role === 'insurer' ? '/insurer/dashboard' : '/customer/dashboard'}>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-8 h-8 text-cyan-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  InsuraX
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered insurance platform revolutionizing claim processing and payments.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; 2024 InsuraX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage