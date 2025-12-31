import React from 'react'
import { Card, CardContent, CardHeader } from './Card'
import { Badge } from './Badge'

interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
  type: 'income' | 'expense'
}

interface AccountBalance {
  accountName: string
  balance: number
  type: 'checking' | 'savings' | 'credit'
}

interface FinanceOverviewProps {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  accountBalances?: AccountBalance[]
  recentTransactions: Transaction[]
  className?: string
}

export const FinanceOverview: React.FC<FinanceOverviewProps> = ({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  savingsRate,
  accountBalances = [],
  recentTransactions,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Account Balances */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Account Balances</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accountBalances.length > 0 ? (
              accountBalances.map((account, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">{account.accountName}</p>
                    <p className="text-sm text-gray-600 capitalize">{account.type}</p>
                  </div>
                  <span className={`font-medium ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${account.balance.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No accounts connected yet</p>
                <p className="text-sm text-gray-400 mt-1">Connect your bank accounts to see balances</p>
              </div>
            )}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">Total Balance</p>
                <span className={`text-xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Monthly Summary</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Income</p>
              <p className="text-2xl font-bold text-green-600">
                ${monthlyIncome.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ${monthlyExpenses.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Savings Rate</p>
              <p className={`text-2xl font-bold ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                {savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{transaction.category}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </span>
                    <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'} className="ml-2 capitalize">
                      {transaction.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">Connect accounts to see your transactions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}