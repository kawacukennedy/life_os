import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'

const httpLink = createHttpLink({
  uri: process.env.NODE_ENV === 'production'
    ? 'https://api.yourdomain.com/graphql'
    : 'http://localhost:3001/graphql',
  fetchOptions: {
    timeout: 30000, // 30 second timeout
  },
})

const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-client-version': '1.0.0',
    }
  }
})

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    })
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
  }

  // Handle authentication errors
  if (graphQLErrors?.some(error => error.message.includes('Unauthorized'))) {
    // Clear invalid token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      // Redirect to login if needed
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login'
      }
    }
  }
})

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 30000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      // Retry on network errors, but not on GraphQL errors
      return !!error && !error.graphQLErrors?.length
    },
  },
})

const client = new ApolloClient({
  link: from([errorLink, retryLink, authLink.concat(httpLink)]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Add cache policies for better performance
          getTasks: {
            merge(existing, incoming) {
              return incoming
            },
          },
          getHealthSummary: {
            merge(existing, incoming) {
              return incoming
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
})

export default client