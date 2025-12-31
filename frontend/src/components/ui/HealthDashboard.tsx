import React from 'react'
import { Card, CardContent, CardHeader } from './Card'
import { Badge } from './Badge'

interface HealthMetric {
  id: string
  metricType: string
  value: number
  unit: string
  timestamp: string
}

interface HealthData {
  userId: string
  date: string
  steps: number
  heartRate: number
  sleepHours: number
  calories: number
  activeMinutes: number
  vitals: HealthMetric[]
}

interface HealthDashboardProps {
  data: HealthData
  className?: string
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  data,
  className = ''
}) => {
  // Calculate progress percentages (example goals)
  const stepsGoal = 10000
  const stepsProgress = Math.min((data.steps / stepsGoal) * 100, 100)

  const sleepGoal = 8
  const sleepProgress = Math.min((data.sleepHours / sleepGoal) * 100, 100)

  const activeMinutesGoal = 150 // weekly, but showing daily equivalent
  const activeMinutesProgress = Math.min((data.activeMinutes / (activeMinutesGoal / 7)) * 100, 100)

  const caloriesGoal = 2000
  const caloriesProgress = Math.min((data.calories / caloriesGoal) * 100, 100)

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getHeartRateStatus = (rate: number) => {
    if (rate < 60) return { status: 'Low', color: 'text-blue-600' }
    if (rate > 100) return { status: 'High', color: 'text-red-600' }
    return { status: 'Normal', color: 'text-green-600' }
  }

  const heartRateStatus = getHeartRateStatus(data.heartRate)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Steps</p>
                <p className="text-2xl font-bold text-gray-900">{data.steps.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Goal: {stepsGoal.toLocaleString()}</p>
              </div>
              <div className="text-2xl">🚶</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(stepsProgress)}`}
                style={{ width: `${stepsProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stepsProgress.toFixed(0)}% of goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Heart Rate</p>
                <p className="text-2xl font-bold text-gray-900">{data.heartRate} bpm</p>
                <p className={`text-xs ${heartRateStatus.color}`}>{heartRateStatus.status}</p>
              </div>
              <div className="text-2xl">❤️</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${Math.min((data.heartRate / 100) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Resting rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Sleep</p>
                <p className="text-2xl font-bold text-gray-900">{data.sleepHours}h</p>
                <p className="text-xs text-gray-500">Goal: {sleepGoal}h</p>
              </div>
              <div className="text-2xl">😴</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(sleepProgress)}`}
                style={{ width: `${sleepProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{sleepProgress.toFixed(0)}% of goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Calories</p>
                <p className="text-2xl font-bold text-gray-900">{data.calories}</p>
                <p className="text-xs text-gray-500">Goal: {caloriesGoal}</p>
              </div>
              <div className="text-2xl">🔥</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(caloriesProgress)}`}
                style={{ width: `${caloriesProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{caloriesProgress.toFixed(0)}% of goal</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Activity Summary</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray={`${stepsProgress}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{stepsProgress.toFixed(0)}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Steps Goal</p>
            </div>

            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray={`${sleepProgress}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{sleepProgress.toFixed(0)}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Sleep Goal</p>
            </div>

            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray={`${activeMinutesProgress}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{activeMinutesProgress.toFixed(0)}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Activity Goal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vitals History */}
      {data.vitals && data.vitals.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recent Vitals</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.vitals.slice(0, 5).map((vital) => (
                <div key={vital.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{vital.metricType}</p>
                    <p className="text-sm text-gray-600">{new Date(vital.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-900">
                      {vital.value} {vital.unit}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {vital.metricType}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}