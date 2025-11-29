# AI Inference Service

This service handles AI-powered suggestions and conversational interactions for LifeOS.

## Features

- AI-powered suggestions for productivity, health, and daily optimization
- Conversational AI assistant
- OpenAI GPT integration with fallback mechanisms
- RESTful API endpoints

## API Endpoints

- `POST /api/ai/suggest` - Get AI suggestions
- `POST /api/ai/chat` - Chat with AI assistant

## Environment Variables

- `OPENAI_API_KEY` - OpenAI API key
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USERNAME` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - PostgreSQL database name

## Development

```bash
npm install
npm run start:dev
```