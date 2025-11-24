import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaidService } from './plaid.service';
import { Transaction } from '../transactions/transaction.entity';
import { LoggerService } from '../auth/logger.service';
import { CacheService } from '../auth/cache.service';
import { BackgroundJobService } from '../auth/background-job.service';

describe('PlaidService', () => {
  let service: PlaidService;
  let transactionRepository: Repository<Transaction>;
  let loggerService: LoggerService;
  let cacheService: CacheService;
  let backgroundJobService: BackgroundJobService;

  const mockUser = {
    id: 'user-uuid',
    plaidTokens: {
      accessToken: 'plaid-access-token',
      itemId: 'plaid-item-id',
    },
  };

  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getApiResponse: jest.fn(),
    setApiResponse: jest.fn(),
  };

  const mockBackgroundJobService = {
    addJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaidService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: BackgroundJobService,
          useValue: mockBackgroundJobService,
        },
      ],
    }).compile();

    service = module.get<PlaidService>(PlaidService);
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    loggerService = module.get<LoggerService>(LoggerService);
    cacheService = module.get<CacheService>(CacheService);
    backgroundJobService = module.get<BackgroundJobService>(BackgroundJobService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLinkToken', () => {
    it('should create Plaid Link token', async () => {
      const mockLinkToken = 'link-token-123';
      const mockPlaidClient = {
        linkTokenCreate: jest.fn().mockResolvedValue({
          data: { link_token: mockLinkToken },
        }),
      };

      (service as any).plaidClient = mockPlaidClient;

      const result = await service.createLinkToken('user-uuid');

      expect(result).toEqual({ link_token: mockLinkToken });
      expect(mockPlaidClient.linkTokenCreate).toHaveBeenCalledWith({
        user: {
          client_user_id: 'user-uuid',
        },
        client_name: 'LifeOS',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Plaid Link token created',
        expect.objectContaining({ userId: 'user-uuid' })
      );
    });

    it('should handle Plaid API errors', async () => {
      const mockPlaidClient = {
        linkTokenCreate: jest.fn().mockRejectedValue(new Error('Plaid API error')),
      };

      (service as any).plaidClient = mockPlaidClient;

      await expect(service.createLinkToken('user-uuid')).rejects.toThrow('Plaid API error');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('exchangePublicToken', () => {
    it('should exchange public token for access token', async () => {
      const mockAccessToken = 'access-token-123';
      const mockItemId = 'item-id-456';
      const mockPlaidClient = {
        itemPublicTokenExchange: jest.fn().mockResolvedValue({
          data: {
            access_token: mockAccessToken,
            item_id: mockItemId,
          },
        }),
      };

      (service as any).plaidClient = mockPlaidClient;

      const result = await service.exchangePublicToken('public-token-789', 'user-uuid');

      expect(result).toEqual({
        accessToken: mockAccessToken,
        itemId: mockItemId,
      });
      expect(mockPlaidClient.itemPublicTokenExchange).toHaveBeenCalledWith({
        public_token: 'public-token-789',
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Plaid public token exchanged successfully',
        expect.objectContaining({ userId: 'user-uuid' })
      );
    });
  });

  describe('getAccounts', () => {
    it('should return cached accounts if available', async () => {
      const cachedAccounts = {
        accounts: [{ account_id: 'acc-1', name: 'Checking' }],
      };
      mockCacheService.getApiResponse.mockResolvedValue(cachedAccounts);

      const result = await service.getAccounts('user-uuid');

      expect(result).toEqual(cachedAccounts);
      expect(mockCacheService.getApiResponse).toHaveBeenCalledWith(
        'plaid',
        'accounts',
        'user-uuid'
      );
    });

    it('should fetch accounts from Plaid API when not cached', async () => {
      const apiResponse = {
        accounts: [
          {
            account_id: 'acc-1',
            name: 'Checking Account',
            type: 'depository',
            subtype: 'checking',
            balances: {
              current: 2500.50,
              available: 2450.50,
              currency: 'USD',
            },
          },
        ],
      };

      mockCacheService.getApiResponse.mockResolvedValue(null);

      const mockPlaidClient = {
        accountsGet: jest.fn().mockResolvedValue({ data: apiResponse }),
      };

      (service as any).plaidClient = mockPlaidClient;

      const result = await service.getAccounts('user-uuid');

      expect(result).toEqual(apiResponse);
      expect(mockPlaidClient.accountsGet).toHaveBeenCalledWith({
        access_token: 'plaid-access-token',
      });
      expect(mockCacheService.setApiResponse).toHaveBeenCalledWith(
        'plaid',
        'accounts',
        'user-uuid',
        apiResponse
      );
    });
  });

  describe('getTransactions', () => {
    const queryParams = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      page: 1,
      limit: 50,
    };

    it('should return paginated transactions', async () => {
      const mockTransactions = [
        {
          transaction_id: 'txn-1',
          amount: -25.99,
          date: '2024-01-15',
          description: 'Grocery Store',
          merchant_name: 'Whole Foods',
          category: ['Food and Drink', 'Groceries'],
        },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockTransactions, 1]),
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTransactions('user-uuid', queryParams);

      expect(result).toEqual({
        transactions: mockTransactions,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should apply date filters correctly', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getTransactions('user-uuid', queryParams);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('transaction.userId = :userId', {
        userId: 'user-uuid',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('transaction.date >= :startDate', {
        startDate: '2024-01-01',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('transaction.date <= :endDate', {
        endDate: '2024-01-31',
      });
    });
  });

  describe('syncTransactions', () => {
    it('should fetch and store transactions from Plaid', async () => {
      const plaidTransactions = [
        {
          transaction_id: 'plaid-txn-1',
          amount: -25.99,
          date: '2024-01-15',
          description: 'Grocery Store Purchase',
          merchant_name: 'Whole Foods',
          category: ['Food and Drink', 'Groceries'],
          location: {
            address: '123 Main St',
            city: 'San Francisco',
            region: 'CA',
            postal_code: '94102',
            country: 'US',
          },
        },
      ];

      const mockPlaidClient = {
        transactionsGet: jest.fn().mockResolvedValue({
          data: { transactions: plaidTransactions },
        }),
      };

      (service as any).plaidClient = mockPlaidClient;

      const mockTransaction = {
        id: 'txn-1',
        transactionId: 'plaid-txn-1',
        amount: 25.99,
        date: new Date('2024-01-15'),
        description: 'Grocery Store Purchase',
        merchantName: 'Whole Foods',
        category: 'Food and Drink',
      };

      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);

      await service.syncTransactions('user-uuid', '2024-01-01', '2024-01-31');

      expect(mockPlaidClient.transactionsGet).toHaveBeenCalledWith({
        access_token: 'plaid-access-token',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });
      expect(mockTransactionRepository.create).toHaveBeenCalled();
      expect(mockTransactionRepository.save).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Synced 1 transactions for user user-uuid',
        expect.any(Object)
      );
    });

    it('should handle duplicate transactions', async () => {
      const plaidTransactions = [
        {
          transaction_id: 'existing-txn-1',
          amount: -25.99,
          date: '2024-01-15',
          description: 'Grocery Store Purchase',
        },
      ];

      const mockPlaidClient = {
        transactionsGet: jest.fn().mockResolvedValue({
          data: { transactions: plaidTransactions },
        }),
      };

      (service as any).plaidClient = mockPlaidClient;

      // Mock existing transaction
      mockTransactionRepository.findOne.mockResolvedValue({
        id: 'existing-1',
        transactionId: 'existing-txn-1',
      });

      await service.syncTransactions('user-uuid', '2024-01-01', '2024-01-31');

      expect(mockTransactionRepository.create).not.toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Transaction existing-txn-1 already exists, skipping',
        expect.any(Object)
      );
    });
  });

  describe('getAccountBalances', () => {
    it('should return account balances', async () => {
      const mockAccounts = [
        {
          account_id: 'acc-1',
          balances: {
            current: 2500.50,
            available: 2450.50,
            currency: 'USD',
          },
        },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            accountId: 'acc-1',
            current: 2500.50,
            available: 2450.50,
            currency: 'USD',
          },
        ]),
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAccountBalances('user-uuid');

      expect(result).toEqual([
        {
          accountId: 'acc-1',
          current: 2500.50,
          available: 2450.50,
          currency: 'USD',
        },
      ]);
    });
  });

  describe('handleWebhook', () => {
    it('should process transaction updates webhook', async () => {
      const webhookData = {
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'INITIAL_UPDATE',
        item_id: 'plaid-item-id',
        new_transactions: 5,
      };

      const result = await service.handleWebhook(webhookData);

      expect(result).toEqual({ success: true });
      expect(mockBackgroundJobService.addJob).toHaveBeenCalledWith({
        userId: 'user-uuid', // Would be resolved from item_id
        service: 'plaid',
        action: 'sync-transactions',
        priority: 'high',
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Processed Plaid webhook',
        expect.objectContaining({
          webhookType: 'TRANSACTIONS',
          webhookCode: 'INITIAL_UPDATE',
        })
      );
    });

    it('should handle different webhook types', async () => {
      const webhookData = {
        webhook_type: 'ITEM',
        webhook_code: 'ERROR',
        item_id: 'plaid-item-id',
        error: { error_type: 'ITEM_ERROR', error_code: 'NO_ACCOUNTS' },
      };

      const result = await service.handleWebhook(webhookData);

      expect(result).toEqual({ success: true });
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Plaid item error',
        expect.objectContaining({
          itemId: 'plaid-item-id',
          error: webhookData.error,
        })
      );
    });
  });

  describe('getTransactionSummary', () => {
    it('should return spending summary by category', async () => {
      const mockSummary = [
        { category: 'Food and Drink', total: -150.50, count: 8 },
        { category: 'Transportation', total: -75.25, count: 3 },
        { category: 'Entertainment', total: -200.00, count: 2 },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockSummary),
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTransactionSummary('user-uuid', '2024-01-01', '2024-01-31');

      expect(result).toEqual(mockSummary);
    });
  });
});