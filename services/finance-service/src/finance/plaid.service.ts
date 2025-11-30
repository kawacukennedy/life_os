import { Injectable } from '@nestjs/common';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { MonitoringService } from './monitoring.service';
import { LoggingService } from './logging.service';

@Injectable()
export class PlaidService {
  private client: PlaidApi;

  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly loggingService: LoggingService,
  ) {
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
    const startTime = Date.now();
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

      this.monitoringService.recordPlaidApiCall('link_token_create', 'POST', Date.now() - startTime, true);
      this.loggingService.logPlaidApiCall('link_token_create', 'POST', Date.now() - startTime, true, userId);

      return response.data;
    } catch (error) {
      this.monitoringService.recordPlaidApiCall('link_token_create', 'POST', Date.now() - startTime, false);
      this.loggingService.logError(error, 'createLinkToken', userId);
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
      console.error('Error exchanging public token:', error);
      throw error;
    }
  }

  async getTransactions(accessToken: string, startDate: string, endDate: string): Promise<any> {
    const startTime = Date.now();
    try {
      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          include_personal_finance_category: true,
        },
      };

      const response = await this.client.transactionsGet(request);

      this.monitoringService.recordPlaidApiCall('transactions_get', 'POST', Date.now() - startTime, true);
      this.loggingService.logPlaidApiCall('transactions_get', 'POST', Date.now() - startTime, true);

      return response.data;
    } catch (error) {
      this.monitoringService.recordPlaidApiCall('transactions_get', 'POST', Date.now() - startTime, false);
      this.loggingService.logError(error, 'getTransactions');
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
      console.error('Error fetching accounts:', error);
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
      console.error('Error fetching identity:', error);
      throw error;
    }
  }

  categorizeTransaction(description: string, amount: number): string {
    const lowerDesc = description.toLowerCase();

    // Food & Dining
    if (lowerDesc.includes('restaurant') || lowerDesc.includes('cafe') || lowerDesc.includes('mcdonald') ||
        lowerDesc.includes('starbucks') || lowerDesc.includes('subway')) {
      return 'Food & Dining';
    }

    // Transportation
    if (lowerDesc.includes('uber') || lowerDesc.includes('lyft') || lowerDesc.includes('gas') ||
        lowerDesc.includes('shell') || lowerDesc.includes('exxon') || lowerDesc.includes('bp')) {
      return 'Transportation';
    }

    // Shopping
    if (lowerDesc.includes('amazon') || lowerDesc.includes('walmart') || lowerDesc.includes('target') ||
        lowerDesc.includes('costco') || lowerDesc.includes('ikea')) {
      return 'Shopping';
    }

    // Entertainment
    if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify') || lowerDesc.includes('movie') ||
        lowerDesc.includes('theater') || lowerDesc.includes('concert')) {
      return 'Entertainment';
    }

    // Utilities
    if (lowerDesc.includes('electric') || lowerDesc.includes('water') || lowerDesc.includes('internet') ||
        lowerDesc.includes('phone') || lowerDesc.includes('comcast') || lowerDesc.includes('verizon')) {
      return 'Utilities';
    }

    // Healthcare
    if (lowerDesc.includes('pharmacy') || lowerDesc.includes('doctor') || lowerDesc.includes('hospital') ||
        lowerDesc.includes('cvs') || lowerDesc.includes('walgreens')) {
      return 'Healthcare';
    }

    // Default category
    return amount > 0 ? 'Income' : 'Other';
  }
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