import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface Meal {
  id: string;
  userId: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  timestamp: Date;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
}

export interface NutritionGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  waterIntake: number; // glasses per day
}

@Injectable()
export class NutritionService {
  // Basic food database (in real app, integrate with Nutritionix or similar)
  private foodDatabase = {
    'apple': { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, unit: 'medium' },
    'banana': { calories: 105, protein: 1.3, carbs: 27, fat: 0.4, unit: 'medium' },
    'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: '100g' },
    'brown rice': { calories: 216, protein: 5, carbs: 44, fat: 1.8, unit: 'cup cooked' },
    'broccoli': { calories: 55, protein: 3.7, carbs: 11.2, fat: 0.6, unit: 'cup' },
    'salmon': { calories: 206, protein: 22, carbs: 0, fat: 12, unit: '100g' },
    'oatmeal': { calories: 150, protein: 5, carbs: 27, fat: 3, unit: 'cup cooked' },
    'eggs': { calories: 70, protein: 6, carbs: 0.6, fat: 5, unit: 'large' },
    'spinach': { calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, unit: 'cup' },
    'sweet potato': { calories: 112, protein: 2, carbs: 26, fat: 0.1, unit: 'medium' },
  };

  constructor() {
    // In real implementation, inject repository for Meal entity
  }

  async logMeal(userId: string, mealData: Partial<Meal>): Promise<Meal> {
    const foods = mealData.foods || [];
    const totals = this.calculateTotals(foods);

    const meal: Meal = {
      id: `meal-${Date.now()}`,
      userId,
      name: mealData.name || 'Unnamed Meal',
      type: mealData.type || 'snack',
      foods,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      timestamp: mealData.timestamp || new Date(),
    };

    // In real implementation: save to database
    // await this.mealRepository.save(meal);

    return meal;
  }

  async getMeals(userId: string, date?: Date): Promise<Meal[]> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Mock data - in real implementation, query database
    return [
      {
        id: 'meal-1',
        userId,
        name: 'Breakfast',
        type: 'breakfast',
        foods: [
          { id: 'food-1', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3, quantity: 1, unit: 'cup' },
          { id: 'food-2', name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, quantity: 1, unit: 'medium' },
        ],
        totalCalories: 255,
        totalProtein: 6.3,
        totalCarbs: 54,
        totalFat: 3.4,
        timestamp: new Date(targetDate.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
      },
    ];
  }

  async getNutritionSummary(userId: string, date?: Date): Promise<any> {
    const meals = await this.getMeals(userId, date);
    const goals = await this.getNutritionGoals(userId);

    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const progress = {
      calories: (totals.calories / goals.dailyCalories) * 100,
      protein: (totals.protein / goals.dailyProtein) * 100,
      carbs: (totals.carbs / goals.dailyCarbs) * 100,
      fat: (totals.fat / goals.dailyFat) * 100,
    };

    return {
      date: date || new Date(),
      totals,
      goals,
      progress,
      meals,
      recommendations: this.generateRecommendations(totals, goals),
    };
  }

  async searchFoods(query: string): Promise<any[]> {
    const lowerQuery = query.toLowerCase();
    return Object.entries(this.foodDatabase)
      .filter(([name]) => name.includes(lowerQuery))
      .map(([name, nutrition]) => ({
        name,
        ...nutrition,
      }))
      .slice(0, 10);
  }

  async getNutritionGoals(userId: string): Promise<NutritionGoals> {
    // Mock goals - in real implementation, store per user
    return {
      dailyCalories: 2000,
      dailyProtein: 150,
      dailyCarbs: 250,
      dailyFat: 67,
      waterIntake: 8,
    };
  }

  async updateNutritionGoals(userId: string, goals: Partial<NutritionGoals>): Promise<NutritionGoals> {
    // In real implementation, update user goals in database
    const currentGoals = await this.getNutritionGoals(userId);
    return { ...currentGoals, ...goals };
  }

  private calculateTotals(foods: FoodItem[]): { calories: number; protein: number; carbs: number; fat: number } {
    return foods.reduce((totals, food) => ({
      calories: totals.calories + food.calories,
      protein: totals.protein + food.protein,
      carbs: totals.carbs + food.carbs,
      fat: totals.fat + food.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  private generateRecommendations(totals: any, goals: NutritionGoals): string[] {
    const recommendations = [];

    if (totals.calories < goals.dailyCalories * 0.8) {
      recommendations.push('Consider adding more nutrient-dense foods to meet your calorie goals');
    }

    if (totals.protein < goals.dailyProtein * 0.7) {
      recommendations.push('Increase protein intake with lean meats, fish, eggs, or plant-based sources');
    }

    if (totals.carbs > goals.dailyCarbs * 1.2) {
      recommendations.push('Consider reducing refined carbs and focusing on complex carbohydrates');
    }

    if (totals.fat < goals.dailyFat * 0.5) {
      recommendations.push('Include healthy fats from avocados, nuts, seeds, and olive oil');

    }

    return recommendations;
  }

  async getMealSuggestions(userId: string, mealType: string): Promise<any[]> {
    // Generate meal suggestions based on goals and preferences
    const goals = await this.getNutritionGoals(userId);

    const suggestions = {
      breakfast: [
        {
          name: 'Protein-Packed Oatmeal',
          foods: ['oatmeal', 'eggs', 'banana'],
          estimatedCalories: 350,
        },
        {
          name: 'Greek Yogurt Parfait',
          foods: ['greek yogurt', 'berries', 'granola'],
          estimatedCalories: 280,
        },
      ],
      lunch: [
        {
          name: 'Grilled Chicken Salad',
          foods: ['chicken breast', 'spinach', 'broccoli', 'olive oil'],
          estimatedCalories: 400,
        },
        {
          name: 'Quinoa Bowl',
          foods: ['quinoa', 'salmon', 'sweet potato', 'spinach'],
          estimatedCalories: 450,
        },
      ],
      dinner: [
        {
          name: 'Baked Salmon',
          foods: ['salmon', 'brown rice', 'broccoli'],
          estimatedCalories: 500,
        },
        {
          name: 'Turkey Stir Fry',
          foods: ['turkey', 'brown rice', 'broccoli', 'carrots'],
          estimatedCalories: 450,
        },
      ],
    };

    return suggestions[mealType] || [];
  }
}