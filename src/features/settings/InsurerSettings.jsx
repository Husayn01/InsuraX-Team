import React, { useState } from 'react'
import { 
  Settings, User, Bell, Shield, Building, 
  CreditCard, Users, Mail, Phone, MapPin,
  Globe, Save, Eye, EyeOff, Key, 
  AlertCircle, CheckCircle, ChevronRight,
  Clock, DollarSign, Zap, Activity,
  Edit2, Trash2, UserPlus, Lock,
  Smartphone, Monitor, Calendar, BarChart3, Sparkles, 
  Upload, Camera, FileText, Brain, AlertTriangle, X
} from 'lucide-react'
import { NairaIcon } from '@shared/components'
import { useAuth } from '@contexts/AuthContext'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Input, Select, 
  Alert, Badge, Modal 
} from '@shared/components'

export const InsurerSettings = () => {
  const { user, profile, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('company')
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTeamMember, setSelectedTeamMember] = useState(null)
  const [companyLogo, setCompanyLogo] = useState(null)
  
  // Form states
  const [companyInfo, setCompanyInfo] = useState({
    companyName: profile?.company_name || 'Demo Insurance Co.',
    registrationNumber: 'INS-2024-001',
    email: user?.email || '',
    phone: profile?.phone || '+234 802 345 6789',
    address: profile?.address || '456 Business Ave, Lagos',
    city: profile?.city || 'Lagos',
    country: profile?.country || 'Nigeria',
    website: 'www.demoinsurance.com',
    founded: '2010'
  })

  const [businessSettings, setBusinessSettings] = useState({
    claimApprovalLimit: 50000,
    autoApprovalThreshold: 5000,
    fraudRiskThreshold: 0.7,
    processingTimeTarget: 3,
    requireSecondApproval: true,
    enableAIRecommendations: true,
    defaultCurrency: 'NGN',
    timezone: 'Africa/Lagos'
  })

  const [notifications, setNotifications] = useState({
    newClaims: true,
    highRiskClaims: true,
    fraudAlerts: true,
    customerMessages: true,
    systemUpdates: false,
    weeklyReports: true,
    monthlyAnalytics: true,
    emailDigest: 'daily'
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    ipWhitelisting: false,
    apiAccess: false
  })

  const [team, setTeam] = useState([
    { id: '1', name: 'Kemi Adeyemi', email: 'kemi.adeyemi@insurance.com', role: 'admin', status: 'active', avatar: null },
    { id: '2', name: 'Tunde Ogunbiyi', email: 'tunde.ogunbiyi@insurance.com', role: 'adjuster', status: 'active', avatar: null },
    { id: '3', name: 'Ngozi Okonkwo', email: 'ngozi.okonkwo@insurance.com', role: 'reviewer', status: 'active', avatar: null }
  ])

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [newTeamMember, setNewTeamMember] = useState({
    name: '',
    email: '',
    role: 'reviewer'
  })

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building },
    { id: 'business', label: 'Business Rules', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ]

  const handleSaveCompanyInfo = async () => {
    setLoading(true)
    setSaveSuccess(false)
    
    try {
      await updateProfile(user.id, {
        company_name: companyInfo.companyName,
        phone: companyInfo.phone,
        address: companyInfo.address,
        city: companyInfo.city,
        country: companyInfo.country
      })
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating company info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCompanyLogo(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddTeamMember = () => {
    if (newTeamMember.name && newTeamMember.email) {
      const newMember = {
        id: Date.now().toString(),
        ...newTeamMember,
        status: 'pending',
        avatar: null
      }
      setTeam([...team, newMember])
      setNewTeamMember({ name: '', email: '', role: 'reviewer' })
      setShowTeamModal(false)
    }
  }

  const handleDeleteTeamMember = () => {
    setTeam(team.filter(member => member.id !== selectedTeamMember.id))
    setShowDeleteModal(false)
    setSelectedTeamMember(null)
  }

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      adjuster: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      reviewer: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    }
    
    return (
      <Badge className={`${colors[role]} border backdrop-blur-sm`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (status) => {
    const config = {
      active: {
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: CheckCircle
      },
      pending: {
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: Clock
      },
      inactive: {
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: X
      }
    }
    
    const { color, icon: Icon } = config[status]
    
    return (
      <Badge className={`${color} border backdrop-blur-sm`}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const renderCompanyInfo = () => (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Building className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Company Information</h2>
        </div>
      </div>
      <CardBody>
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="flex items-center gap-6 p-6 bg-gray-700/30 rounded-xl">
            <div className="relative group">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 p-0.5">
                <div className="w-full h-full rounded-xl bg-gray-800 flex items-center justify-center overflow-hidden">
                  {companyLogo ? (
                    <img src={companyLogo} alt="Company Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building className="w-10 h-10 text-gray-400" />
                  )}
                </div>
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{companyInfo.companyName}</h3>
              <p className="text-sm text-gray-400">Registration: {companyInfo.registrationNumber}</p>
              <Badge className="mt-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 border">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Premium Partner
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Company Name"
              type="text"
              value={companyInfo.companyName}
              onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
              icon={Building}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
            
            <Input
              label="Registration Number"
              type="text"
              value={companyInfo.registrationNumber}
              onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })}
              icon={Key}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
            
            <Input
              label="Email Address"
              type="email"
              value={companyInfo.email}
              disabled
              icon={Mail}
              className="bg-gray-700/50 border-gray-600 text-gray-400"
            />
            
            <Input
              label="Phone Number"
              type="tel"
              value={companyInfo.phone}
              onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
              icon={Phone}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
            
            <Input
              label="Website"
              type="text"
              value={companyInfo.website}
              onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
              icon={Globe}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
            
            <Input
              label="Founded Year"
              type="text"
              value={companyInfo.founded}
              onChange={(e) => setCompanyInfo({ ...companyInfo, founded: e.target.value })}
              icon={Calendar}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
            
            <Input
              label="Address"
              type="text"
              value={companyInfo.address}
              onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
              icon={MapPin}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500 md:col-span-2"
            />
            
            <Input
              label="City"
              type="text"
              value={companyInfo.city}
              onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
              icon={MapPin}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
            
            <Input
              label="Country"
              type="text"
              value={companyInfo.country}
              onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
              icon={Globe}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
          </div>

          {saveSuccess && (
            <Alert type="success" title="Changes saved" className="bg-emerald-900/20 border-emerald-500/50">
              Company information has been updated successfully.
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSaveCompanyInfo}
              loading={loading}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )

  const renderBusinessRules = () => (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Settings className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Business Rules</h2>
        </div>
      </div>
      <CardBody>
        <div className="space-y-6">
          {/* Claims Processing */}
          <div className="p-6 bg-gray-700/30 rounded-xl">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Claims Processing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Claim Approval Limit (NGN)
                </label>
                <div className="relative">
                  <NairaIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="number"
                    value={businessSettings.claimApprovalLimit}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, claimApprovalLimit: e.target.value })}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Auto-Approval Threshold (NGN)
                </label>
                <div className="relative">
                  <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="number"
                    value={businessSettings.autoApprovalThreshold}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, autoApprovalThreshold: e.target.value })}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Processing Time Target (Days)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="number"
                    value={businessSettings.processingTimeTarget}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, processingTimeTarget: e.target.value })}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fraud Risk Threshold
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={businessSettings.fraudRiskThreshold}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, fraudRiskThreshold: e.target.value })}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="p-6 bg-gray-700/30 rounded-xl">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Configuration
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg group hover:bg-gray-700/70 transition-colors">
                <div>
                  <h4 className="font-medium text-gray-100">AI Recommendations</h4>
                  <p className="text-sm text-gray-400">Enable AI-powered claim recommendations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={businessSettings.enableAIRecommendations}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, enableAIRecommendations: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg group hover:bg-gray-700/70 transition-colors">
                <div>
                  <h4 className="font-medium text-gray-100">Second Approval Required</h4>
                  <p className="text-sm text-gray-400">Require manager approval for high-value claims</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={businessSettings.requireSecondApproval}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, requireSecondApproval: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Default Currency"
              value={businessSettings.defaultCurrency}
              onChange={(e) => setBusinessSettings({ ...businessSettings, defaultCurrency: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white"
            >
              <option value="NGN">Nigerian Naira (NGN)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="GBP">British Pound (GBP)</option>
            </Select>
            
            <Select
              label="Timezone"
              value={businessSettings.timezone}
              onChange={(e) => setBusinessSettings({ ...businessSettings, timezone: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white"
            >
              <option value="Africa/Lagos">Lagos (GMT+1)</option>
              <option value="Africa/Abuja">Abuja (GMT+1)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="America/New_York">New York (EST)</option>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300">
              <Save className="w-4 h-4 mr-2" />
              Save Rules
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )

  const renderNotifications = () => (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Bell className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
        </div>
      </div>
      <CardBody>
        <div className="space-y-6">
          {/* Real-time Alerts */}
          <div>
            <h3 className="font-medium text-white mb-4">Real-time Alerts</h3>
            <div className="space-y-3">
              {[
                { key: 'newClaims', label: 'New Claims', description: 'Get notified when new claims are submitted', icon: FileText, color: 'blue' },
                { key: 'highRiskClaims', label: 'High Risk Claims', description: 'Alerts for claims with high fraud risk', icon: AlertTriangle, color: 'red' },
                { key: 'fraudAlerts', label: 'Fraud Detection', description: 'Immediate alerts for detected fraud', icon: Shield, color: 'orange' },
                { key: 'customerMessages', label: 'Customer Messages', description: 'Messages from customers about claims', icon: Mail, color: 'purple' }
              ].map(({ key, label, description, icon: Icon, color }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 bg-${color}-500/20 rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 text-${color}-400`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-100">{label}</h4>
                      <p className="text-sm text-gray-400">{description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[key]}
                      onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-green-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Reports & Digests */}
          <div>
            <h3 className="font-medium text-white mb-4">Reports & Digests</h3>
            <div className="space-y-3">
              {[
                { key: 'weeklyReports', label: 'Weekly Reports', description: 'Summary of weekly claims and performance', icon: BarChart3, color: 'cyan' },
                { key: 'monthlyAnalytics', label: 'Monthly Analytics', description: 'Detailed monthly analytics report', icon: Activity, color: 'purple' },
                { key: 'systemUpdates', label: 'System Updates', description: 'Updates about new features and maintenance', icon: Zap, color: 'amber' }
              ].map(({ key, label, description, icon: Icon, color }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 bg-${color}-500/20 rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 text-${color}-400`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-100">{label}</h4>
                      <p className="text-sm text-gray-400">{description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[key]}
                      onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-green-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Email Digest Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Digest Frequency</label>
            <Select
              value={notifications.emailDigest}
              onChange={(e) => setNotifications({ ...notifications, emailDigest: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white"
            >
              <option value="realtime">Real-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="never">Never</option>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300">
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )

  const renderSecurity = () => (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Security Settings</h2>
        </div>
      </div>
      <CardBody>
        <div className="space-y-6">
          {/* Password */}
          <div className="p-6 bg-gray-700/30 rounded-xl group hover:bg-gray-700/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Key className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-100">Password</h4>
                  <p className="text-sm text-gray-400">Last changed 2 months ago</p>
                </div>
              </div>
              <Button 
                variant="secondary"
                onClick={() => setShowPasswordModal(true)}
                className="hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/50"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Change
              </Button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="p-6 bg-gray-700/30 rounded-xl group hover:bg-gray-700/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-100">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-400">
                    {security.twoFactorEnabled ? 'Enabled for all admin accounts' : 'Add an extra layer of security'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.twoFactorEnabled}
                  onChange={(e) => setSecurity({ ...security, twoFactorEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Session Settings */}
          <div className="p-6 bg-gray-700/30 rounded-xl">
            <h4 className="font-medium text-gray-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Session Management
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Timeout (minutes)
                </label>
                <Input
                  type="number"
                  value={security.sessionTimeout}
                  onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Advanced Security */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-colors">
              <div>
                <h4 className="font-medium text-gray-100">IP Whitelisting</h4>
                <p className="text-sm text-gray-400">Restrict access to specific IP addresses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.ipWhitelisting}
                  onChange={(e) => setSecurity({ ...security, ipWhitelisting: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-red-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-colors">
              <div>
                <h4 className="font-medium text-gray-100">API Access</h4>
                <p className="text-sm text-gray-400">Enable API access for third-party integrations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.apiAccess}
                  onChange={(e) => setSecurity({ ...security, apiAccess: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-purple-600"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-lg hover:shadow-red-500/25 transform hover:scale-105 transition-all duration-300">
              <Save className="w-4 h-4 mr-2" />
              Save Security Settings
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )

  const renderTeam = () => (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Team Management</h2>
          </div>
          <Button
            onClick={() => setShowTeamModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>
      <CardBody>
        <div className="space-y-4">
          {team.map((member) => (
            <div key={member.id} className="p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${
                      member.status === 'active' ? 'bg-green-500' : member.status === 'pending' ? 'bg-amber-500' : 'bg-gray-500'
                    } border-2 border-gray-800 rounded-full`}></div>
                  </div>
                  <div>
                    <h4 className="font-medium text-white group-hover:text-cyan-400 transition-colors">{member.name}</h4>
                    <p className="text-sm text-gray-400">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getRoleBadge(member.role)}
                  {getStatusBadge(member.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTeamMember(member)
                      setShowDeleteModal(true)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )

  const renderBilling = () => (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Billing & Subscription</h2>
        </div>
      </div>
      <CardBody>
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl border border-cyan-500/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-100">Current Plan</h4>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 border">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Enterprise
              </Badge>
            </div>
            <p className="text-3xl font-bold text-white mb-2">₦500,000<span className="text-lg font-normal text-gray-400">/month</span></p>
            <p className="text-sm text-gray-400 mb-4">Next billing date: April 1, 2024</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Claims Processed</p>
                <p className="font-semibold text-white">1,245 / Unlimited</p>
              </div>
              <div>
                <p className="text-gray-400">Team Members</p>
                <p className="font-semibold text-white">3 / 50</p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-medium text-gray-100 mb-4">Included Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Unlimited Claims Processing',
                'Advanced AI Fraud Detection',
                'Real-time Analytics Dashboard',
                'Priority Support 24/7',
                'API Access',
                'Custom Integrations',
                'Dedicated Account Manager',
                'SLA Guarantee'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h4 className="font-medium text-gray-100 mb-4">Payment Method</h4>
            <div className="p-4 bg-gray-700/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-100">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-400">Expires 12/25</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                Update
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1">
              View Invoices
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600">
              Upgrade Plan
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )

  return (
    <DashboardLayout>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/30 rounded-full blur-[128px] animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[128px] animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-[128px] animate-float animation-delay-4000"></div>
      </div>

      <PageHeader
        title={
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Company Settings
          </span>
        }
        description="Manage your company profile, team, and system preferences"
      />

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-1 p-1 bg-gray-800/50 backdrop-blur-sm rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'company' && renderCompanyInfo()}
      {activeTab === 'business' && renderBusinessRules()}
      {activeTab === 'notifications' && renderNotifications()}
      {activeTab === 'security' && renderSecurity()}
      {activeTab === 'team' && renderTeam()}
      {activeTab === 'billing' && renderBilling()}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Change Password"
        >
          <form className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white"
            />
            <Input
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white"
            />
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPasswordModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600"
              >
                Update Password
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Team Member Modal */}
      {showTeamModal && (
        <Modal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          title="Add Team Member"
        >
          <form className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={newTeamMember.name}
              onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white"
            />
            <Input
              label="Email Address"
              type="email"
              value={newTeamMember.email}
              onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white"
            />
            <Select
              label="Role"
              value={newTeamMember.role}
              onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white"
            >
              <option value="admin">Admin</option>
              <option value="adjuster">Claims Adjuster</option>
              <option value="reviewer">Reviewer</option>
            </Select>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowTeamModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddTeamMember}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                Send Invitation
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTeamMember && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedTeamMember(null)
          }}
          title="Remove Team Member"
        >
          <div className="space-y-4">
            <Alert type="warning" className="bg-red-900/20 border-red-500/50">
              Are you sure you want to remove {selectedTeamMember.name} from your team? This action cannot be undone.
            </Alert>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedTeamMember(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTeamMember}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600"
              >
                Remove Member
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </DashboardLayout>
  )
}

export default InsurerSettings