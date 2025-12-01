import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Transaction } from '../transactions/transaction.entity';

export interface CategorizationResult {
  category: string;
  subcategory: string;
  confidence: number;
  merchant: string;
  tags: string[];
}

@Injectable()
export class TransactionCategorizerService {
  // Rule-based categorization as fallback
  private categoryRules = {
    // Food & Dining
    food: ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'taco', 'sushi', 'mcdonald', 'starbucks', 'subway'],
    groceries: ['grocery', 'market', 'supermarket', 'whole foods', 'trader joe', 'safeway', 'kroger'],

    // Transportation
    gas: ['shell', 'chevron', 'exxon', 'bp', 'mobil', 'gas station'],
    ride: ['uber', 'lyft', 'taxi', 'rideshare'],
    public_transport: ['metro', 'bus', 'train', 'subway', 'bart', 'mbta'],

    // Shopping
    clothing: ['h&m', 'zara', 'nike', 'adidas', 'gap', 'old navy'],
    electronics: ['apple', 'best buy', 'amazon', 'target', 'walmart'],
    home: ['ikea', 'home depot', 'lowes', 'bed bath'],

    // Entertainment
    entertainment: ['netflix', 'spotify', 'hulu', 'disney', 'movie', 'theater', 'cinema'],
    travel: ['airbnb', 'booking.com', 'expedia', 'hotels.com', 'delta', 'united', 'american airlines'],

    // Utilities
    utilities: ['electric', 'gas', 'water', 'internet', 'phone', 'verizon', 'att', 'comcast'],
    insurance: ['geico', 'progressive', 'state farm', 'allstate'],

    // Healthcare
    healthcare: ['pharmacy', 'cvs', 'walgreens', 'doctor', 'hospital', 'clinic'],
  };

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private httpService: HttpService,
  ) {}

  async categorizeTransaction(transaction: Transaction): Promise<CategorizationResult> {
    try {
      // Try AI-based categorization first
      const aiResult = await this.categorizeWithAI(transaction);
      if (aiResult.confidence > 0.7) {
        return aiResult;
      }
    } catch (error) {
      console.error('AI categorization failed:', error);
    }

    // Fallback to rule-based categorization
    return this.categorizeWithRules(transaction);
  }

  private async categorizeWithAI(transaction: Transaction): Promise<CategorizationResult> {
    const prompt = `Categorize this financial transaction:
Description: ${transaction.description}
Amount: ${transaction.amount}
Merchant: ${transaction.merchantName || 'Unknown'}
Date: ${transaction.date}

Return JSON with:
{
  "category": "main category (e.g., Food & Dining, Transportation, Shopping)",
  "subcategory": "specific subcategory (e.g., Restaurants, Gas, Clothing)",
  "confidence": 0.0-1.0,
  "merchant": "normalized merchant name",
  "tags": ["relevant", "tags"]
}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${process.env.AI_SERVICE_URL || 'http://localhost:3006'}/ai/categorize-transaction`,
          {
            transaction: {
              description: transaction.description,
              amount: transaction.amount,
              merchantName: transaction.merchantName,
              date: transaction.date,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  private categorizeWithRules(transaction: Transaction): CategorizationResult {
    const description = transaction.description.toLowerCase();
    const merchant = (transaction.merchantName || '').toLowerCase();

    const searchText = `${description} ${merchant}`;

    for (const [category, keywords] of Object.entries(this.categoryRules)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return {
            category: this.formatCategoryName(category),
            subcategory: this.getSubcategory(category, keyword),
            confidence: 0.8, // Rule-based confidence
            merchant: transaction.merchantName || 'Unknown',
            tags: [keyword],
          };
        }
      }
    }

    // Default categorization
    return {
      category: 'Other',
      subcategory: 'Miscellaneous',
      confidence: 0.5,
      merchant: transaction.merchantName || 'Unknown',
      tags: [],
    };
  }

  private formatCategoryName(ruleKey: string): string {
    const categoryMap = {
      food: 'Food & Dining',
      groceries: 'Food & Dining',
      gas: 'Transportation',
      ride: 'Transportation',
      public_transport: 'Transportation',
      clothing: 'Shopping',
      electronics: 'Shopping',
      home: 'Shopping',
      entertainment: 'Entertainment',
      travel: 'Travel',
      utilities: 'Bills & Utilities',
      insurance: 'Insurance',
      healthcare: 'Healthcare',
    };

    return categoryMap[ruleKey] || 'Other';
  }

  private getSubcategory(category: string, keyword: string): string {
    const subcategoryMap = {
      food: 'Restaurants',
      groceries: 'Groceries',
      gas: 'Gas Stations',
      ride: 'Rideshare',
      public_transport: 'Public Transit',
      clothing: 'Clothing',
      electronics: 'Electronics',
      home: 'Home & Garden',
      entertainment: 'Entertainment',
      travel: 'Travel',
      utilities: 'Utilities',
      insurance: 'Insurance',
      healthcare: 'Healthcare',
    };

    return subcategoryMap[category] || keyword;
  }

  async batchCategorizeTransactions(userId: string): Promise<void> {
    const uncategorizedTransactions = await this.transactionRepository.find({
      where: { userId, category: null },
    });

    for (const transaction of uncategorizedTransactions) {
      const categorization = await this.categorizeTransaction(transaction);
      transaction.category = categorization.category;
      transaction.subcategory = categorization.subcategory;
      transaction.tags = categorization.tags;
      await this.transactionRepository.save(transaction);
    }
  }

  async retrainCategorizationModel(userId: string): Promise<void> {
    // In a real implementation, this would collect labeled data and retrain the model
    // For now, just log the intent
    console.log(`Retraining categorization model for user ${userId}`);
  }
}