import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface InvestmentAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  holdings: InvestmentHolding[];
}

export interface InvestmentHolding {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

@Injectable()
export class InvestmentService {
  constructor(private httpService: HttpService) {}

  async getAccounts(userId: string): Promise<InvestmentAccount[]> {
    // Mock implementation - in real app, integrate with Alpaca, Robinhood, etc.
    // For now, return mock data
    return [
      {
        id: 'inv-1',
        name: 'Brokerage Account',
        type: 'brokerage',
        balance: 15420.50,
        holdings: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            quantity: 10,
            averageCost: 150.00,
            currentPrice: 175.25,
            marketValue: 1752.50,
            gainLoss: 252.50,
            gainLossPercent: 16.83,
          },
          {
            symbol: 'GOOGL',
            name: 'Alphabet Inc.',
            quantity: 5,
            averageCost: 2500.00,
            currentPrice: 2750.00,
            marketValue: 13750.00,
            gainLoss: 1250.00,
            gainLossPercent: 10.00,
          },
        ],
      },
    ];
  }

  async getPortfolioSummary(userId: string): Promise<any> {
    const accounts = await this.getAccounts(userId);
    const totalValue = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalGainLoss = accounts.reduce((sum, acc) =>
      sum + acc.holdings.reduce((hSum, h) => hSum + h.gainLoss, 0), 0);

    return {
      totalValue,
      totalGainLoss,
      totalGainLossPercent: totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0,
      accounts: accounts.length,
      topHoldings: accounts.flatMap(acc => acc.holdings)
        .sort((a, b) => b.marketValue - a.marketValue)
        .slice(0, 5),
    };
  }

  async getMarketData(symbols: string[]): Promise<any> {
    // Mock market data - in real app, use Alpha Vantage, IEX Cloud, etc.
    const mockData = {
      'AAPL': { price: 175.25, change: 2.15, changePercent: 1.24 },
      'GOOGL': { price: 2750.00, change: -15.50, changePercent: -0.56 },
      'MSFT': { price: 335.50, change: 5.25, changePercent: 1.59 },
    };

    return symbols.reduce((acc, symbol) => {
      acc[symbol] = mockData[symbol] || { price: 0, change: 0, changePercent: 0 };
      return acc;
    }, {});
  }

  async connectAlpacaAccount(userId: string, credentials: any): Promise<any> {
    // Mock Alpaca connection
    // In real implementation, validate credentials and store encrypted
    return {
      success: true,
      accountId: `alpaca-${userId}`,
      message: 'Alpaca account connected successfully',
    };
  }

  async syncInvestments(userId: string): Promise<any> {
    // Mock sync - in real app, fetch from Alpaca API
    return {
      synced: true,
      accounts: 1,
      holdings: 2,
      lastSync: new Date(),
    };
  }
}