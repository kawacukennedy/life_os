'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts'
import { HealthAPI } from '@/lib/api/health'
import { FinanceAPI } from '@/lib/api/finance'
import { LearningAPI } from '@/lib/api/learning'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [analyticsData, setAnalyticsData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem('userId') || 'user123'

      // Load all data in parallel
      const [healthData, financeData, learningData] = await Promise.allSettled([
        HealthAPI.getHealthSummary(userId),
        FinanceAPI.getFinanceSummary(userId),
        LearningAPI.getLearningStats(userId),
      ])

      // Process data for analytics
      const processedData = {
        healthTrends: generateHealthTrends(healthData.status === 'fulfilled' ? healthData.value : null),
        financeTrends: generateFinanceTrends(financeData.status === 'fulfilled' ? financeData.value : null),
        learningTrends: generateLearningTrends(learningData.status === 'fulfilled' ? learningData.value : null),
        correlations: generateCorrelations(
          healthData.status === 'fulfilled' ? healthData.value : null,
          financeData.status === 'fulfilled' ? financeData.value : null,
          learningData.status === 'fulfilled' ? learningData.value : null
        ),
        insights: generateInsights(
          healthData.status === 'fulfilled' ? healthData.value : null,
          financeData.status === 'fulfilled' ? financeData.value : null,
          learningData.status === 'fulfilled' ? learningData.value : null
        )
      }

      setAnalyticsData(processedData)
    } catch (err) {
      console.error('Error loading analytics data:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateHealthTrends = (health: any) => {
    if (!health) return []

    // Mock trend data - in real app, this would come from historical data
    return [
      { date: '2024-11-01', heartRate: 72, steps: 8500, sleep: 7.5 },
      { date: '2024-11-08', heartRate: 70, steps: 9200, sleep: 8.0 },
      { date: '2024-11-15', heartRate: 68, steps: 10100, sleep: 7.8 },
      { date: '2024-11-22', heartRate: 71, steps: 8800, sleep: 7.2 },
    ]
  }

  const generateFinanceTrends = (finance: any) => {
    if (!finance) return []

    return [
      { date: '2024-11-01', income: 3200, expenses: 2100, savings: 1100 },
      { date: '2024-11-08', income: 3200, expenses: 1950, savings: 1250 },
      { date: '2024-11-15', income: 3200, expenses: 2300, savings: 900 },
      { date: '2024-11-22', income: 3200, expenses: 1800, savings: 1400 },
    ]
  }

  const generateLearningTrends = (learning: any) => {
    if (!learning) return []

    return [
      { date: '2024-11-01', progress: 15, timeSpent: 45 },
      { date: '2024-11-08', progress: 32, timeSpent: 120 },
      { date: '2024-11-15', progress: 48, timeSpent: 95 },
      { date: '2024-11-22', progress: 67, timeSpent: 150 },
    ]
  }

  const generateCorrelations = (health: any, finance: any, learning: any) => {
    // Mock correlation data
    return [
      { x: 8500, y: 7.5, name: 'Steps vs Sleep' },
      { x: 9200, y: 8.0, name: 'Steps vs Sleep' },
      { x: 10100, y: 7.8, name: 'Steps vs Sleep' },
      { x: 8800, y: 7.2, name: 'Steps vs Sleep' },
    ]
  }

  const generateInsights = (health: any, finance: any, learning: any) => {
    const insights = []

    if (health) {
      if (health.totalSteps > 10000) {
        insights.push({
          type: 'positive',
          title: 'Excellent Activity Level',
          description: 'Your step count is consistently above 10,000 steps daily.',
          impact: 'High'
        })
      }
    }

    if (finance) {
      const savingsRate = ((finance.monthlyIncome - finance.monthlyExpenses) / finance.monthlyIncome) * 100
      if (savingsRate > 20) {
        insights.push({
          type: 'positive',
          title: 'Strong Savings Rate',
          description: `You're saving ${savingsRate.toFixed(1)}% of your income.`,
          impact: 'High'
        })
      }
    }

    if (learning) {
      if (learning.averageProgress > 50) {
        insights.push({
          type: 'positive',
          title: 'Learning Momentum',
          description: 'Your learning progress is accelerating.',
          impact: 'Medium'
        })
      }
    }

    return insights
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-start mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing your data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
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
              <Button
                variant={timeRange === '90d' ? 'default' : 'outline'}
                onClick={() => setTimeRange('90d')}
              >
                90 Days
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Key Insights */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.insights?.map((insight: any, index: number) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  insight.type === 'positive' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{insight.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      insight.impact === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {insight.impact} Impact
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Health Trends */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Health Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.healthTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="heartRate" stroke="#ef4444" name="Heart Rate" />
                  <Line type="monotone" dataKey="steps" stroke="#3b82f6" name="Steps (x100)" />
                  <Line type="monotone" dataKey="sleep" stroke="#10b981" name="Sleep Hours" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Finance Trends */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.financeTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  <Bar dataKey="savings" fill="#3b82f6" name="Savings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Learning Progress */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Learning Progress</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.learningTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="progress" stroke="#8b5cf6" name="Progress %" />
                  <Line type="monotone" dataKey="timeSpent" stroke="#f59e0b" name="Time Spent (min)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Correlations */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data Correlations</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={analyticsData.correlations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" name="Steps" />
                  <YAxis dataKey="y" name="Sleep Hours" />
                  <Tooltip />
                  <Scatter dataKey="y" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Correlation between daily steps and sleep quality
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}