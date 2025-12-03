import React from 'react';
import {ApolloClient, InMemoryCache, createHttpLink} from '@apollo/client';
import {setContext} from '@apollo/client/link/context';
import {useAuth} from 'lifeos-shared';

const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql', // Update with your GraphQL endpoint
});

const authLink = setContext((_, {headers}) => {
  // Get the authentication token from local storage if it exists
  const token = localStorage.getItem('token');
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export const GraphQLProvider = () => client;

interface GraphQLProviderProps {
  children: React.ReactNode;
}

export const GraphQLProviderComponent: React.FC<GraphQLProviderProps> = ({children}) => {
  return <>{children}</>;
};