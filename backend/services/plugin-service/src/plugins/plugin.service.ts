import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Plugin, PluginCategory, PluginStatus } from "./plugin.entity";
import { UserPlugin, InstallationStatus } from "./user-plugin.entity";
import { CreatePluginDto } from "./dto/create-plugin.dto";
import { UpdatePluginDto } from "./dto/update-plugin.dto";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PluginService {
  constructor(
    @InjectRepository(Plugin)
    private pluginsRepository: Repository<Plugin>,
    @InjectRepository(UserPlugin)
    private userPluginsRepository: Repository<UserPlugin>,
  ) {}

  async create(createPluginDto: CreatePluginDto, authorId: string): Promise<Plugin> {
    const plugin = this.pluginsRepository.create({
      ...createPluginDto,
      authorId,
      slug: this.generateSlug(createPluginDto.name),
      id: uuidv4(),
    });

    return this.pluginsRepository.save(plugin);
  }

  async findAll(options?: {
    category?: PluginCategory;
    status?: PluginStatus;
    authorId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Plugin[]> {
    const query = this.pluginsRepository.createQueryBuilder('plugin')
      .where('plugin.isActive = :isActive', { isActive: true });

    if (options?.category) {
      query.andWhere('plugin.category = :category', { category: options.category });
    }

    if (options?.status) {
      query.andWhere('plugin.status = :status', { status: options.status });
    }

    if (options?.authorId) {
      query.andWhere('plugin.authorId = :authorId', { authorId: options.authorId });
    }

    if (options?.search) {
      query.andWhere(
        '(plugin.name ILIKE :search OR plugin.description ILIKE :search OR plugin.tags && :tags)',
        {
          search: `%${options.search}%`,
          tags: [options.search],
        }
      );
    }

    query.orderBy('plugin.installCount', 'DESC')
         .addOrderBy('plugin.averageRating', 'DESC')
         .addOrderBy('plugin.createdAt', 'DESC');

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Plugin> {
    const plugin = await this.pluginsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    // Increment view count
    await this.pluginsRepository.increment({ id }, 'viewCount', 1);

    return plugin;
  }

  async findBySlug(slug: string): Promise<Plugin> {
    const plugin = await this.pluginsRepository.findOne({
      where: { slug, isActive: true },
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    return plugin;
  }

  async update(id: string, updatePluginDto: UpdatePluginDto, authorId: string): Promise<Plugin> {
    const plugin = await this.findOne(id);

    if (plugin.authorId !== authorId) {
      throw new BadRequestException('You can only update your own plugins');
    }

    Object.assign(plugin, updatePluginDto);
    return this.pluginsRepository.save(plugin);
  }

  async publish(id: string, authorId: string): Promise<Plugin> {
    const plugin = await this.findOne(id);

    if (plugin.authorId !== authorId) {
      throw new BadRequestException('You can only publish your own plugins');
    }

    if (plugin.status !== PluginStatus.APPROVED) {
      throw new BadRequestException('Plugin must be approved before publishing');
    }

    plugin.status = PluginStatus.PUBLISHED;
    plugin.publishedAt = new Date();

    return this.pluginsRepository.save(plugin);
  }

  async remove(id: string, authorId: string): Promise<void> {
    const plugin = await this.findOne(id);

    if (plugin.authorId !== authorId) {
      throw new BadRequestException('You can only delete your own plugins');
    }

    plugin.isActive = false;
    await this.pluginsRepository.save(plugin);
  }

  async install(pluginId: string, userId: string): Promise<UserPlugin> {
    const plugin = await this.findOne(pluginId);

    // Check if already installed
    const existing = await this.userPluginsRepository.findOne({
      where: { userId, pluginId },
    });

    if (existing) {
      if (existing.status === InstallationStatus.INSTALLED) {
        throw new BadRequestException('Plugin already installed');
      }
      // Reinstall if failed
      existing.status = InstallationStatus.INSTALLING;
      return this.userPluginsRepository.save(existing);
    }

    const userPlugin = this.userPluginsRepository.create({
      userId,
      pluginId,
      installedVersion: plugin.version,
      permissions: plugin.manifest.permissions,
      installationMetadata: {
        source: 'marketplace',
      },
    });

    const saved = await this.userPluginsRepository.save(userPlugin);

    // Increment install count
    await this.pluginsRepository.increment({ id: pluginId }, 'installCount', 1);

    return saved;
  }

  async uninstall(pluginId: string, userId: string): Promise<void> {
    const userPlugin = await this.userPluginsRepository.findOne({
      where: { userId, pluginId },
    });

    if (!userPlugin) {
      throw new NotFoundException('Plugin not installed');
    }

    userPlugin.status = InstallationStatus.UNINSTALLING;
    await this.userPluginsRepository.save(userPlugin);

    // Decrement install count
    await this.pluginsRepository.decrement({ id: pluginId }, 'installCount', 1);
  }

  async getUserPlugins(userId: string): Promise<UserPlugin[]> {
    return this.userPluginsRepository.find({
      where: { userId },
      relations: ['plugin'],
      order: { createdAt: 'DESC' },
    });
  }

  async updatePluginSettings(
    pluginId: string,
    userId: string,
    settings: Record<string, any>
  ): Promise<UserPlugin> {
    const userPlugin = await this.userPluginsRepository.findOne({
      where: { userId, pluginId },
    });

    if (!userPlugin) {
      throw new NotFoundException('Plugin not installed');
    }

    userPlugin.settings = { ...userPlugin.settings, ...settings };
    return this.userPluginsRepository.save(userPlugin);
  }

  async togglePlugin(pluginId: string, userId: string, enabled: boolean): Promise<UserPlugin> {
    const userPlugin = await this.userPluginsRepository.findOne({
      where: { userId, pluginId },
    });

    if (!userPlugin) {
      throw new NotFoundException('Plugin not installed');
    }

    userPlugin.isEnabled = enabled;
    if (enabled) {
      userPlugin.lastUsedAt = new Date();
    }

    return this.userPluginsRepository.save(userPlugin);
  }

  async getPopularPlugins(limit: number = 10): Promise<Plugin[]> {
    return this.pluginsRepository.find({
      where: { isActive: true, status: PluginStatus.PUBLISHED },
      order: { installCount: 'DESC', averageRating: 'DESC' },
      take: limit,
    });
  }

  async getFeaturedPlugins(limit: number = 6): Promise<Plugin[]> {
    // For now, return highest rated plugins
    return this.pluginsRepository.find({
      where: { isActive: true, status: PluginStatus.PUBLISHED },
      order: { averageRating: 'DESC', installCount: 'DESC' },
      take: limit,
    });
  }

  async searchPlugins(query: string, category?: PluginCategory, limit: number = 20): Promise<Plugin[]> {
    return this.findAll({
      search: query,
      category,
      status: PluginStatus.PUBLISHED,
      limit,
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}