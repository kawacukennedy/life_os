import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { OfflineSyncManager } from '../lib/offlineSync';

const httpLink = createHttpLink({
  uri: __DEV__ ? 'http://localhost:3001/graphql' : 'https://api.lifeos.app/graphql',
  fetchOptions: {
    timeout: 30000,
  },
});

const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from AsyncStorage
  const token = await AsyncStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-client-version': '1.0.0',
      'x-platform': 'mobile',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }

  // Handle authentication errors
  if (graphQLErrors?.some(error => error.message.includes('Unauthorized'))) {
    // Clear invalid token
    AsyncStorage.removeItem('token');
    AsyncStorage.removeItem('userId');
    // Navigation will handle redirect
  }
});

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 30000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      return !!error && !error.graphQLErrors?.length;
    },
  },
});

const client = new ApolloClient({
  link: from([errorLink, retryLink, authLink.concat(httpLink)]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getTasks: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          getHealthSummary: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

interface OfflineSyncContextType {
  syncManager: OfflineSyncManager | null;
  syncStatus: {
    isOnline: boolean;
    queueSize: number;
    cacheSize: number;
    failedItems: number;
  } | null;
  forceSync: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  syncManager: null,
  syncStatus: null,
  forceSync: async () => {},
});

export const useOfflineSync = () => useContext(OfflineSyncContext);

export const GraphQLProvider = () => client;

interface GraphQLProviderProps {
  children: React.ReactNode;
}

export const GraphQLProviderComponent: React.FC<GraphQLProviderProps> = ({ children }) => {
  const [syncManager, setSyncManager] = useState<OfflineSyncManager | null>(null);
  const [syncStatus, setSyncStatus] = useState<OfflineSyncContextType['syncStatus']>(null);

  useEffect(() => {
    const manager = new OfflineSyncManager(client);
    setSyncManager(manager);

    // Update sync status periodically
    const updateStatus = async () => {
      const status = await manager.getSyncStatus();
      setSyncStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const forceSync = async () => {
    if (syncManager) {
      await syncManager.forceSync();
      const status = await syncManager.getSyncStatus();
      setSyncStatus(status);
    }
  };

  return (
    <OfflineSyncContext.Provider value={{ syncManager, syncStatus, forceSync }}>
      {children}
    </OfflineSyncContext.Provider>
  );
};