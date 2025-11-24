# Finance Service

Financial data management and banking integration service for LifeOS, providing secure connection to financial institutions via Plaid.

## Features

- **Plaid Integration**: Secure bank account linking and transaction data
- **Account Management**: Multiple account types and institution support
- **Transaction Processing**: Real-time and historical transaction data
- **Balance Tracking**: Account balances and spending insights
- **Security**: Token-based authentication with encrypted data storage
- **Background Sync**: Automated financial data synchronization

## API Endpoints

### Account Management
```http
GET /finance/accounts
Authorization: Bearer <jwt-token>
# Returns linked financial accounts

GET /finance/accounts/:accountId
Authorization: Bearer <jwt-token>
# Returns specific account details
```

### Transactions
```http
GET /finance/transactions?page=1&limit=50&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <jwt-token>
# Returns paginated transaction history

GET /finance/transactions/:transactionId
Authorization: Bearer <jwt-token>
# Returns transaction details
```

### Plaid Integration
```http
GET /finance/plaid/auth
Authorization: Bearer <jwt-token>
# Returns Plaid Link token for account linking

POST /finance/plaid/webhook
# Handles Plaid webhooks for real-time updates

GET /finance/plaid/institutions
Authorization: Bearer <jwt-token>
# Returns supported financial institutions
```

## Database Schema

### Transaction Entity
```typescript
@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  accountId: string;

  @Column()
  transactionId: string; // Plaid transaction ID

  @Column()
  amount: number;

  @Column()
  currency: string;

  @Column()
  date: Date;

  @Column()
  description: string;

  @Column({ nullable: true })
  merchantName: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'json', nullable: true })
  location: {
    address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };

  @Column({ type: 'json', nullable: true })
  paymentMeta: any;

  @Column({ default: 'pending' })
  status: 'pending' | 'posted' | 'cancelled';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Plaid Integration

### Setup Process
1. Create Plaid account at [Plaid Dashboard](https://dashboard.plaid.com/)
2. Generate API keys for sandbox/development/production
3. Configure webhooks for real-time updates
4. Set environment variables:
   ```env
   PLAID_CLIENT_ID=your-plaid-client-id
   PLAID_SECRET=your-plaid-secret
   PLAID_ENV=sandbox  # sandbox, development, production
   PLAID_WEBHOOK_URL=https://yourdomain.com/finance/plaid/webhook
   ```

### Supported Account Types
- **Checking Accounts**: Everyday banking accounts
- **Savings Accounts**: High-yield and regular savings
- **Credit Cards**: Credit card accounts and transactions
- **Loans**: Personal, student, and auto loans
- **Investment Accounts**: Brokerage and retirement accounts

### Data Synchronization
- **Initial Sync**: Full historical data on account linking
- **Real-time Updates**: Webhook-driven transaction updates
- **Historical Data**: Up to 2 years of transaction history
- **Balance Updates**: Real-time balance synchronization

## Security Considerations

- **Token Storage**: Encrypted storage of access tokens
- **Data Encryption**: Sensitive financial data encryption at rest
- **PCI Compliance**: Secure handling of financial information
- **Audit Logging**: Comprehensive logging of all financial operations
- **Access Controls**: Strict user-based data isolation

## Background Jobs

### Data Synchronization
- **Queue**: `sync`
- **Processor**: `PlaidSyncProcessor`
- **Triggers**: Webhooks, scheduled updates, manual refresh
- **Data Types**: Transactions, balances, account updates

## API Response Examples

### Accounts List
```json
{
  "accounts": [
    {
      "id": "acc_123",
      "name": "Checking Account",
      "type": "checking",
      "subtype": "checking",
      "mask": "1234",
      "balances": {
        "current": 2500.50,
        "available": 2450.50,
        "currency": "USD"
      },
      "institution": {
        "name": "Chase",
        "logo": "https://..."
      }
    }
  ]
}
```

### Transactions List
```json
{
  "transactions": [
    {
      "id": "txn_456",
      "amount": -25.99,
      "currency": "USD",
      "date": "2024-01-15",
      "description": "Grocery Store Purchase",
      "merchantName": "Whole Foods",
      "category": "Food & Dining",
      "location": {
        "city": "San Francisco",
        "region": "CA"
      },
      "status": "posted"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250
  }
}
```

## Error Handling

### Plaid API Errors
- **Invalid Tokens**: Automatic token refresh attempts
- **Institution Errors**: User-friendly error messages
- **Rate Limits**: Exponential backoff and retry logic
- **Service Outages**: Graceful degradation with cached data

## Development

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=lifeos

# JWT
JWT_SECRET=your-jwt-secret

# Plaid API
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox
PLAID_WEBHOOK_URL=http://localhost:3003/finance/plaid/webhook

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
FINANCE_SERVICE_URL=http://localhost:3003

# Environment
NODE_ENV=development
```

## Architecture

```
Finance Service
├── Controllers
│   └── FinanceController
├── Services
│   ├── FinanceService
│   └── PlaidService
├── Entities
│   └── Transaction
├── Processors
│   └── PlaidSyncProcessor
└── DTOs
    ├── PlaidLinkDto
    └── TransactionQueryDto
```