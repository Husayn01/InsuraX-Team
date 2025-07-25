import React, { useState } from 'react'
import { 
  User, Mail, Phone, MapPin, Shield, Lock, 
  Bell, CreditCard, Save, Camera, CheckCircle,
  AlertCircle, Key, Smartphone, Globe, ChevronRight,
  Sparkles, Activity, Settings, Eye, EyeOff,
  Edit2, Upload, Zap, Plus
} from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { DashboardLayout, PageHeader } from '@shared/layouts'
import { 
  Button, Card, CardBody, Input, Alert, 
  Badge, Modal, LoadingSpinner 
} from '@shared/components'

export const CustomerProfile = () => {
  const { user, profile, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  
  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    fullName: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    country: profile?.country || 'Nigeria'
  })

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    claimUpdates: true,
    paymentReminders: true,
    newsletter: false
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    trustedDevices: 2
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ]

  const handleSavePersonalInfo = async () => {
    setLoading(true)
    setSaveSuccess(false)
    
    try {
      await updateProfile(user.id, {
        full_name: personalInfo.fullName,
        phone: personalInfo.phone,
        address: personalInfo.address,
        city: personalInfo.city,
        country: personalInfo.country
      })
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const renderPersonalInfo = () => (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <User className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Personal Information</h2>
        </div>
      </div>
      <CardBody>
        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-6 p-6 bg-gray-700/30 rounded-xl">
            <div className="relative group">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 p-0.5">
                <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {personalInfo.fullName?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-gray-800 rounded-full"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{personalInfo.fullName || 'User'}</h3>
              <p className="text-sm text-gray-400">Member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : 'N/A'}</p>
              <Badge className="mt-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 border">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Premium Member
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              type="text"
              value={personalInfo.fullName}
              onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
              icon={User}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
            
            <Input
              label="Email Address"
              type="email"
              value={personalInfo.email}
              disabled
              icon={Mail}
              className="bg-gray-700/50 border-gray-600 text-gray-400"
            />
            
            <Input
              label="Phone Number"
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              icon={Phone}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
            
            <Input
              label="Country"
              type="text"
              value={personalInfo.country}
              onChange={(e) => setPersonalInfo({ ...personalInfo, country: e.target.value })}
              icon={Globe}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
            
            <Input
              label="Address"
              type="text"
              value={personalInfo.address}
              onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
              icon={MapPin}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500 md:col-span-2"
            />
            
            <Input
              label="City"
              type="text"
              value={personalInfo.city}
              onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
              icon={MapPin}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-cyan-500"
            />
          </div>

          {saveSuccess && (
            <Alert type="success" title="Changes saved" className="bg-emerald-900/20 border-emerald-500/50">
              Your profile has been updated successfully.
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSavePersonalInfo}
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

  const renderNotifications = () => (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Bell className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
        </div>
      </div>
      <CardBody>
        <div className="space-y-6">
          <div className="space-y-4">
            {[
              { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive updates via email', icon: Mail, color: 'blue' },
              { key: 'smsAlerts', label: 'SMS Alerts', description: 'Get text messages for important updates', icon: Smartphone, color: 'green' },
              { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser and mobile app notifications', icon: Bell, color: 'purple' },
              { key: 'claimUpdates', label: 'Claim Status Updates', description: 'Get notified when your claim status changes', icon: Activity, color: 'cyan' },
              { key: 'paymentReminders', label: 'Payment Reminders', description: 'Reminders for upcoming premium payments', icon: CreditCard, color: 'emerald' },
              { key: 'newsletter', label: 'Newsletter', description: 'Monthly newsletter with insurance tips', icon: Mail, color: 'pink' }
            ].map(({ key, label, description, icon: Icon, color }) => (
              <div key={key} className="group">
                <div className="flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-all duration-300">
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
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300">
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
          {/* Password Section */}
          <div className="p-6 bg-gray-700/30 rounded-xl group hover:bg-gray-700/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Key className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-100">Password</h4>
                  <p className="text-sm text-gray-400">Last changed 3 months ago</p>
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

          {/* 2FA Section */}
          <div className="p-6 bg-gray-700/30 rounded-xl group hover:bg-gray-700/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-100">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-400">
                    {security.twoFactorEnabled ? 'Enabled - Extra security for your account' : 'Add an extra layer of security'}
                  </p>
                </div>
              </div>
              <Button 
                variant={security.twoFactorEnabled ? "secondary" : "primary"}
                onClick={() => setShow2FAModal(true)}
                className={security.twoFactorEnabled ? "" : "bg-gradient-to-r from-green-500 to-emerald-600"}
              >
                {security.twoFactorEnabled ? 'Manage' : 'Enable'}
              </Button>
            </div>
          </div>

          {/* Login Alerts */}
          <div className="p-6 bg-gray-700/30 rounded-xl group hover:bg-gray-700/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-100">Login Alerts</h4>
                  <p className="text-sm text-gray-400">Get notified of new login attempts</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.loginAlerts}
                  onChange={(e) => setSecurity({ ...security, loginAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Trusted Devices */}
          <div className="p-6 bg-gray-700/30 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Smartphone className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-100">Trusted Devices</h4>
                <p className="text-sm text-gray-400">{security.trustedDevices} devices currently trusted</p>
              </div>
            </div>
            <Button variant="secondary" className="w-full hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/50">
              Manage Devices
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </div>
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
          <h2 className="text-xl font-semibold text-white">Billing & Payments</h2>
        </div>
      </div>
      <CardBody>
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl border border-cyan-500/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-100">Current Plan</h4>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 border">
                <Zap className="w-3.5 h-3.5 mr-1" />
                Premium
              </Badge>
            </div>
            <p className="text-3xl font-bold text-white mb-2">₦25,000<span className="text-lg font-normal text-gray-400">/month</span></p>
            <p className="text-sm text-gray-400 mb-4">Next billing date: April 1, 2024</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1">Change Plan</Button>
              <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600">Upgrade</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-100">Payment Methods</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-100">•••• •••• •••• 4242</p>
                    <p className="text-sm text-gray-400">Expires 12/25</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">Default</Badge>
              </div>
              
              <Button variant="secondary" className="w-full hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/50">
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
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
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-emerald-500/20 rounded-full blur-[128px] animate-float animation-delay-4000"></div>
      </div>

      <PageHeader
        title={
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Account Settings
          </span>
        }
        description="Manage your profile, preferences, and security settings"
      />

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-1 p-1 bg-gray-800/50 backdrop-blur-sm rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
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
      {activeTab === 'personal' && renderPersonalInfo()}
      {activeTab === 'notifications' && renderNotifications()}
      {activeTab === 'security' && renderSecurity()}
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

      {/* 2FA Modal */}
      {show2FAModal && (
        <Modal
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
          title="Two-Factor Authentication"
        >
          <div className="space-y-4">
            <Alert type="info" className="bg-blue-900/20 border-blue-500/50">
              Protect your account with an additional security layer
            </Alert>
            <p className="text-gray-300">
              Scan this QR code with your authenticator app to enable 2FA.
            </p>
            <div className="flex justify-center p-8 bg-white rounded-lg">
              {/* QR Code placeholder */}
              <div className="w-48 h-48 bg-gray-200 rounded"></div>
            </div>
            <Input
              label="Verification Code"
              type="text"
              placeholder="Enter 6-digit code"
              className="bg-gray-700/50 border-gray-600 text-white"
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShow2FAModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
              >
                Enable 2FA
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

export default CustomerProfile