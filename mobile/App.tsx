import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ApolloProvider} from '@apollo/client';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AuthProvider} from './src/contexts/AuthContext';
import {ToastProvider} from './src/contexts/ToastContext';
import {ThemeProvider} from './src/contexts/ThemeContext';
import {GraphQLProvider} from './src/components/GraphQLProvider';
import {ReactQueryProvider} from './src/components/ReactQueryProvider';

import RootNavigator from './src/navigation/RootNavigator';

const queryClient = new QueryClient();

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ApolloProvider client={GraphQLProvider()}>
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <NavigationContainer>
                  <RootNavigator />
                </NavigationContainer>
              </ToastProvider>
            </QueryClientProvider>
          </ApolloProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;