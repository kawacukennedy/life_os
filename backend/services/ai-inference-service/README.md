# AI Inference Service

The AI Inference Service provides intelligent AI capabilities for LifeOS, including vector embeddings, LLM inference, and personalized recommendations.

## Features

- **Vector Embeddings**: Store and search user data using vector similarity
- **LLM Integration**: OpenAI GPT models for natural language processing
- **Personalized Suggestions**: AI-powered recommendations for tasks, health, and productivity
- **Context-Aware Responses**: Maintain conversation history and user context
- **Schedule Analysis**: Detect conflicts and optimization opportunities
- **Health Insights**: Generate personalized health recommendations

## Architecture

### Components

- **Vector DB Service**: Milvus integration for vector storage and similarity search
- **LLM Service**: OpenAI API integration for text generation and embeddings
- **AI Service**: Orchestrates AI capabilities for personalized recommendations

### Data Flow

1. User data is converted to embeddings and stored in vector DB
2. AI requests trigger similarity search for relevant context
3. LLM generates responses using retrieved context
4. New interactions are stored for continuous learning

## API Endpoints

### AI Suggestions

- `POST /ai/suggest` - Generate personalized AI suggestions
- `POST /ai/query` - Process natural language queries
- `POST /ai/analyze-schedule` - Analyze schedule for conflicts
- `POST /ai/health-insights` - Generate health insights

### Embeddings

- `GET /ai/embeddings/search` - Search user embeddings

## Configuration

### Environment Variables

- `OPENAI_API_KEY` - OpenAI API key for LLM services
- `MILVUS_HOST` - Milvus server address (default: localhost:19530)
- `MILVUS_USERNAME` - Milvus username
- `MILVUS_PASSWORD` - Milvus password
- `JWT_SECRET` - JWT signing secret

### Vector DB Setup

The service automatically creates a Milvus collection with the following schema:

- `id`: Primary key (string)
- `vector`: 768-dimensional float vector
- `user_id`: User identifier
- `content`: Original text content
- `type`: Content type (context, interaction, etc.)
- `timestamp`: Creation timestamp
- `tags`: JSON array of tags

## Usage Examples

### Generate Suggestions

```typescript
const response = await fetch('/ai/suggest', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    context: {
      userId: 'user123',
      recentActivities: ['completed workout', 'finished report'],
      currentTasks: ['review budget', 'call client'],
      healthData: 'steps: 8500, sleep: 7.5h',
    },
    limit: 5,
  }),
});
```

### Process Query

```typescript
const response = await fetch('/ai/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'How can I improve my morning routine?',
    context: {
      // optional additional context
    },
  }),
});
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm test

# Generate embeddings for test data
npm run embeddings:seed
```

## Dependencies

- **@zilliz/milvus2-sdk-node**: Vector database client
- **openai**: OpenAI API client
- **@xenova/transformers**: Local embedding models (optional fallback)
- **NestJS**: Framework for API endpoints

## Performance Considerations

- Embeddings are cached to reduce API calls
- Vector searches are optimized with appropriate indexes
- Rate limiting prevents API abuse
- Background job queues handle heavy computations

## Security

- All endpoints require JWT authentication
- User data isolation in vector searches
- Rate limiting on AI requests
- Input validation and sanitization