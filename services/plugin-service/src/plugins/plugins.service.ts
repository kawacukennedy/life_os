import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plugin, PluginCategory, PluginStatus } from './plugin.entity';
import { UserPlugin, InstallationStatus } from './user-plugin.entity';

@Injectable()
export class PluginsService {
  constructor(
    @InjectRepository(Plugin)
    private pluginRepository: Repository<Plugin>,
    @InjectRepository(UserPlugin)
    private userPluginRepository: Repository<UserPlugin>,
  ) {}

  // Plugin management
  async create(pluginData: Partial<Plugin>): Promise<Plugin> {
    const plugin = this.pluginRepository.create(pluginData);
    return this.pluginRepository.save(plugin);
  }

  async findAll(options?: {
    category?: PluginCategory;
    status?: PluginStatus;
    limit?: number;
    offset?: number;
  }): Promise<Plugin[]> {
    const query = this.pluginRepository.createQueryBuilder('plugin');

    if (options?.category) {
      query.andWhere('plugin.category = :category', { category: options.category });
    }

    if (options?.status) {
      query.andWhere('plugin.status = :status', { status: options.status });
    }

    query.orderBy('plugin.installCount', 'DESC')
         .addOrderBy('plugin.averageRating', 'DESC');

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Plugin> {
    const plugin = await this.pluginRepository.findOne({ where: { id } });
    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }
    return plugin;
  }

  async update(id: string, updateData: Partial<Plugin>): Promise<Plugin> {
    await this.pluginRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.pluginRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Plugin not found');
    }
  }

  async searchPlugins(query: string, category?: PluginCategory): Promise<Plugin[]> {
    const qb = this.pluginRepository.createQueryBuilder('plugin');

    qb.where('plugin.status = :status', { status: PluginStatus.PUBLISHED })
      .andWhere('(plugin.name ILIKE :query OR plugin.description ILIKE :query OR plugin.tags ::text ILIKE :query)',
        { query: `%${query}%` });

    if (category) {
      qb.andWhere('plugin.category = :category', { category });
    }

    return qb.orderBy('plugin.installCount', 'DESC').getMany();
  }

  // User plugin installations
  async installPlugin(userId: string, pluginId: string, configuration?: any): Promise<UserPlugin> {
    // Check if plugin exists and is published
    const plugin = await this.findOne(pluginId);
    if (plugin.status !== PluginStatus.PUBLISHED) {
      throw new Error('Plugin is not available for installation');
    }

    // Check if already installed
    const existing = await this.userPluginRepository.findOne({
      where: { userId, pluginId },
    });

    if (existing && existing.status !== InstallationStatus.UNINSTALLED) {
      throw new Error('Plugin already installed');
    }

    const userPlugin = this.userPluginRepository.create({
      userId,
      pluginId,
      configuration,
      status: InstallationStatus.INSTALLING,
    });

    const saved = await this.userPluginRepository.save(userPlugin);

    // Update install count
    await this.pluginRepository.increment({ id: pluginId }, 'installCount', 1);

    // Simulate installation process
    setTimeout(async () => {
      await this.userPluginRepository.update(saved.id, {
        status: InstallationStatus.ACTIVE,
      });
    }, 2000); // Simulate 2 second installation

    return saved;
  }

  async uninstallPlugin(userId: string, pluginId: string): Promise<void> {
    const userPlugin = await this.userPluginRepository.findOne({
      where: { userId, pluginId },
    });

    if (!userPlugin) {
      throw new NotFoundException('Plugin not installed');
    }

    userPlugin.status = InstallationStatus.UNINSTALLED;
    await this.userPluginRepository.save(userPlugin);

    // Update install count
    await this.pluginRepository.decrement({ id: pluginId }, 'installCount', 1);
  }

  async getUserPlugins(userId: string): Promise<UserPlugin[]> {
    return this.userPluginRepository.find({
      where: { userId },
      relations: ['plugin'],
      order: { installedAt: 'DESC' },
    });
  }

  async updatePluginConfiguration(userId: string, pluginId: string, configuration: any): Promise<UserPlugin> {
    const userPlugin = await this.userPluginRepository.findOne({
      where: { userId, pluginId },
    });

    if (!userPlugin) {
      throw new NotFoundException('Plugin not installed');
    }

    userPlugin.configuration = { ...userPlugin.configuration, ...configuration };
    return this.userPluginRepository.save(userPlugin);
  }

  async getPluginStats(): Promise<any> {
    const totalPlugins = await this.pluginRepository.count({
      where: { status: PluginStatus.PUBLISHED },
    });

    const totalInstallations = await this.userPluginRepository.count({
      where: { status: InstallationStatus.ACTIVE },
    });

    const categoryStats = await this.pluginRepository
      .createQueryBuilder('plugin')
      .select('plugin.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('plugin.status = :status', { status: PluginStatus.PUBLISHED })
      .groupBy('plugin.category')
      .getRawMany();

    return {
      totalPlugins,
      totalInstallations,
      categoryBreakdown: categoryStats,
    };
  }
}