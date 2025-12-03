import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

const FinanceScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const { data: financeData, isLoading } = useQuery({
    queryKey: ['finance', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/finance/summary?period=${selectedPeriod}`);
      return response.json();
    },
  });

  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'Quarter' },
  ];

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionCategory}>{item.category}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          item.type === 'income' ? styles.incomeAmount : styles.expenseAmount
        ]}>
          {item.type === 'income' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Overview</Text>
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <Text>Loading financial data...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>
                ${financeData?.totalBalance || 0}
              </Text>
              <Text style={styles.metricLabel}>Total Balance</Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>
                ${financeData?.monthlyIncome || 0}
              </Text>
              <Text style={styles.metricLabel}>Monthly Income</Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>
                ${financeData?.monthlyExpenses || 0}
              </Text>
              <Text style={styles.metricLabel}>Monthly Expenses</Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>
                ${financeData?.savingsGoal || 0}
              </Text>
              <Text style={styles.metricLabel}>Savings Goal</Text>
            </Card>
          </View>

          {/* Recent Transactions */}
          <Card style={styles.transactionsCard}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <FlatList
              data={financeData?.recentTransactions || []}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.transactionsList}
            />
          </Card>

          {/* Budget Overview */}
          <Card style={styles.budgetCard}>
            <Text style={styles.sectionTitle}>Budget Overview</Text>
            {financeData?.budgets?.map((budget: any) => (
              <View key={budget.category} style={styles.budgetItem}>
                <Text style={styles.budgetCategory}>{budget.category}</Text>
                <View style={styles.budgetProgress}>
                  <View
                    style={[
                      styles.budgetProgressBar,
                      { width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%` },
                      budget.spent > budget.limit && styles.budgetOverLimit,
                    ]}
                  />
                </View>
                <Text style={styles.budgetAmount}>
                  ${budget.spent} / ${budget.limit}
                </Text>
              </View>
            ))}
          </Card>

          {/* Quick Actions */}
          <View style={styles.actions}>
            <Button
              title="Add Transaction"
              onPress={() => {/* Navigate to add transaction */}}
              style={styles.actionButton}
            />
            <Button
              title="Connect Bank"
              onPress={() => {/* Navigate to Plaid integration */}}
              style={styles.actionButton}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f1724',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  periodButtonActive: {
    backgroundColor: '#275af4',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#275af4',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  transactionsCard: {
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f1724',
    marginBottom: 16,
  },
  transactionsList: {
    maxHeight: 300,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f1724',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomeAmount: {
    color: '#10b981',
  },
  expenseAmount: {
    color: '#ef4444',
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  budgetCard: {
    marginBottom: 24,
    padding: 16,
  },
  budgetItem: {
    marginBottom: 16,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f1724',
    marginBottom: 8,
  },
  budgetProgress: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 4,
  },
  budgetProgressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  budgetOverLimit: {
    backgroundColor: '#ef4444',
  },
  budgetAmount: {
    fontSize: 14,
    color: '#64748b',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default FinanceScreen;