import { Injectable, Logger } from '@nestjs/common';
import { BigQuery } from '@google-cloud/bigquery';
import { EventStoreService, DomainEvent } from './event-store.service';
import { TenantService } from './tenant.service';

export interface AnalyticsEvent {
  eventId: string;
  eventType: string;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  timestamp: Date;
  properties: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: {
    type: string;
    os: string;
    browser: string;
  };
}

@Injectable()
export class DataWarehouseService {
  private readonly logger = new Logger(DataWarehouseService.name);
  private bigquery: BigQuery;
  private datasetId = 'lifeos_analytics';

  constructor(
    private eventStore: EventStoreService,
    private tenantService: TenantService,
  ) {
    this.bigquery = new BigQuery({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
    });
  }

  async initializeDataset(): Promise<void> {
    try {
      // Create dataset if it doesn't exist
      const dataset = this.bigquery.dataset(this.datasetId);
      const [exists] = await dataset.exists();

      if (!exists) {
        await this.bigquery.createDataset(this.datasetId, {
          location: 'US',
          description: 'LifeOS Analytics Data Warehouse',
        });
        this.logger.log('Created BigQuery dataset: lifeos_analytics');
      }

      // Create tables
      await this.createTables();
    } catch (error) {
      this.logger.error('Failed to initialize data warehouse:', error);
    }
  }

  private async createTables(): Promise<void> {
    const tables = [
      {
        name: 'events',
        schema: [
          { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'event_type', type: 'STRING', mode: 'REQUIRED' },
          { name: 'user_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'tenant_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'session_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'properties', type: 'JSON', mode: 'NULLABLE' },
          { name: 'user_agent', type: 'STRING', mode: 'NULLABLE' },
          { name: 'ip_address', type: 'STRING', mode: 'NULLABLE' },
          { name: 'device_info', type: 'JSON', mode: 'NULLABLE' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
        ],
      },
      {
        name: 'user_metrics',
        schema: [
          { name: 'user_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'tenant_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'date', type: 'DATE', mode: 'REQUIRED' },
          { name: 'login_count', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'session_duration', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'page_views', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'feature_usage', type: 'JSON', mode: 'NULLABLE' },
          { name: 'engagement_score', type: 'FLOAT', mode: 'NULLABLE' },
        ],
      },
      {
        name: 'tenant_metrics',
        schema: [
          { name: 'tenant_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'date', type: 'DATE', mode: 'REQUIRED' },
          { name: 'active_users', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'total_users', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'api_calls', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'storage_used', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'revenue', type: 'FLOAT', mode: 'NULLABLE' },
        ],
      },
    ];

    for (const table of tables) {
      await this.createTable(table.name, table.schema);
    }
  }

  private async createTable(tableName: string, schema: any[]): Promise<void> {
    const dataset = this.bigquery.dataset(this.datasetId);
    const table = dataset.table(tableName);

    const [exists] = await table.exists();
    if (!exists) {
      await table.create({
        schema: {
          fields: schema,
        },
        timePartitioning: tableName.includes('metrics') ? {
          type: 'DAY',
          field: 'date',
        } : undefined,
      });
      this.logger.log(`Created BigQuery table: ${tableName}`);
    }
  }

  async insertEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const dataset = this.bigquery.dataset(this.datasetId);
      const table = dataset.table('events');

      await table.insert({
        event_id: event.eventId,
        event_type: event.eventType,
        user_id: event.userId,
        tenant_id: event.tenantId,
        session_id: event.sessionId,
        timestamp: event.timestamp.toISOString(),
        properties: JSON.stringify(event.properties),
        user_agent: event.userAgent,
        ip_address: event.ipAddress,
        device_info: event.deviceInfo ? JSON.stringify(event.deviceInfo) : null,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Failed to insert event into BigQuery:', error);
    }
  }

  async syncEventsFromEventStore(): Promise<void> {
    try {
      // Get events from the last sync
      const lastSync = await this.getLastSyncTimestamp();
      const events = await this.eventStore.getAllEvents([], lastSync);

      const analyticsEvents: AnalyticsEvent[] = events.map(event => ({
        eventId: event.eventId,
        eventType: event.eventType,
        userId: event.metadata.userId,
        tenantId: event.metadata.correlationId, // Assuming correlationId contains tenant info
        timestamp: event.metadata.timestamp,
        properties: event.eventData,
      }));

      // Batch insert events
      if (analyticsEvents.length > 0) {
        await this.batchInsertEvents(analyticsEvents);
        await this.updateLastSyncTimestamp(new Date());
        this.logger.log(`Synced ${analyticsEvents.length} events to BigQuery`);
      }
    } catch (error) {
      this.logger.error('Failed to sync events to BigQuery:', error);
    }
  }

  private async batchInsertEvents(events: AnalyticsEvent[]): Promise<void> {
    const dataset = this.bigquery.dataset(this.datasetId);
    const table = dataset.table('events');

    const rows = events.map(event => ({
      event_id: event.eventId,
      event_type: event.eventType,
      user_id: event.userId,
      tenant_id: event.tenantId,
      session_id: event.sessionId,
      timestamp: event.timestamp.toISOString(),
      properties: JSON.stringify(event.properties),
      user_agent: event.userAgent,
      ip_address: event.ipAddress,
      device_info: event.deviceInfo ? JSON.stringify(event.deviceInfo) : null,
      created_at: new Date().toISOString(),
    }));

    await table.insert(rows);
  }

  async generateUserMetrics(date: Date): Promise<void> {
    const query = `
      INSERT INTO \`${this.datasetId}.user_metrics\`
      SELECT
        user_id,
        tenant_id,
        DATE(timestamp) as date,
        COUNTIF(event_type = 'login_success') as login_count,
        SUM(CASE WHEN event_type = 'session_end' THEN CAST(properties.session_duration AS INT64) ELSE 0 END) as session_duration,
        COUNTIF(event_type = 'page_view') as page_views,
        JSON_OBJECT(
          ARRAY_AGG(DISTINCT CASE WHEN event_type LIKE 'feature_%' THEN event_type END IGNORE NULLS),
          ARRAY_AGG(DISTINCT CASE WHEN event_type LIKE 'feature_%' THEN 1 END IGNORE NULLS)
        ) as feature_usage,
        (COUNTIF(event_type = 'login_success') * 0.3 +
         COUNTIF(event_type = 'page_view') * 0.1 +
         COUNTIF(event_type LIKE 'feature_%') * 0.6) as engagement_score
      FROM \`${this.datasetId}.events\`
      WHERE DATE(timestamp) = '${date.toISOString().split('T')[0]}'
        AND user_id IS NOT NULL
      GROUP BY user_id, tenant_id, DATE(timestamp)
    `;

    await this.executeQuery(query);
  }

  async generateTenantMetrics(date: Date): Promise<void> {
    const query = `
      INSERT INTO \`${this.datasetId}.tenant_metrics\`
      SELECT
        tenant_id,
        DATE(timestamp) as date,
        COUNT(DISTINCT user_id) as active_users,
        (SELECT COUNT(*) FROM \`${this.datasetId}.events\` e2
         WHERE e2.tenant_id = e1.tenant_id AND e2.event_type = 'user_created') as total_users,
        COUNT(*) as api_calls,
        SUM(CASE WHEN event_type = 'storage_used' THEN CAST(properties.bytes AS INT64) ELSE 0 END) as storage_used,
        SUM(CASE WHEN event_type = 'payment' THEN CAST(properties.amount AS FLOAT64) ELSE 0 END) as revenue
      FROM \`${this.datasetId}.events\` e1
      WHERE DATE(timestamp) = '${date.toISOString().split('T')[0]}'
        AND tenant_id IS NOT NULL
      GROUP BY tenant_id, DATE(timestamp)
    `;

    await this.executeQuery(query);
  }

  async getAnalyticsReport(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    const query = `
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(CASE WHEN event_type = 'response_time' THEN CAST(properties.duration AS FLOAT64) END) as avg_response_time,
        COUNTIF(event_type = 'error') as error_count
      FROM \`${this.datasetId}.events\`
      WHERE tenant_id = '${tenantId}'
        AND DATE(timestamp) BETWEEN '${startDate.toISOString().split('T')[0]}' AND '${endDate.toISOString().split('T')[0]}'
      GROUP BY DATE(timestamp)
      ORDER BY date
    `;

    const [rows] = await this.executeQuery(query);
    return rows;
  }

  private async executeQuery(query: string): Promise<any> {
    const [job] = await this.bigquery.createQueryJob({ query });
    const [rows] = await job.getQueryResults();
    return rows;
  }

  private async getLastSyncTimestamp(): Promise<Date | undefined> {
    // In a real implementation, you'd store this in a metadata table
    // For now, return a date from 24 hours ago
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date;
  }

  private async updateLastSyncTimestamp(timestamp: Date): Promise<void> {
    // In a real implementation, you'd update a metadata table
    this.logger.log(`Updated last sync timestamp to ${timestamp.toISOString()}`);
  }
}