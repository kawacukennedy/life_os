import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import DashboardScreen from '../screens/app/DashboardScreen';
import TasksScreen from '../screens/app/TasksScreen';
import SocialScreen from '../screens/app/SocialScreen';
import SettingsScreen from '../screens/app/SettingsScreen';
import HealthScreen from '../screens/app/HealthScreen';
import FinanceScreen from '../screens/app/FinanceScreen';
import LearnScreen from '../screens/app/LearnScreen';

export type AppTabParamList = {
  Dashboard: undefined;
  Health: undefined;
  Finance: undefined;
  Learn: undefined;
  Tasks: undefined;
  Social: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Health') {
            iconName = 'favorite';
          } else if (route.name === 'Finance') {
            iconName = 'account-balance';
          } else if (route.name === 'Learn') {
            iconName = 'school';
          } else if (route.name === 'Tasks') {
            iconName = 'check-circle';
          } else if (route.name === 'Social') {
            iconName = 'people';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#275AF4',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Health" component={HealthScreen} />
      <Tab.Screen name="Finance" component={FinanceScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Social" component={SocialScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default AppNavigator;