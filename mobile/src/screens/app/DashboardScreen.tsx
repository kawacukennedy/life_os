import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {format} from 'date-fns';

import {AppTabParamList} from '../../navigation/AppNavigator';
import {
  useDashboardData,
  useTasksToday,
  useHealthSummary,
  useAISuggestions,
  useFinanceSummary,
  useProductivityScore,
} from '../../hooks/useDashboard';

type Props = BottomTabScreenProps<AppTabParamList, 'Dashboard'>;

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const DashboardScreen: React.FC<Props> = ({navigation}) => {
  const {isLoading, error} = useDashboardData();
  const {tasks} = useTasksToday();
  const {health} = useHealthSummary();
  const {suggestions} = useAISuggestions();
  const {finance} = useFinanceSummary();
  const {score: productivityScore} = useProductivityScore();

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  if (error) {
    Alert.alert('Error', 'Failed to load dashboard data');
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}!</Text>
        <Text style={styles.subtitle}>
          {pendingTasks.length > 0
            ? `You have ${pendingTasks.length} tasks to complete today`
            : 'All caught up! Ready to optimize your day?'}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : (
            <>
              <Text style={styles.statNumber}>{pendingTasks.length}</Text>
              <Text style={styles.statLabel}>Tasks Today</Text>
            </>
          )}
        </View>
        <View style={styles.statCard}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : (
            <>
              <Text style={styles.statNumber}>{productivityScore}%</Text>
              <Text style={styles.statLabel}>Productivity</Text>
            </>
          )}
        </View>
        <View style={styles.statCard}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : (
            <>
              <Text style={styles.statNumber}>{health?.sleepHours || 0}h</Text>
              <Text style={styles.statLabel}>Sleep Last Night</Text>
            </>
          )}
        </View>
      </View>

      {/* AI Insights Section */}
      {suggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          {suggestions.slice(0, 2).map((suggestion) => (
            <TouchableOpacity key={suggestion.id} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightType}>
                  {suggestion.type.toUpperCase()}
                </Text>
                <Text style={styles.insightConfidence}>
                  {Math.round(suggestion.confidence * 100)}%
                </Text>
              </View>
              <Text style={styles.insightTitle}>{suggestion.title}</Text>
              <Text style={styles.insightDescription}>
                {suggestion.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Today's Focus */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Focus</Text>
        {pendingTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No pending tasks!</Text>
            <Text style={styles.emptyStateSubtext}>
              Great job staying on top of things.
            </Text>
          </View>
        ) : (
          pendingTasks.slice(0, 3).map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => navigation.navigate('Tasks')}>
              <View style={styles.taskIndicator} />
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.dueDate && (
                  <Text style={styles.taskTime}>
                    Due: {format(new Date(task.dueDate), 'h:mm a')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        {completedTasks.length > 0 && (
          <View style={styles.completedSection}>
            <Text style={styles.completedTitle}>
              Completed ({completedTasks.length})
            </Text>
            {completedTasks.slice(0, 2).map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCard}
                onPress={() => navigation.navigate('Tasks')}>
                <View style={[styles.taskIndicator, styles.taskIndicatorCompleted]} />
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, styles.taskTitleCompleted]}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskTime}>Completed</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Health Summary */}
      {health && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Today</Text>
          <View style={styles.healthGrid}>
            <View style={styles.healthCard}>
              <Text style={styles.healthValue}>{health.steps.toLocaleString()}</Text>
              <Text style={styles.healthLabel}>Steps</Text>
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.healthValue}>{health.calories}</Text>
              <Text style={styles.healthLabel}>Calories</Text>
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.healthValue}>{health.heartRate}</Text>
              <Text style={styles.healthLabel}>BPM</Text>
            </View>
          </View>
        </View>
      )}

      {/* Finance Summary */}
      {finance && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finance Overview</Text>
          <View style={styles.financeCard}>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Balance</Text>
              <Text style={styles.financeValue}>${finance.balance.toFixed(2)}</Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Spent Today</Text>
              <Text style={styles.financeValueSpent}>${finance.spendingToday.toFixed(2)}</Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Budget Left</Text>
              <Text style={styles.financeValue}>
                ${finance.budgetRemaining.toFixed(2)}
              </Text>
            </View>
          </View>
          {finance.alerts.length > 0 && (
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => navigation.navigate('Finance')}>
              <Text style={styles.alertText}>⚠️ {finance.alerts[0]}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.quickActionEmoji}>➕</Text>
            <Text style={styles.quickActionText}>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('AI')}>
            <Text style={styles.quickActionEmoji}>🤖</Text>
            <Text style={styles.quickActionText}>Ask AI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Health')}>
            <Text style={styles.quickActionEmoji}>❤️</Text>
            <Text style={styles.quickActionText}>Health</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Finance')}>
            <Text style={styles.quickActionEmoji}>💰</Text>
            <Text style={styles.quickActionText}>Finance</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4f46e5',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 30,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4f46e5',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  insightConfidence: {
    fontSize: 12,
    color: '#6b7280',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  completedSection: {
    marginTop: 16,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  taskCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4f46e5',
    marginRight: 12,
  },
  taskIndicatorCompleted: {
    backgroundColor: '#10b981',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  taskTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  healthGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  healthValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 4,
  },
  healthLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  financeCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  financeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  financeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  financeValueSpent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  alertCard: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  alertText: {
    fontSize: 14,
    color: '#92400e',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});

export default DashboardScreen;