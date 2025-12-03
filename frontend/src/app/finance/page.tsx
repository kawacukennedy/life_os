'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import { useAnalytics } from '@/lib/analytics'
import gql from 'graphql-tag'
import { print } from 'graphql'
import { useQuery as useApolloQuery } from '@apollo/client'

export const dynamic = 'force-dynamic'

const GET_FINANCE_DATA = gql`
  query GetFinanceData($userId: String!) {
    getFinanceSummary(userId: $userId) {
      userId
      totalBalance
      monthlyIncome
      monthlyExpenses
      savingsRate
      topCategories {
        category
        amount
        percentage
      }
      recentTransactions {
        id
        description
        amount
        category
        date
        type
      }
      budgetAlerts {
        id
        category
        budgetAmount
        spentAmount
        percentage
        message
      }
    }
  }
`

const GET_FINANCE_INSIGHTS = gql`
  query GetFinanceInsights($userId: String!) {
    getFinanceInsights(userId: $userId) {
      insights {
        id
        type
        title
        description
        actionable
        createdAt
      }
    }
  }
`

interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
  type: 'income' | 'expense'
}

interface BudgetAlert {
  id: string
  category: string
  budgetAmount: number
  spentAmount: number
  percentage: number
  message: string
}

interface FinanceData {
  userId: string
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  topCategories: Array<{
    category: string
    amount: number
    percentage: number
  }>
  recentTransactions: Transaction[]
  budgetAlerts: BudgetAlert[]
}

export default function FinancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const { addToast } = useToast()
  const { trackEvent } = useAnalytics()

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user123' : 'user123'

  const { data: financeData, loading, error, refetch } = useApolloQuery(GET_FINANCE_DATA, {
    variables: { userId },
    onCompleted: (data) => {
      trackEvent('finance_data_loaded', { period: selectedPeriod })
    },
    onError: (error) => {
      console.error('Finance data error:', error)
      addToast({
        title: 'Finance Data Error',
        description: 'Unable to load finance data. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const { data: insightsData } = useApolloQuery(GET_FINANCE_INSIGHTS, {
    variables: { userId },
  })

  useEffect(() => {
    refetch()
  }, [selectedPeriod])

  const handleConnectPlaid = () => {
    trackEvent('plaid_connect_attempted')
    addToast({
      title: 'Connecting to Bank',
      description: 'Redirecting to secure bank connection...',
    })
  }

  const getAlertSeverity = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-100 text-red-800'
    if (percentage >= 80) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load finance data</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const data = financeData?.getFinanceSummary

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
            <p className="mt-2 text-gray-600">Track your finances and get personalized insights</p>
          </div>

          {/* Period Selector */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {(['month', 'quarter', 'year'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod(period)}
                  className="capitalize"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>

          {/* Finance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${data?.totalBalance?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${data?.monthlyIncome?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-2xl">📈</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${data?.monthlyExpenses?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-2xl">📉</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Savings Rate</p>
                  <p className={`text-2xl font-bold ${data?.savingsRate >= 20 ? 'text-green-600' : data?.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {data?.savingsRate?.toFixed(1) || 0}%
                  </p>
                </div>
                <div className="text-2xl">💸</div>
              </div>
            </Card>
          </div>

          {/* Integration Section */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Connect Financial Accounts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleConnectPlaid}
                className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <span>🏦</span>
                <span>Connect Bank Account</span>
              </Button>
              <Button
                onClick={() => addToast({ title: 'Coming Soon', description: 'Investment tracking coming soon!' })}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                <span>📊</span>
                <span>Connect Investments</span>
              </Button>
            </div>
          </Card>

          {/* Budget Alerts */}
          {data?.budgetAlerts && data.budgetAlerts.length > 0 && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Budget Alerts</h2>
              <div className="space-y-3">
                {data.budgetAlerts.map((alert: BudgetAlert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-yellow-800">{alert.message}</p>
                      <p className="text-sm text-yellow-600">{alert.category}: ${alert.spentAmount} / ${alert.budgetAmount}</p>
                    </div>
                    <Badge className={getAlertSeverity(alert.percentage)}>
                      {alert.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Spending Categories */}
          {data?.topCategories && data.topCategories.length > 0 && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Top Spending Categories</h2>
              <div className="space-y-4">
                {data.topCategories.map((category: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{category.category}</span>
                        <span>${category.amount.toLocaleString()} ({category.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Transactions */}
          {data?.recentTransactions && data.recentTransactions.length > 0 && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
              <div className="space-y-3">
                {data.recentTransactions.slice(0, 10).map((transaction: Transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-600">{transaction.category} • {new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Insights */}
          {insightsData?.getFinanceInsights?.insights && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">AI Financial Insights</h2>
              <div className="space-y-4">
                {insightsData.getFinanceInsights.insights.map((insight: any) => (
                  <div key={insight.id} className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900">{insight.title}</h3>
                    <p className="text-blue-700 mt-1">{insight.description}</p>
                    {insight.actionable && (
                      <Button size="sm" className="mt-2">
                        Take Action
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}