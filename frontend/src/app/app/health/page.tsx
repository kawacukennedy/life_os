'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { HealthAPI, Vital, HealthSummary, FitbitData } from '@/lib/api/health'

export default function HealthDashboard() {
  const [timeRange, setTimeRange] = useState('7d')
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null)
  const [vitals, setVitals] = useState<Vital[]>([])
  const [fitbitData, setFitbitData] = useState<FitbitData | null>(null)
  const [fitbitConnected, setFitbitConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHealthData()
  }, [timeRange])

  const loadHealthData = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem('userId') || 'user123'

      const summary = await HealthAPI.getHealthSummary(userId)
      setHealthSummary(summary)

      // Calculate date range based on timeRange
      const endDate = new Date()
      const startDate = new Date()
      if (timeRange === '7d') {
        startDate.setDate(endDate.getDate() - 7)
      } else if (timeRange === '30d') {
        startDate.setDate(endDate.getDate() - 30)
      }

      const vitalsData = await HealthAPI.getVitalsByDateRange(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      setVitals(vitalsData)

      // Try to load Fitbit data
      try {
        const fitbit = await HealthAPI.getFitbitData()
        setFitbitData(fitbit)
        setFitbitConnected(true)
      } catch (fitbitErr) {
        setFitbitConnected(false)
        console.log('Fitbit not connected:', fitbitErr)
      }
    } catch (err) {
      setError('Failed to load health data')
      console.error('Error loading health data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const chartData = [
    ...HealthAPI.aggregateVitalsByDate(vitals, 'heart_rate').map(item => ({
      date: item.date.split('-')[2], // Day only
      heartRate: item.value,
    })),
    ...HealthAPI.aggregateVitalsByDate(vitals, 'steps').map(item => ({
      date: item.date.split('-')[2],
      steps: item.value / 100, // Scale down for chart
    })),
    ...HealthAPI.aggregateVitalsByDate(vitals, 'sleep').map(item => ({
      date: item.date.split('-')[2],
      sleep: item.value,
    })),
  ].reduce((acc, item) => {
    const existing = acc.find(d => d.date === item.date)
    if (existing) {
      Object.assign(existing, item)
    } else {
      acc.push(item)
    }
    return acc
  }, [] as any[]).sort((a, b) => parseInt(a.date) - parseInt(b.date))

  const latestHeartRate = HealthAPI.aggregateVitalsByDate(vitals, 'heart_rate').pop()?.value || 0
  const latestSteps = HealthAPI.aggregateVitalsByDate(vitals, 'steps').pop()?.value || 0
  const latestSleep = HealthAPI.aggregateVitalsByDate(vitals, 'sleep').pop()?.value || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-start mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading health data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadHealthData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
            <div className="flex space-x-2">
              <Button
                variant={timeRange === '7d' ? 'default' : 'outline'}
                onClick={() => setTimeRange('7d')}
              >
                7 Days
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'outline'}
                onClick={() => setTimeRange('30d')}
              >
                30 Days
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Vitals Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-accent-green rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">♥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Resting Heart Rate
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Math.round(latestHeartRate)} bpm
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-start rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">👣</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Daily Steps
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Math.round(latestSteps).toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-accent-yellow rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">😴</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Sleep Duration
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {latestSleep.toFixed(1)}h
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
           </div>

           {/* Fitbit Integration */}
           <div className="bg-white shadow rounded-lg p-6 mb-8">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Fitbit Integration</h3>
               {!fitbitConnected && (
                 <Button onClick={() => HealthAPI.getFitbitAuth()}>
                   Connect Fitbit
                 </Button>
               )}
             </div>

             {fitbitConnected && fitbitData ? (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="text-center">
                   <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                     <span className="text-2xl">👣</span>
                   </div>
                   <p className="text-2xl font-bold text-gray-900">{fitbitData.activities.steps.toLocaleString()}</p>
                   <p className="text-sm text-gray-500">Steps Today</p>
                 </div>
                 <div className="text-center">
                   <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                     <span className="text-2xl">♥</span>
                   </div>
                   <p className="text-2xl font-bold text-gray-900">{fitbitData.heartRate.restingHeartRate}</p>
                   <p className="text-sm text-gray-500">Resting HR (bpm)</p>
                 </div>
                 <div className="text-center">
                   <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                     <span className="text-2xl">😴</span>
                   </div>
                   <p className="text-2xl font-bold text-gray-900">{Math.round(fitbitData.sleep.totalMinutesAsleep / 60)}h</p>
                   <p className="text-sm text-gray-500">Sleep Last Night</p>
                 </div>
               </div>
             ) : (
               <div className="text-center py-8">
                 <p className="text-gray-500 mb-4">Connect your Fitbit to sync your health data automatically</p>
                 <Button onClick={() => HealthAPI.getFitbitAuth()}>
                   Connect Fitbit Account
                 </Button>
               </div>
             )}
           </div>

           {/* Vitals Trends Chart */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vitals Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Heart Rate (bpm)"
                  />
                  <Line
                    type="monotone"
                    dataKey="steps"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Steps (x100)"
                  />
                  <Line
                    type="monotone"
                    dataKey="sleep"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Sleep (hours)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {vitals
                .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
                .slice(0, 5)
                .map((vital) => (
                  <div key={vital.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(vital.recordedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {vital.metricType === 'heart_rate' && `Heart Rate: ${vital.value} ${vital.unit}`}
                        {vital.metricType === 'steps' && `Steps: ${vital.value.toLocaleString()}`}
                        {vital.metricType === 'sleep' && `Sleep: ${vital.value} ${vital.unit}`}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
            </div>
            {vitals.length === 0 && (
              <p className="text-gray-500 text-center py-4">No health data available yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}