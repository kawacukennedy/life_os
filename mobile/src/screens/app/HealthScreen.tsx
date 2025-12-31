import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import AppleHealthKit, { HealthKitPermissions } from 'react-native-health';

interface HealthMetric {
  id: string;
  type: string;
  value: number;
  unit: string;
  date: string;
}

const HealthScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [isHealthKitAvailable, setIsHealthKitAvailable] = useState(false);

  const { data: healthData, isLoading } = useQuery({
    queryKey: ['health', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/health/summary?period=${selectedPeriod}`);
      return response.json();
    },
  });

  const syncAppleHealthMutation = useMutation({
    mutationFn: async (healthData: any[]) => {
      const response = await fetch('/api/health/apple-health/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user123', healthData }),
      });
      return response.json();
    },
    onSuccess: () => {
      Alert.alert('Success', 'Health data synced successfully!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to sync health data');
    },
  });

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleHealthKit.isAvailable((err: any, available: boolean) => {
        if (available) {
          setIsHealthKitAvailable(true);
        }
      });
    }
  }, []);

  const syncAppleHealth = async () => {
    if (!isHealthKitAvailable) {
      Alert.alert('Not Available', 'Apple Health is not available on this device');
      return;
    }

    const permissions: HealthKitPermissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.BodyMass,
        ],
        write: [],
      },
    };

    AppleHealthKit.initHealthKit(permissions, (err: any) => {
      if (err) {
        console.error('Error initializing HealthKit:', err);
        Alert.alert('Error', 'Failed to initialize Apple Health');
        return;
      }

      // Get today's data
      const options = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      };

      // Get steps
      AppleHealthKit.getStepCount(options, (err: any, results: any) => {
        if (!err && results) {
          const healthData = results.map((result: any) => ({
            userId: 'user123',
            dataType: 'HKQuantityTypeIdentifierStepCount',
            value: result.value,
            unit: 'count',
            startDate: new Date(result.startDate),
            endDate: new Date(result.endDate),
            source: 'apple_health',
          }));
          syncAppleHealthMutation.mutate(healthData);
        }
      });

      // Get heart rate
      AppleHealthKit.getHeartRateSamples(options, (err: any, results: any) => {
        if (!err && results) {
          const healthData = results.map((result: any) => ({
            userId: 'user123',
            dataType: 'HKQuantityTypeIdentifierHeartRate',
            value: result.value,
            unit: 'count/min',
            startDate: new Date(result.startDate),
            endDate: new Date(result.endDate),
            source: 'apple_health',
          }));
          syncAppleHealthMutation.mutate(healthData);
        }
      });

      // Get sleep
      AppleHealthKit.getSleepSamples(options, (err: any, results: any) => {
        if (!err && results) {
          const healthData = results.map((result: any) => ({
            userId: 'user123',
            dataType: 'HKCategoryTypeIdentifierSleepAnalysis',
            value: (new Date(result.endDate).getTime() - new Date(result.startDate).getTime()) / (1000 * 60 * 60), // hours
            unit: 'hours',
            startDate: new Date(result.startDate),
            endDate: new Date(result.endDate),
            source: 'apple_health',
          }));
          syncAppleHealthMutation.mutate(healthData);
        }
      });
    });
  };

  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Dashboard</Text>
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
          <Text>Loading health data...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {healthData?.steps || 0}
              </Text>
              <Text style={styles.metricLabel}>Steps</Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {healthData?.heartRate || 0}
              </Text>
              <Text style={styles.metricLabel}>Heart Rate</Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {healthData?.sleepHours || 0}h
              </Text>
              <Text style={styles.metricLabel}>Sleep</Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {healthData?.calories || 0}
              </Text>
              <Text style={styles.metricLabel}>Calories</Text>
            </Card>
          </View>

          {/* Recent Vitals */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Vitals</Text>
            {healthData?.vitals?.slice(0, 5).map((vital: HealthMetric) => (
              <View key={vital.id} style={styles.vitalItem}>
                <Text style={styles.vitalType}>{vital.type}</Text>
                <Text style={styles.vitalValue}>
                  {vital.value} {vital.unit}
                </Text>
                <Text style={styles.vitalDate}>
                  {new Date(vital.date).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </Card>

          {/* Quick Actions */}
          <View style={styles.actions}>
            <Button
              title="Log Weight"
              onPress={() => {/* Navigate to weight logging */}}
              style={styles.actionButton}
            />
            {Platform.OS === 'ios' && isHealthKitAvailable && (
              <Button
                title="Sync Apple Health"
                onPress={syncAppleHealth}
                style={styles.actionButton}
                disabled={syncAppleHealthMutation.isLoading}
              />
            )}
            <Button
              title="Connect Wearable"
              onPress={() => {/* Navigate to integrations */}}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#275af4',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  sectionCard: {
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f1724',
    marginBottom: 16,
  },
  vitalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  vitalType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f1724',
  },
  vitalValue: {
    fontSize: 16,
    color: '#275af4',
    fontWeight: '600',
  },
  vitalDate: {
    fontSize: 12,
    color: '#64748b',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default HealthScreen;