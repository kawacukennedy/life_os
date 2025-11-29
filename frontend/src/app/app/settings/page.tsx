'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { AuthAPI } from '@/lib/api/auth'
import { HealthAPI } from '@/lib/api/health'
import { FinanceAPI } from '@/lib/api/finance'
import { NotificationsAPI } from '@/lib/api/notifications'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { i18n } = useTranslation()
  const { permission, requestPermission, subscribeToPush, sendNotification } = usePushNotifications()

  useEffect(() => {
    loadIntegrationsStatus()
    loadNotificationPreferences()
  }, [])

  const loadIntegrationsStatus = async () => {
    try {
      // Check Google Calendar
      try {
        await AuthAPI.getCalendarEvents()
        setIntegrations(prev => ({ ...prev, google: true }))
      } catch {}

      // Check Fitbit
      try {
        await HealthAPI.getFitbitData()
        setIntegrations(prev => ({ ...prev, fitbit: true }))
      } catch {}

      // Check Plaid
      try {
        await FinanceAPI.getAccounts()
        setIntegrations(prev => ({ ...prev, plaid: true }))
      } catch {}
    } catch (err) {
      console.error('Error loading integrations:', err)
    }
  }

  const loadNotificationPreferences = async () => {
    try {
      const prefs = await NotificationsAPI.getPreferences()
      setNotificationPreferences(prefs)
    } catch (err) {
      console.error('Error loading notification preferences:', err)
    }
  }

  const [settings, setSettings] = useState({
    fullName: 'John Doe',
    email: 'john@example.com',
    timezone: 'America/New_York',
    language: 'en',
    notifications: true,
    pushNotifications: false,
    dataExport: false,
    deleteAccount: false,
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    dataSharing: false,
    analytics: true,
    aiTraining: true,
    marketingEmails: false,
  })

  const [integrations, setIntegrations] = useState({
    google: false,
    fitbit: false,
    plaid: false,
  })

  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    push: false,
    sms: false,
    health: true,
    finance: true,
    learning: true,
  })

  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleLanguageChange = (language: string) => {
    setSettings({ ...settings, language })
    i18n.changeLanguage(language)
  }

  const handleSave = async () => {
    try {
      // Save notification preferences
      await NotificationsAPI.updatePreferences(notificationPreferences)
      console.log('Settings saved successfully')
    } catch (err) {
      console.error('Error saving settings:', err)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      const reader = new FileReader()
      reader.onload = (e) => setAvatarPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatar) return
    try {
      await AuthAPI.uploadAvatar(avatar)
      setAvatar(null)
      setAvatarPreview(null)
      // Refresh user data
    } catch (err) {
      console.error('Error uploading avatar:', err)
    }
  }

  const handleDisconnectIntegration = async (service: 'google' | 'fitbit' | 'plaid') => {
    // In a real implementation, you'd call the backend to disconnect
    setIntegrations(prev => ({ ...prev, [service]: false }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-8">
            {/* Account Settings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Account Settings</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={settings.fullName}
                      onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-start"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                </div>
              </div>
             </div>

             {/* Integrations */}
             <div className="bg-white shadow rounded-lg">
               <div className="px-6 py-4 border-b border-gray-200">
                 <h2 className="text-lg font-medium text-gray-900">Integrations</h2>
               </div>
               <div className="px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-red-600 font-bold">G</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Google Calendar</h3>
                        <p className="text-sm text-gray-500">Sync your calendar events and schedule optimization</p>
                        <p className="text-xs text-gray-400">Last synced: 2 hours ago</p>
                      </div>
                    </div>
                    {integrations.google ? (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Re-sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectIntegration('google')}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => AuthAPI.getGoogleCalendarAuth()}
                      >
                        Connect
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-green-600">🏃</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Fitbit</h3>
                        <p className="text-sm text-gray-500">Sync health metrics, steps, sleep, and heart rate</p>
                        <p className="text-xs text-gray-400">Last synced: 1 hour ago</p>
                      </div>
                    </div>
                    {integrations.fitbit ? (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Re-sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectIntegration('fitbit')}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => HealthAPI.getFitbitAuth()}
                      >
                        Connect
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600">💳</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Banking (Plaid)</h3>
                        <p className="text-sm text-gray-500">Securely connect bank accounts for budgeting and insights</p>
                        <p className="text-xs text-gray-400">Last synced: 6 hours ago</p>
                      </div>
                    </div>
                    {integrations.plaid ? (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Re-sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectIntegration('plaid')}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/finance/plaid/auth`}
                      >
                        Connect
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-purple-600">🤖</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">AI Personal Assistant</h3>
                        <p className="text-sm text-gray-500">Enable AI-powered recommendations and automation</p>
                        <p className="text-xs text-gray-400">Always active</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
               </div>
             </div>

             {/* Profile Picture */}
             <div className="bg-white shadow rounded-lg">
               <div className="px-6 py-4 border-b border-gray-200">
                 <h2 className="text-lg font-medium text-gray-900">Profile Picture</h2>
               </div>
               <div className="px-6 py-4">
                 <div className="flex items-center space-x-4">
                   <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                     {avatarPreview ? (
                       <img src={avatarPreview} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover" />
                     ) : (
                       <span className="text-gray-500 text-2xl">👤</span>
                     )}
                   </div>
                   <div className="flex-1">
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handleAvatarChange}
                       className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-start file:text-white hover:file:bg-primary-end"
                     />
                     {avatar && (
                       <Button onClick={handleAvatarUpload} className="mt-2">
                         Upload Avatar
                       </Button>
                     )}
                   </div>
                 </div>
               </div>
             </div>

              {/* Privacy Settings */}
             <div className="bg-white shadow rounded-lg">
               <div className="px-6 py-4 border-b border-gray-200">
                 <h2 className="text-lg font-medium text-gray-900">Privacy & Data</h2>
               </div>
               <div className="px-6 py-4 space-y-6">
                 <div>
                   <h3 className="text-sm font-medium text-gray-900 mb-3">Profile Visibility</h3>
                   <div className="space-y-2">
                     {[
                       { value: 'public', label: 'Public', desc: 'Anyone can see your profile' },
                       { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
                       { value: 'friends', label: 'Friends Only', desc: 'Only connected users can see your profile' },
                     ].map(({ value, label, desc }) => (
                       <label key={value} className="flex items-center">
                         <input
                           type="radio"
                           name="profileVisibility"
                           value={value}
                           checked={privacySettings.profileVisibility === value}
                           onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                           className="text-primary-start focus:ring-primary-start"
                         />
                         <div className="ml-3">
                           <span className="text-sm font-medium text-gray-900">{label}</span>
                           <p className="text-sm text-gray-500">{desc}</p>
                         </div>
                       </label>
                     ))}
                   </div>
                 </div>

                 <div>
                   <h3 className="text-sm font-medium text-gray-900 mb-3">Data Usage</h3>
                   <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <div>
                         <span className="text-sm text-gray-700">Analytics & Improvements</span>
                         <p className="text-xs text-gray-500">Help improve LifeOS with usage data</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={privacySettings.analytics}
                           onChange={(e) => setPrivacySettings({ ...privacySettings, analytics: e.target.checked })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <span className="text-sm text-gray-700">AI Training</span>
                         <p className="text-xs text-gray-500">Allow anonymized data to improve AI recommendations</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={privacySettings.aiTraining}
                           onChange={(e) => setPrivacySettings({ ...privacySettings, aiTraining: e.target.checked })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <span className="text-sm text-gray-700">Marketing Communications</span>
                         <p className="text-xs text-gray-500">Receive emails about new features and updates</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={privacySettings.marketingEmails}
                           onChange={(e) => setPrivacySettings({ ...privacySettings, marketingEmails: e.target.checked })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                       </label>
                     </div>
                   </div>
                 </div>

                 <div className="border-t pt-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <h3 className="text-sm font-medium text-gray-900">Data Export</h3>
                       <p className="text-sm text-gray-500">Download a copy of your data</p>
                     </div>
                     <Button
                       variant="outline"
                       onClick={() => setSettings({ ...settings, dataExport: true })}
                     >
                       Request Export
                     </Button>
                   </div>

                   <div className="flex items-center justify-between mt-4">
                     <div>
                       <h3 className="text-sm font-medium text-gray-900">Delete Account</h3>
                       <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                     </div>
                     <Button
                       variant="destructive"
                       onClick={() => setSettings({ ...settings, deleteAccount: true })}
                     >
                       Delete Account
                     </Button>
                   </div>
                 </div>
               </div>
             </div>

            {/* Appearance Settings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Appearance</h2>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Theme</h3>
                    <p className="text-sm text-gray-500">Choose your preferred theme</p>
                  </div>
                  <Button onClick={toggleTheme} variant="outline">
                    {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                  </Button>
                </div>
              </div>
            </div>

             {/* Notification Settings */}
             <div className="bg-white shadow rounded-lg">
               <div className="px-6 py-4 border-b border-gray-200">
                 <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
               </div>
               <div className="px-6 py-4 space-y-6">
                 <div>
                   <h3 className="text-sm font-medium text-gray-900 mb-3">Channels</h3>
                   <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <div>
                         <span className="text-sm text-gray-700">Email</span>
                         <p className="text-xs text-gray-500">Receive notifications via email</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={notificationPreferences.email}
                           onChange={(e) => setNotificationPreferences({ ...notificationPreferences, email: e.target.checked })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <span className="text-sm text-gray-700">Push Notifications</span>
                         <p className="text-xs text-gray-500">Receive push notifications in your browser</p>
                       </div>
                       <div className="flex space-x-2">
                         {permission === 'default' && (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={async () => {
                               const perm = await requestPermission()
                               if (perm === 'granted') {
                                 await subscribeToPush()
                                 setNotificationPreferences({ ...notificationPreferences, push: true })
                               }
                             }}
                           >
                             Enable
                           </Button>
                         )}
                         {permission === 'granted' && (
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input
                               type="checkbox"
                               checked={notificationPreferences.push}
                               onChange={(e) => setNotificationPreferences({ ...notificationPreferences, push: e.target.checked })}
                               className="sr-only peer"
                             />
                             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                           </label>
                         )}
                         {permission === 'denied' && (
                           <span className="text-sm text-red-600">Blocked</span>
                         )}
                       </div>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <span className="text-sm text-gray-700">SMS</span>
                         <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={notificationPreferences.sms}
                           onChange={(e) => setNotificationPreferences({ ...notificationPreferences, sms: e.target.checked })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                       </label>
                     </div>
                   </div>
                 </div>

                 <div>
                   <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
                   <div className="space-y-3">
                     {[
                       { key: 'health', label: 'Health & Fitness', desc: 'Updates about your health data and goals' },
                       { key: 'finance', label: 'Finance', desc: 'Financial updates and budget alerts' },
                       { key: 'learning', label: 'Learning', desc: 'Course progress and learning recommendations' },
                     ].map(({ key, label, desc }) => (
                       <div key={key} className="flex items-center justify-between">
                         <div>
                           <span className="text-sm text-gray-700">{label}</span>
                           <p className="text-xs text-gray-500">{desc}</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input
                             type="checkbox"
                             checked={notificationPreferences[key as keyof typeof notificationPreferences] as boolean}
                             onChange={(e) => setNotificationPreferences({
                               ...notificationPreferences,
                               [key]: e.target.checked
                             })}
                             className="sr-only peer"
                           />
                           <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-start/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-start"></div>
                         </label>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}