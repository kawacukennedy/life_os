import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql',
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
    })
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
  }

  // Handle authentication errors
  if (graphQLErrors?.some(error => error.message.includes('Unauthorized'))) {
    // Redirect to login or refresh token
    localStorage.removeItem('token')
    window.location.href = '/auth/login'
  }
})

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      // Retry on network errors, but not on GraphQL errors
      return !!error.networkError
    },
  },
})

export const apolloClient = new ApolloClient({
  link: from([errorLink, retryLink, authLink.concat(httpLink)]),
  cache: new InMemoryCache(),
})

// Example GraphQL queries for future use
export const DASHBOARD_QUERY = `
  query GetDashboard($userId: ID!) {
    dashboard(userId: $userId) {
      health {
        averageHeartRate
        totalSteps
        averageSleepHours
      }
      finance {
        totalBalance
        monthlyIncome
        monthlyExpenses
      }
      learning {
        averageProgress
        coursesCompleted
      }
      notifications {
        unreadCount
      }
      suggestions
    }
  }
`

export const HEALTH_ANALYTICS_QUERY = `
  query GetHealthAnalytics($userId: ID!, $timeRange: String!) {
    healthAnalytics(userId: $userId, timeRange: $timeRange) {
      trends {
        date
        heartRate
        steps
        sleep
      }
      insights {
        type
        title
        description
        impact
      }
    }
  }
`