'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FinanceAPI, Transaction, FinanceSummary, PlaidAccount } from '@/lib/api/finance'

export default function FinanceDashboard() {
  const [timeRange, setTimeRange] = useState('30d')
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [plaidAccounts, setPlaidAccounts] = useState<PlaidAccount[]>([])
  const [plaidConnected, setPlaidConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFinanceData()
  }, [])

  const loadFinanceData = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem('userId') || 'user123'

      const [summary, transactionsData] = await Promise.all([
        FinanceAPI.getFinanceSummary(userId),
        FinanceAPI.getTransactions(userId, 50),
      ])

      setFinanceSummary(summary)
      setTransactions(transactionsData)

      // Try to load Plaid accounts
      try {
        const accounts = await FinanceAPI.getAccounts()
        setPlaidAccounts(accounts)
        setPlaidConnected(true)
      } catch (plaidErr) {
        setPlaidConnected(false)
        console.log('Plaid not connected:', plaidErr)
      }
    } catch (err) {
      setError('Failed to load finance data')
      console.error('Error loading finance data:', err)
    } finally {
      setLoading(false)
    }
  }

  const spendingData = FinanceAPI.getSpendingByCategory(transactions)
  const recentTransactions = FinanceAPI.getRecentTransactions(transactions, timeRange === '7d' ? 7 : 30)

  const handleConnectPlaid = async () => {
    try {
      const linkToken = await FinanceAPI.getPlaidLinkToken()
      // In a real implementation, you'd initialize Plaid Link SDK here
      // For now, we'll just redirect to the auth endpoint
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/finance/plaid/auth`
    } catch (err) {
      console.error('Failed to get Plaid link token:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-start mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading finance data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadFinanceData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
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
          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-accent-green rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">$</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Balance
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${financeSummary?.totalBalance.toLocaleString() || '0'}
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
                      <span className="text-white font-bold">↑</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Monthly Income
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${financeSummary?.monthlyIncome.toLocaleString() || '0'}
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
                      <span className="text-white font-bold">↓</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Monthly Expenses
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${financeSummary?.monthlyExpenses.toLocaleString() || '0'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
           </div>

           {/* Plaid Integration */}
           <div className="bg-white shadow rounded-lg p-6 mb-8">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Banking Integration</h3>
               {!plaidConnected && (
                 <Button onClick={handleConnectPlaid}>
                   Connect Bank Account
                 </Button>
               )}
             </div>

             {plaidConnected && plaidAccounts.length > 0 ? (
               <div className="space-y-4">
                 <h4 className="text-md font-medium text-gray-700">Connected Accounts</h4>
                 {plaidAccounts.map((account) => (
                   <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                     <div>
                       <p className="font-medium text-gray-900">{account.name}</p>
                       <p className="text-sm text-gray-500 capitalize">{account.type} • {account.subtype}</p>
                     </div>
                     <div className="text-right">
                       <p className="font-medium text-gray-900">${account.balance.toLocaleString()}</p>
                       <p className="text-sm text-gray-500">{account.currency}</p>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-8">
                 <p className="text-gray-500 mb-4">Connect your bank accounts to automatically sync transactions</p>
                 <Button onClick={handleConnectPlaid}>
                   Connect with Plaid
                 </Button>
               </div>
             )}
           </div>

           {/* Spending Trends Chart */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.description || 'Transaction'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.transactionDate).toLocaleDateString()} • {transaction.category}
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            {recentTransactions.length === 0 && (
              <p className="text-gray-500 text-center py-4">No transactions found for the selected period.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}