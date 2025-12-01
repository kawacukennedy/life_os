import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus, TenantPlan } from './tenant.entity';
import { User } from '../users/user.entity';
import { EventStoreService } from './event-store.service';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTenantDto {
  name: string;
  domain: string;
  ownerId: string;
  plan?: TenantPlan;
}

export interface UpdateTenantDto {
  name?: string;
  domain?: string;
  status?: TenantStatus;
  plan?: TenantPlan;
  settings?: any;
}

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private eventStore: EventStoreService,
  ) {}

  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    // Check if domain is already taken
    const existingTenant = await this.tenantRepository.findOne({
      where: { domain: dto.domain },
    });

    if (existingTenant) {
      throw new BadRequestException('Domain already in use');
    }

    // Verify owner exists
    const owner = await this.userRepository.findOne({
      where: { id: dto.ownerId },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    const tenant = this.tenantRepository.create({
      name: dto.name,
      domain: dto.domain,
      ownerId: dto.ownerId,
      plan: dto.plan || TenantPlan.FREE,
      settings: this.getDefaultSettings(dto.plan || TenantPlan.FREE),
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Record tenant creation event
    await this.eventStore.saveEvent({
      eventId: uuidv4(),
      eventType: 'TenantCreated',
      aggregateId: savedTenant.id,
      aggregateType: 'Tenant',
      eventData: {
        name: dto.name,
        domain: dto.domain,
        ownerId: dto.ownerId,
        plan: dto.plan,
      },
      metadata: {
        timestamp: new Date(),
        userId: dto.ownerId,
        version: 1,
      },
    });

    return savedTenant;
  }

  async getTenantById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { domain },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateTenant(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.getTenantById(id);

    // Check domain uniqueness if updating domain
    if (dto.domain && dto.domain !== tenant.domain) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { domain: dto.domain },
      });

      if (existingTenant) {
        throw new BadRequestException('Domain already in use');
      }
    }

    Object.assign(tenant, dto);
    const updatedTenant = await this.tenantRepository.save(tenant);

    // Record tenant update event
    await this.eventStore.saveEvent({
      eventId: uuidv4(),
      eventType: 'TenantUpdated',
      aggregateId: id,
      aggregateType: 'Tenant',
      eventData: dto,
      metadata: {
        timestamp: new Date(),
        version: 2, // In a real implementation, you'd track version properly
      },
    });

    return updatedTenant;
  }

  async deleteTenant(id: string): Promise<void> {
    const tenant = await this.getTenantById(id);

    // Soft delete by marking as inactive
    tenant.status = TenantStatus.INACTIVE;
    await this.tenantRepository.save(tenant);

    // Record tenant deletion event
    await this.eventStore.saveEvent({
      eventId: uuidv4(),
      eventType: 'TenantDeleted',
      aggregateId: id,
      aggregateType: 'Tenant',
      eventData: {},
      metadata: {
        timestamp: new Date(),
        version: 3,
      },
    });
  }

  async getTenantsByOwner(ownerId: string): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { ownerId },
      relations: ['users'],
    });
  }

  async addUserToTenant(tenantId: string, userId: string): Promise<void> {
    const tenant = await this.getTenantById(tenantId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check tenant limits
    if (tenant.settings?.maxUsers && tenant.users.length >= tenant.settings.maxUsers) {
      throw new BadRequestException('Tenant user limit reached');
    }

    user.tenantId = tenantId;
    await this.userRepository.save(user);

    // Record user added to tenant event
    await this.eventStore.saveEvent({
      eventId: uuidv4(),
      eventType: 'UserAddedToTenant',
      aggregateId: tenantId,
      aggregateType: 'Tenant',
      eventData: { userId },
      metadata: {
        timestamp: new Date(),
        userId,
        version: tenant.users.length + 1,
      },
    });
  }

  async removeUserFromTenant(tenantId: string, userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found in tenant');
    }

    user.tenantId = null;
    await this.userRepository.save(user);

    // Record user removed from tenant event
    await this.eventStore.saveEvent({
      eventId: uuidv4(),
      eventType: 'UserRemovedFromTenant',
      aggregateId: tenantId,
      aggregateType: 'Tenant',
      eventData: { userId },
      metadata: {
        timestamp: new Date(),
        userId,
        version: 1,
      },
    });
  }

  async checkTenantLimits(tenantId: string, resource: string, currentUsage: number): Promise<boolean> {
    const tenant = await this.getTenantById(tenantId);

    const limits = {
      [TenantPlan.FREE]: {
        users: 5,
        storage: 100 * 1024 * 1024, // 100MB
        apiCalls: 1000,
      },
      [TenantPlan.BASIC]: {
        users: 25,
        storage: 1024 * 1024 * 1024, // 1GB
        apiCalls: 10000,
      },
      [TenantPlan.PRO]: {
        users: 100,
        storage: 10 * 1024 * 1024 * 1024, // 10GB
        apiCalls: 100000,
      },
      [TenantPlan.ENTERPRISE]: {
        users: -1, // Unlimited
        storage: -1,
        apiCalls: -1,
      },
    };

    const planLimits = limits[tenant.plan];
    if (!planLimits) return true;

    const limit = planLimits[resource];
    if (limit === -1) return true; // Unlimited

    return currentUsage < limit;
  }

  private getDefaultSettings(plan: TenantPlan): any {
    const settings = {
      [TenantPlan.FREE]: {
        maxUsers: 5,
        maxStorage: 100 * 1024 * 1024, // 100MB
        features: ['basic_auth', 'basic_dashboard'],
      },
      [TenantPlan.BASIC]: {
        maxUsers: 25,
        maxStorage: 1024 * 1024 * 1024, // 1GB
        features: ['basic_auth', 'basic_dashboard', 'api_access', 'integrations'],
      },
      [TenantPlan.PRO]: {
        maxUsers: 100,
        maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
        features: ['basic_auth', 'basic_dashboard', 'api_access', 'integrations', 'advanced_analytics', 'custom_domain'],
      },
      [TenantPlan.ENTERPRISE]: {
        maxUsers: -1,
        maxStorage: -1,
        features: ['all_features', 'white_label', 'sso', 'advanced_security'],
      },
    };

    return settings[plan];
  }
}