import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const Tab = createBottomTabNavigator();

function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning!</Text>
        <Text style={styles.subtitle}>Ready to optimize your day?</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Tasks Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>85%</Text>
          <Text style={styles.statLabel}>Productivity</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>7.5h</Text>
          <Text style={styles.statLabel}>Sleep Last Night</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Focus</Text>
        <View style={styles.taskCard}>
          <View style={styles.taskIndicator} />
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle}>Review project proposal</Text>
            <Text style={styles.taskTime}>9:00 AM - 10:30 AM</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function TasksScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Tasks</Text>
      <Text style={styles.subtitle}>Manage your tasks here</Text>
    </View>
  );
}

function AIScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>AI Assistant</Text>
      <Text style={styles.subtitle}>Ask me anything</Text>
    </View>
  );
}

function HealthScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Health</Text>
      <Text style={styles.subtitle}>Track your wellness</Text>
    </View>
  );
}

function FinanceScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Finance</Text>
      <Text style={styles.subtitle}>Manage your money</Text>
    </View>
  );
}

function LearnScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Learn</Text>
      <Text style={styles.subtitle}>Expand your knowledge</Text>
    </View>
  );
}

function SocialScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Social</Text>
      <Text style={styles.subtitle}>Connect with others</Text>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Customize your experience</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#275AF4',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        }}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="AI" component={AIScreen} />
        <Tab.Screen name="Health" component={HealthScreen} />
        <Tab.Screen name="Finance" component={FinanceScreen} />
        <Tab.Screen name="Learn" component={LearnScreen} />
        <Tab.Screen name="Tasks" component={TasksScreen} />
        <Tab.Screen name="Social" component={SocialScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
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
    shadowOffset: { width: 0, height: 1 },
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
  taskCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
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
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 14,
    color: '#6b7280',
  },
});