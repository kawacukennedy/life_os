import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

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

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
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