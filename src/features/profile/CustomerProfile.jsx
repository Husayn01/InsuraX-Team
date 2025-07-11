import React, { useState } from 'react'
import { 
  User, Mail, Phone, MapPin, Shield, Lock, 
  Bell, CreditCard, Save, Camera, CheckCircle,
  AlertCircle, Key, Smartphone, Globe
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
    { id: 'payment', label: 'Payment Methods', icon: CreditCard }
  ]

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleSavePersonalInfo = async () => {
    setLoading(true)
    try {
      await updateProfile({
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

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    setLoading(true)
    try {
      // Simulate password change
      await new Promise(resolve => setTimeout(resolve, 1500))
      setShowPasswordModal(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      alert('Password updated successfully')
    } catch (error) {
      console.error('Error changing password:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle2FA = async () => {
    setShow2FAModal(true)
  }

  const renderPersonalInfo = () => (
    <Card>
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100">Personal Information</h2>
      </div>
      <CardBody>
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                <Camera className="w-4 h-4 text-gray-300" />
              </button>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-100">{personalInfo.fullName || 'User'}</h3>
              <p className="text-gray-400">Customer Account</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              value={personalInfo.fullName}
              onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
              icon={<User className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="Email Address"
              type="email"
              value={personalInfo.email}
              disabled
              icon={<Mail className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="Phone Number"
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
              placeholder="+234 801 234 5678"
              icon={<Phone className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="Country"
              value={personalInfo.country}
              onChange={(e) => handlePersonalInfoChange('country', e.target.value)}
              icon={<Globe className="w-5 h-5 text-gray-400" />}
            />
            <div className="md:col-span-2">
              <Input
                label="Address"
                value={personalInfo.address}
                onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                placeholder="123 Main Street"
                icon={<MapPin className="w-5 h-5 text-gray-400" />}
              />
            </div>
            <Input
              label="City"
              value={personalInfo.city}
              onChange={(e) => handlePersonalInfoChange('city', e.target.value)}
              placeholder="Lagos"
            />
          </div>

          {saveSuccess && (
            <Alert type="success" title="Profile Updated">
              Your personal information has been saved successfully.
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSavePersonalInfo}
              loading={loading}
              disabled={loading}
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
    <Card>
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100">Notification Preferences</h2>
      </div>
      <CardBody>
        <div className="space-y-6">
          <div className="space-y-4">
            {[
              { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive updates via email' },
              { key: 'smsAlerts', label: 'SMS Alerts', description: 'Get text messages for important updates' },
              { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser and mobile app notifications' },
              { key: 'claimUpdates', label: 'Claim Status Updates', description: 'Get notified when your claim status changes' },
              { key: 'paymentReminders', label: 'Payment Reminders', description: 'Reminders for upcoming premium payments' },
              { key: 'newsletter', label: 'Newsletter', description: 'Monthly newsletter with insurance tips' }
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-100">{label}</h4>
                  <p className="text-sm text-gray-400">{description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[key]}
                    onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="primary">
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      <Card>
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Security Settings</h2>
        </div>
        <CardBody>
          <div className="space-y-6">
            {/* Password */}
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-100">Password</h4>
                  <p className="text-sm text-gray-400">Last changed 3 months ago</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </Button>
            </div>

            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-100">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-400">
                    {security.twoFactorEnabled ? 'Enabled - Extra security for your account' : 'Add an extra layer of security'}
                  </p>
                </div>
              </div>
              <Button
                variant={security.twoFactorEnabled ? "secondary" : "primary"}
                size="sm"
                onClick={handleToggle2FA}
              >
                {security.twoFactorEnabled ? 'Manage' : 'Enable'}
              </Button>
            </div>

            {/* Login Alerts */}
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-100">Login Alerts</h4>
                  <p className="text-sm text-gray-400">Get notified of new login attempts</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.loginAlerts}
                  onChange={(e) => setSecurity(prev => ({ ...prev, loginAlerts: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Trusted Devices */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Trusted Devices</h2>
        </div>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-100">iPhone 13 Pro</h4>
                  <p className="text-sm text-gray-400">Last active: 2 hours ago</p>
                </div>
              </div>
              <Badge variant="success">Current Device</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-100">Chrome on Windows</h4>
                  <p className="text-sm text-gray-400">Last active: Yesterday</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                Remove
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )

  const renderPaymentMethods = () => (
    <Card>
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100">Payment Methods</h2>
      </div>
      <CardBody>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-100">•••• •••• •••• 4242</h4>
                <p className="text-sm text-gray-400">Expires 12/25</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="success">Default</Badge>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          </div>
          
          <Button variant="secondary" className="w-full">
            <CreditCard className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      </CardBody>
    </Card>
  )

  return (
    <DashboardLayout>
      <PageHeader
        title="My Profile"
        description="Manage your personal information and preferences"
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-800/50 rounded-lg mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'personal' && renderPersonalInfo()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'security' && renderSecurity()}
        {activeTab === 'payment' && renderPaymentMethods()}
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            icon={<Lock className="w-5 h-5 text-gray-400" />}
          />
          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            icon={<Key className="w-5 h-5 text-gray-400" />}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            icon={<Key className="w-5 h-5 text-gray-400" />}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowPasswordModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePasswordChange}
              loading={loading}
              disabled={loading}
            >
              Update Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2FA Modal */}
      <Modal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        title="Two-Factor Authentication"
        size="md"
      >
        <div className="space-y-4">
          <Alert type="info" title="Enhance Your Security">
            Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
          </Alert>
          <div className="text-center py-8">
            <Smartphone className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-300">Scan the QR code with your authenticator app</p>
            <div className="w-48 h-48 bg-gray-700 rounded-lg mx-auto mt-4 flex items-center justify-center">
              <span className="text-gray-500">[QR Code]</span>
            </div>
          </div>
          <Input
            label="Enter verification code"
            placeholder="000000"
            className="text-center text-2xl"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShow2FAModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary">
              Enable 2FA
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default CustomerProfile