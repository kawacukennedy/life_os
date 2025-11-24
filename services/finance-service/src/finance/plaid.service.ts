import { Injectable } from '@nestjs/common';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

@Injectable()
export class PlaidService {
  private client: PlaidApi;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox, // Change to 'development' or 'production' as needed
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });

    this.client = new PlaidApi(configuration);
  }

  async createLinkToken(userId: string): Promise<any> {
    try {
      const request = {
        user: {
          client_user_id: userId,
        },
        client_name: 'LifeOS',
        products: [Products.Transactions, Products.Auth, Products.Identity],
        country_codes: [CountryCode.Us],
        language: 'en',
      };

      const response = await this.client.linkTokenCreate(request);
      return response.data;
    } catch (error) {
      console.error('Error creating Plaid link token:', error);
      throw error;
    }
  }

  async exchangePublicToken(publicToken: string): Promise<any> {
    try {
      const request = {
        public_token: publicToken,
      };

      const response = await this.client.itemPublicTokenExchange(request);
      return response.data;
    } catch (error) {
      console.error('Error exchanging Plaid public token:', error);
      throw error;
    }
  }

  async getAccounts(accessToken: string): Promise<any> {
    try {
      const request = {
        access_token: accessToken,
      };

      const response = await this.client.accountsGet(request);
      return response.data;
    } catch (error) {
      console.error('Error fetching Plaid accounts:', error);
      throw error;
    }
  }

  async getTransactions(accessToken: string, startDate: string, endDate: string): Promise<any> {
    try {
      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      };

      const response = await this.client.transactionsGet(request);
      return response.data;
    } catch (error) {
      console.error('Error fetching Plaid transactions:', error);
      throw error;
    }
  }

  async getIdentity(accessToken: string): Promise<any> {
    try {
      const request = {
        access_token: accessToken,
      };

      const response = await this.client.identityGet(request);
      return response.data;
    } catch (error) {
      console.error('Error fetching Plaid identity:', error);
      throw error;
    }
  }

  async getBalances(accessToken: string): Promise<any> {
    try {
      const request = {
        access_token: accessToken,
      };

      const response = await this.client.accountsBalanceGet(request);
      return response.data;
    } catch (error) {
      console.error('Error fetching Plaid balances:', error);
      throw error;
    }
  }

  async getItem(accessToken: string): Promise<any> {
    try {
      const request = {
        access_token: accessToken,
      };

      const response = await this.client.itemGet(request);
      return response.data;
    } catch (error) {
      console.error('Error fetching Plaid item:', error);
      throw error;
    }
  }

  async removeItem(accessToken: string): Promise<any> {
    try {
      const request = {
        access_token: accessToken,
      };

      const response = await this.client.itemRemove(request);
      return response.data;
    } catch (error) {
      console.error('Error removing Plaid item:', error);
      throw error;
    }
  }

  // Webhook handling
  async handleWebhook(body: any, headers: any): Promise<void> {
    // Verify webhook signature in production
    const webhookType = body.webhook_type;
    const webhookCode = body.webhook_code;

    console.log('Received Plaid webhook:', { webhookType, webhookCode });

    switch (webhookCode) {
      case 'INITIAL_UPDATE':
        console.log('Initial transactions update completed');
        break;
      case 'HISTORICAL_UPDATE':
        console.log('Historical transactions update completed');
        break;
      case 'DEFAULT_UPDATE':
        console.log('New transactions available');
        break;
      case 'TRANSACTIONS_REMOVED':
        console.log('Transactions removed');
        break;
      default:
        console.log('Unhandled webhook code:', webhookCode);
    }
  }
}