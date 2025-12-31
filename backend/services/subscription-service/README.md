# Subscription Service

The Subscription Service handles billing, payments, and subscription management for LifeOS using Stripe integration.

## Features

- **Plan Management**: Create and manage subscription plans with different tiers
- **Subscription Lifecycle**: Handle subscription creation, updates, and cancellations
- **Payment Processing**: Process payments through Stripe with webhook support
- **User Management**: Track user subscriptions and payment history
- **Billing Cycles**: Support for monthly and yearly billing intervals

## API Endpoints

### Plans
- `POST /subscriptions/plans` - Create a new plan
- `GET /subscriptions/plans` - Get all active plans
- `GET /subscriptions/plans/:id` - Get plan by ID
- `PUT /subscriptions/plans/:id` - Update plan
- `DELETE /subscriptions/plans/:id` - Delete plan

### Subscriptions
- `POST /subscriptions` - Create subscription
- `GET /subscriptions/my` - Get user's subscription
- `GET /subscriptions` - Get all subscriptions (admin)
- `PUT /subscriptions/:id` - Update subscription
- `DELETE /subscriptions/:id` - Cancel subscription

### Payments
- `POST /subscriptions/payments` - Create payment
- `GET /subscriptions/payments/my` - Get user's payments
- `POST /subscriptions/webhook/stripe` - Handle Stripe webhooks

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=lifeos_subscriptions

# JWT
JWT_SECRET=your-secret-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Environment
NODE_ENV=development
```

## Database Schema

### Plans Table
- `id` (UUID, Primary Key)
- `name` (String, Unique)
- `description` (Text)
- `type` (Enum: free, premium, enterprise)
- `price` (Decimal)
- `billingInterval` (Enum: monthly, yearly)
- `features` (JSONB)
- `isActive` (Boolean)
- `maxUsers` (Integer)
- `maxProjects` (Integer)
- `storageLimitGb` (Integer)
- `stripePriceId` (String)

### Subscriptions Table
- `id` (UUID, Primary Key)
- `userId` (UUID)
- `planId` (UUID, Foreign Key)
- `status` (Enum: active, inactive, cancelled, past_due, unpaid, trialing)
- `currentPeriodStart` (Timestamp)
- `currentPeriodEnd` (Timestamp)
- `trialEnd` (Timestamp)
- `cancelAtPeriodEnd` (Timestamp)
- `stripeSubscriptionId` (String)
- `stripeCustomerId` (String)
- `metadata` (JSONB)

### Payments Table
- `id` (UUID, Primary Key)
- `subscriptionId` (UUID, Foreign Key)
- `userId` (UUID)
- `amount` (Decimal)
- `currency` (String)
- `status` (Enum: pending, succeeded, failed, cancelled, refunded)
- `paymentMethod` (Enum: card, bank_account, paypal)
- `stripePaymentIntentId` (String)
- `stripeChargeId` (String)
- `failureReason` (Text)
- `metadata` (JSONB)
- `paidAt` (Timestamp)

## Development

```bash
# Install dependencies
npm install

# Run migrations
npm run migration:run

# Start development server
npm run start:dev

# Run tests
npm run test
```

## Stripe Integration

The service integrates with Stripe for payment processing:

- **Payment Intents**: Secure payment processing
- **Webhooks**: Real-time event handling for payment status updates
- **Customer Management**: Stripe customer creation and management
- **Subscription Management**: Sync with Stripe subscriptions

## Security

- JWT authentication for all endpoints
- Rate limiting (100 requests/minute)
- Input validation with class-validator
- Helmet for security headers
- CORS configuration
- Stripe webhook signature verification