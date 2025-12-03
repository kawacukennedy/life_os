import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PluginCategory, PluginStatus } from './plugin.types';

@Injectable()
export class PluginGraphQLService {
  constructor(private httpService: HttpService) {}

  async getPlugins(options?: {
    category?: PluginCategory;
    status?: PluginStatus;
    limit?: number;
    offset?: number;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.PLUGIN_SERVICE_URL || 'http://localhost:3009'}/plugins`, {
          params: options,
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch plugins');
    }
  }

  async getPlugin(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.PLUGIN_SERVICE_URL || 'http://localhost:3009'}/plugins/${id}`)
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch plugin');
    }
  }

  async searchPlugins(query: string, category?: PluginCategory) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.PLUGIN_SERVICE_URL || 'http://localhost:3009'}/plugins/search`, {
          params: { query, category },
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to search plugins');
    }
  }

  async getUserPlugins(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.PLUGIN_SERVICE_URL || 'http://localhost:3009'}/plugins/user/${userId}`)
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch user plugins');
    }
  }

  async installPlugin(userId: string, pluginId: string, configuration?: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.PLUGIN_SERVICE_URL || 'http://localhost:3009'}/plugins/install`, {
          userId,
          pluginId,
          configuration,
        })
      );
      return {
        success: true,
        message: 'Plugin installed successfully',
        userPlugin: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to install plugin',
      };
    }
  }

  async uninstallPlugin(userId: string, pluginId: string) {
    try {
      await firstValueFrom(
        this.httpService.delete(`${process.env.PLUGIN_SERVICE_URL || 'http://localhost:3009'}/plugins/uninstall`, {
          data: { userId, pluginId },
        })
      );
      return {
        success: true,
        message: 'Plugin uninstalled successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to uninstall plugin',
      };
    }
  }

  async updatePluginConfiguration(userId: string, pluginId: string, configuration: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(`${process.env.PLUGIN_SERVICE_URL || 'http://localhost:3009'}/plugins/configuration`, {
          userId,
          pluginId,
          configuration,
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to update plugin configuration');
    }
  }

  async getPluginStats() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.PLUGIN_SERVICE_URL || 'http://localhost:3009'}/plugins/stats`)
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch plugin stats');
    }
  }
}