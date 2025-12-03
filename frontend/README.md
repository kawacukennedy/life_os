# LifeOS Frontend

The frontend application for LifeOS, built with Next.js 13, React 18, TypeScript, and Tailwind CSS.

## Features

- **Dashboard**: Unified view of all your life metrics and activities
- **AI Assistant**: Conversational AI for productivity and life optimization
- **Task Management**: Complete task tracking and productivity tools
- **Health Dashboard**: Comprehensive health metrics and insights
- **Finance Overview**: Budget tracking and financial insights
- **Learning Hub**: Course progress and personalized recommendations
- **Social Features**: Connect with others sharing similar goals
- **Plugin Marketplace**: Extend functionality with third-party integrations
- **Privacy Controls**: GDPR-compliant data management

## Tech Stack

- **Framework**: Next.js 13 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query + Apollo Client
- **UI Components**: Custom component library
- **GraphQL**: Apollo Client for API communication

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

### Backend Requirements

The frontend requires the LifeOS backend services to be running:

- API Gateway (GraphQL): http://localhost:3001/graphql
- All microservices should be running via Docker Compose

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── ai/                # AI assistant page
│   ├── finance/           # Finance dashboard
│   ├── health/            # Health dashboard
│   ├── learn/             # Learning hub
│   ├── marketplace/       # Plugin marketplace
│   ├── settings/          # Settings and privacy
│   ├── social/            # Social features
│   ├── tasks/             # Task management
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # UI component library
│   └── Navigation.tsx    # Main navigation
├── contexts/             # React contexts
├── lib/                  # Utilities and hooks
└── types/                # TypeScript types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Key Components

### Navigation
Responsive navigation bar with all main sections.

### Dashboard
Central hub showing:
- Key metrics (steps, balance, streak, tasks)
- Today's tasks
- Quick actions
- AI insights
- Connected services status

### AI Assistant
Conversational interface for:
- Schedule optimization
- Goal tracking
- Smart suggestions
- LifeOS data queries

### Task Management
Complete task system with:
- CRUD operations
- Priority levels
- Due dates
- Status tracking
- Filtering and search

## GraphQL Integration

The frontend uses Apollo Client to communicate with the GraphQL API. Key queries include:

- `getDashboardData` - Unified dashboard data
- `getUserTasks` - Task management
- `getHealthSummary` - Health metrics
- `getFinanceOverview` - Financial data
- `getLearningProgress` - Learning analytics
- `sendMessage` - AI assistant communication

## Styling

Built with Tailwind CSS using a custom design system:

- Color palette: Blue primary, gray neutrals
- Typography: Inter font family
- Spacing: Consistent 4px grid system
- Components: Reusable UI primitives

## Development Guidelines

### Component Structure
- Use TypeScript for all components
- Follow atomic design principles
- Export components with named exports
- Use custom hooks for complex logic

### State Management
- React Query for server state
- Apollo Client for GraphQL state
- Local component state for UI concerns
- Context for global app state

### GraphQL
- Colocate queries with components
- Use fragments for reusable fields
- Handle loading and error states
- Implement optimistic updates where appropriate

## Deployment

The frontend is containerized and deployed alongside the backend services. See the main README for full deployment instructions.