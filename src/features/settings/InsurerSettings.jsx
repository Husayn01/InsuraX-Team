import React, { useState } from 'react'
import { 
  Settings, User, Bell, Shield, Building, 
  CreditCard, Users, Mail, Phone, MapPin,
  Globe, Save, Eye, EyeOff, Key, 
  AlertCircle, CheckCircle, ChevronRight
} from 'lucide-react'
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
    { id: '1', name: 'Kemi Adeyemi', email: 'kemi.adeyemi@insurance.com', role: 'admin', status: 'active' },
    { id: '2', name: 'Tunde Ogunbiyi', email: 'tunde.ogunbiyi@insurance.com', role: 'adjuster', status: 'active' },
    { id: '3', name: 'Ngozi Okonkwo', email: 'ngozi.okonkwo@insurance.com', role: 'reviewer', status: 'active' }
  ])
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building },
    { id: 'business', label: 'Business Rules', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'team', label: 'Team', icon: Users }
  ]

  const handleCompanyInfoChange = (field, value) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleBusinessSettingsChange = (field, value) => {
    setBusinessSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderCompanyInfo = () => (
    <Card>
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100">Company Information</h2>
      </div>
      <CardBody>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Company Name"
              value={companyInfo.companyName}
              onChange={(e) => handleCompanyInfoChange('companyName', e.target.value)}
              icon={<Building className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="Registration Number"
              value={companyInfo.registrationNumber}
              onChange={(e) => handleCompanyInfoChange('registrationNumber', e.target.value)}
              disabled
            />
            <Input
              label="Email Address"
              type="email"
              value={companyInfo.email}
              onChange={(e) => handleCompanyInfoChange('email', e.target.value)}
              icon={<Mail className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="Phone Number"
              type="tel"
              value={companyInfo.phone}
              onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
              icon={<Phone className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="Website"
              type="url"
              value={companyInfo.website}
              onChange={(e) => handleCompanyInfoChange('website', e.target.value)}
              icon={<Globe className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="Founded Year"
              value={companyInfo.founded}
              onChange={(e) => handleCompanyInfoChange('founded', e.target.value)}
            />
            <div className="md:col-span-2">
              <Input
                label="Address"
                value={companyInfo.address}
                onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
                icon={<MapPin className="w-5 h-5 text-gray-400" />}
              />
            </div>
            <Input
              label="City"
              value={companyInfo.city}
              onChange={(e) => handleCompanyInfoChange('city', e.target.value)}
            />
            <Input
              label="Country"
              value={companyInfo.country}
              onChange={(e) => handleCompanyInfoChange('country', e.target.value)}
            />
          </div>

          {saveSuccess && (
            <Alert type="success" title="Settings Saved">
              Your company information has been updated successfully.
            </Alert>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} loading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )

  const renderBusinessSettings = () => (
    <Card>
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100">Business Rules & Settings</h2>
      </div>
      <CardBody>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Claim Approval Limit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
                <input
                  type="number"
                  value={businessSettings.claimApprovalLimit}
                  onChange={(e) => handleBusinessSettingsChange('claimApprovalLimit', parseFloat(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Maximum amount that can be approved by a single adjuster</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Auto-Approval Threshold
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
                <input
                  type="number"
                  value={businessSettings.autoApprovalThreshold}
                  onChange={(e) => handleBusinessSettingsChange('autoApprovalThreshold', parseFloat(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Claims below this amount with low risk can be auto-approved</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fraud Risk Threshold
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={businessSettings.fraudRiskThreshold * 100}
                  onChange={(e) => handleBusinessSettingsChange('fraudRiskThreshold', parseFloat(e.target.value) / 100)}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-300 w-12">
                  {(businessSettings.fraudRiskThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Claims above this risk score require manual review</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Processing Time Target (days)
              </label>
              <input
                type="number"
                value={businessSettings.processingTimeTarget}
                onChange={(e) => handleBusinessSettingsChange('processingTimeTarget', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Target time to process claims</p>
            </div>

            <Select
              label="Default Currency"
              value={businessSettings.defaultCurrency}
              onChange={(e) => handleBusinessSettingsChange('defaultCurrency', e.target.value)}
              options={[
                { value: 'NGN', label: 'NGN - Nigerian Naira' },
                { value: 'USD', label: 'USD - US Dollar' },
                { value: 'EUR', label: 'EUR - Euro' },
                { value: 'GBP', label: 'GBP - British Pound' }
              ]}
            />

            <Select
              label="Timezone"
              value={businessSettings.timezone}
              onChange={(e) => handleBusinessSettingsChange('timezone', e.target.value)}
              options={[
                { value: 'Africa/Lagos', label: 'Africa/Lagos (WAT)' },
                { value: 'UTC', label: 'UTC' },
                { value: 'America/New_York', label: 'America/New York (EST)' },
                { value: 'Europe/London', label: 'Europe/London (GMT)' }
              ]}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-100">Require Second Approval</h4>
                <p className="text-sm text-gray-400">High-value claims need two approvers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={businessSettings.requireSecondApproval}
                  onChange={(e) => handleBusinessSettingsChange('requireSecondApproval', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-100">Enable AI Recommendations</h4>
                <p className="text-sm text-gray-400">Use AI to suggest claim decisions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={businessSettings.enableAIRecommendations}
                  onChange={(e) => handleBusinessSettingsChange('enableAIRecommendations', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>

          {saveSuccess && (
            <Alert type="success" title="Settings Saved">
              Your business settings have been updated successfully.
            </Alert>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} loading={loading}>
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
            {Object.entries({
              newClaims: 'New claim submissions',
              highRiskClaims: 'High-risk claim alerts',
              fraudAlerts: 'Fraud detection alerts',
              customerMessages: 'Customer messages',
              systemUpdates: 'System updates',
              weeklyReports: 'Weekly performance reports',
              monthlyAnalytics: 'Monthly analytics digest'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-100">{label}</h4>
                  <p className="text-sm text-gray-400">
                    {key === 'newClaims' && 'Get notified when new claims are submitted'}
                    {key === 'highRiskClaims' && 'Alerts for claims with high fraud risk'}
                    {key === 'fraudAlerts' && 'Real-time fraud detection notifications'}
                    {key === 'customerMessages' && 'Messages from customers about claims'}
                    {key === 'systemUpdates' && 'Important system updates and maintenance'}
                    {key === 'weeklyReports' && 'Weekly summary of claim processing'}
                    {key === 'monthlyAnalytics' && 'Monthly performance analytics'}
                  </p>
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

          <div>
            <Select
              label="Email Digest Frequency"
              value={notifications.emailDigest}
              onChange={(e) => setNotifications(prev => ({ ...prev, emailDigest: e.target.value }))}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'never', label: 'Never' }
              ]}
            />
          </div>

          {saveSuccess && (
            <Alert type="success" title="Settings Saved">
              Your notification preferences have been updated.
            </Alert>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} loading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
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
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-100">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.twoFactorEnabled}
                    onChange={(e) => setSecurity(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-100">IP Whitelisting</h4>
                  <p className="text-sm text-gray-400">Restrict access to specific IP addresses</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.ipWhitelisting}
                    onChange={(e) => setSecurity(prev => ({ ...prev, ipWhitelisting: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-100">API Access</h4>
                  <p className="text-sm text-gray-400">Enable API access for third-party integrations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.apiAccess}
                    onChange={(e) => setSecurity(prev => ({ ...prev, apiAccess: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={security.sessionTimeout}
                  onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Automatically log out after this period of inactivity</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setShowPasswordModal(true)}
                className="w-full sm:w-auto"
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Recent Activity</h2>
        </div>
        <CardBody>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-100">Successful login</p>
                  <p className="text-xs text-gray-400">IP: 192.168.1.1</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-gray-100">Password changed</p>
                  <p className="text-xs text-gray-400">IP: 192.168.1.1</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">45 days ago</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )

  const renderTeam = () => (
    <Card>
      <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Team Members</h2>
        <Button size="sm">
          <Users className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>
      <CardBody>
        <div className="space-y-4">
          {team.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-100">{member.name}</h4>
                  <p className="text-sm text-gray-400">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={member.role === 'admin' ? 'warning' : 'secondary'}>
                  {member.role}
                </Badge>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Manage your company settings and preferences"
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
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
        {activeTab === 'company' && renderCompanyInfo()}
        {activeTab === 'business' && renderBusinessSettings()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'security' && renderSecurity()}
        {activeTab === 'team' && renderTeam()}
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
            icon={<Key className="w-5 h-5 text-gray-400" />}
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
            >
              Cancel
            </Button>
            <Button variant="primary">
              Update Password
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default InsurerSettings