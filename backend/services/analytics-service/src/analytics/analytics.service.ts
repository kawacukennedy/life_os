import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThan } from "typeorm";
import { Event, EventType } from "./event.entity";
import { Metric, MetricType, MetricGranularity } from "./metric.entity";
import { Dashboard } from "./dashboard.entity";
import { CreateEventDto } from "./dto/create-event.dto";
import { CreateMetricDto } from "./dto/create-metric.dto";
import { CreateDashboardDto } from "./dto/create-dashboard.dto";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Metric)
    private metricRepository: Repository<Metric>,
    @InjectRepository(Dashboard)
    private dashboardRepository: Repository<Dashboard>,
  ) {}

  // Event ingestion and management
  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      timestamp: createEventDto.timestamp ? new Date(createEventDto.timestamp) : new Date(),
    });
    return this.eventRepository.save(event);
  }

  async createEvents(events: CreateEventDto[]): Promise<Event[]> {
    const eventEntities = events.map(event => this.eventRepository.create({
      ...event,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    }));
    return this.eventRepository.save(eventEntities);
  }

  async getEvents(
    userId?: string,
    eventType?: EventType,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<Event[]> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (eventType) where.eventType = eventType;
    if (startDate || endDate) {
      where.timestamp = Between(startDate || new Date(0), endDate || new Date());
    }

    return this.eventRepository.find({
      where,
      order: { timestamp: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  async getEventStats(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const query = this.eventRepository.createQueryBuilder("event")
      .select("event.eventType", "eventType")
      .addSelect("COUNT(*)", "count")
      .groupBy("event.eventType");

    if (userId) {
      query.where("event.userId = :userId", { userId });
    }

    if (startDate || endDate) {
      const whereCondition = userId ? "AND" : "WHERE";
      query.andWhere(`event.timestamp BETWEEN :startDate AND :endDate`, {
        startDate: startDate || new Date(0),
        endDate: endDate || new Date(),
      });
    }

    return query.getRawMany();
  }

  // Metric management
  async createMetric(createMetricDto: CreateMetricDto): Promise<Metric> {
    const metric = this.metricRepository.create({
      ...createMetricDto,
      timestamp: createMetricDto.timestamp ? new Date(createMetricDto.timestamp) : new Date(),
    });
    return this.metricRepository.save(metric);
  }

  async getMetrics(
    name?: string,
    category?: string,
    granularity?: MetricGranularity,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<Metric[]> {
    const where: any = {};
    if (name) where.name = name;
    if (category) where.category = category;
    if (granularity) where.granularity = granularity;
    if (startDate || endDate) {
      where.timestamp = Between(startDate || new Date(0), endDate || new Date());
    }

    return this.metricRepository.find({
      where,
      order: { timestamp: "DESC" },
      take: limit,
    });
  }

  async aggregateMetrics(
    name: string,
    granularity: MetricGranularity,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return this.metricRepository
      .createQueryBuilder("metric")
      .select("DATE_TRUNC(:granularity, metric.timestamp)", "timeBucket")
      .addSelect("AVG(metric.value)", "avgValue")
      .addSelect("MIN(metric.value)", "minValue")
      .addSelect("MAX(metric.value)", "maxValue")
      .addSelect("SUM(metric.value)", "sumValue")
      .addSelect("COUNT(*)", "count")
      .where("metric.name = :name", { name })
      .andWhere("metric.timestamp BETWEEN :startDate AND :endDate", { startDate, endDate })
      .groupBy("DATE_TRUNC(:granularity, metric.timestamp)")
      .orderBy("timeBucket", "ASC")
      .setParameters({ granularity })
      .getRawMany();
  }

  // Dashboard management
  async createDashboard(userId: string, createDashboardDto: CreateDashboardDto): Promise<Dashboard> {
    const dashboard = this.dashboardRepository.create({
      userId,
      ...createDashboardDto,
    });
    return this.dashboardRepository.save(dashboard);
  }

  async getUserDashboards(userId: string): Promise<Dashboard[]> {
    return this.dashboardRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: "DESC" },
    });
  }

  async getDashboardById(id: string): Promise<Dashboard> {
    return this.dashboardRepository.findOne({ where: { id } });
  }

  async updateDashboard(id: string, updateData: Partial<CreateDashboardDto>): Promise<Dashboard> {
    await this.dashboardRepository.update(id, updateData);
    return this.getDashboardById(id);
  }

  async deleteDashboard(id: string): Promise<void> {
    await this.dashboardRepository.update(id, { isActive: false });
  }

  // Analytics queries
  async getUserActivityTimeline(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.eventRepository
      .createQueryBuilder("event")
      .select("DATE(event.timestamp)", "date")
      .addSelect("COUNT(*)", "eventCount")
      .addSelect("COUNT(DISTINCT event.eventName)", "uniqueEvents")
      .where("event.userId = :userId", { userId })
      .andWhere("event.timestamp >= :startDate", { startDate })
      .groupBy("DATE(event.timestamp)")
      .orderBy("date", "ASC")
      .getRawMany();
  }

  async getSystemHealthMetrics(hours: number = 24): Promise<any> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const errorEvents = await this.eventRepository.count({
      where: {
        eventType: EventType.ERROR,
        timestamp: MoreThan(startDate),
      },
    });

    const performanceEvents = await this.eventRepository.count({
      where: {
        eventType: EventType.PERFORMANCE,
        timestamp: MoreThan(startDate),
      },
    });

    return {
      errorCount: errorEvents,
      performanceEventCount: performanceEvents,
      timeRange: `${hours} hours`,
    };
  }

  async getTopEvents(limit: number = 10, days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.eventRepository
      .createQueryBuilder("event")
      .select("event.eventName", "eventName")
      .addSelect("COUNT(*)", "count")
      .where("event.timestamp >= :startDate", { startDate })
      .groupBy("event.eventName")
      .orderBy("count", "DESC")
      .limit(limit)
      .getRawMany();
  }
}