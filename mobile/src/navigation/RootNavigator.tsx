import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Linking} from 'react-native';
import {useAuth} from '../contexts/AuthContext';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['lifeos://', 'https://lifeos.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Signup: 'signup',
          Onboarding: 'onboarding',
        },
      },
      App: {
        screens: {
          Dashboard: 'dashboard',
          AI: 'ai',
          Health: 'health',
          Finance: 'finance',
          Learn: 'learn',
          Tasks: {
            path: 'tasks/:taskId?',
            parse: {
              taskId: (taskId: string) => taskId,
            },
          },
          Social: 'social',
          Settings: 'settings',
        },
      },
    },
  },
};

const RootNavigator = () => {
  const {isAuthenticated, isLoading} = useAuth();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      linking={linking}
    >
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;