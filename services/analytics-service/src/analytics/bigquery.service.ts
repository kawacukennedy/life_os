import { Injectable } from '@nestjs/common';
import { BigQuery } from '@google-cloud/bigquery';

@Injectable()
export class BigQueryService {
  private bigquery: BigQuery;
  private datasetId = 'lifeos_analytics';
  private tableId = 'events';

  constructor() {
    this.bigquery = new BigQuery({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
    });
  }

  async insertEvent(event: any) {
    const rows = [this.transformEventForBigQuery(event)];
    await this.bigquery
      .dataset(this.datasetId)
      .table(this.tableId)
      .insert(rows);
  }

  async insertEvents(events: any[]) {
    const rows = events.map(event => this.transformEventForBigQuery(event));
    await this.bigquery
      .dataset(this.datasetId)
      .table(this.tableId)
      .insert(rows);
  }

  private transformEventForBigQuery(event: any) {
    return {
      user_id: event.userId,
      event_type: event.eventType,
      properties: JSON.stringify(event.properties),
      session_id: event.sessionId,
      device_info: JSON.stringify(event.deviceInfo),
      user_agent: event.userAgent,
      ip_address: event.ipAddress,
      timestamp: event.timestamp.toISOString(),
      processed_at: event.properties._processed_at,
      version: event.properties._version,
    };
  }

  async queryUserActivity(userId: string, startDate: string, endDate: string) {
    const query = `
      SELECT
        DATE(timestamp) as date,
        event_type,
        COUNT(*) as count
      FROM \`${this.datasetId}.${this.tableId}\`
      WHERE user_id = @userId
        AND DATE(timestamp) BETWEEN @startDate AND @endDate
      GROUP BY date, event_type
      ORDER BY date, event_type
    `;

    const options = {
      query,
      params: {
        userId,
        startDate,
        endDate,
      },
    };

    const [rows] = await this.bigquery.query(options);
    return rows;
  }
}