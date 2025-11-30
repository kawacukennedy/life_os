# Subscription Service

Handles subscription management, billing, and payment processing for LifeOS.

## Features

- Stripe integration for payment processing
- Subscription lifecycle management
- Invoice generation and management
- Payment method management
- Webhook handling for payment events

## API Endpoints

- `POST /subscription/create` - Create new subscription
- `GET /subscription` - Get current subscription
- `POST /subscription/cancel` - Cancel subscription
- `PUT /subscription/payment-method` - Update payment method
- `GET /subscription/invoices` - Get invoice history
- `POST /subscription/webhook` - Stripe webhook handler