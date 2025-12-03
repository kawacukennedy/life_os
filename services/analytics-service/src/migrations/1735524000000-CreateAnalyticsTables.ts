import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnalyticsTables1735524000000 implements MigrationInterface {
  name = 'CreateAnalyticsTables1735524000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create analytics_events table
    await queryRunner.query(`
      CREATE TABLE "analytics_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "event_type" character varying NOT NULL,
        "properties" jsonb,
        "session_id" character varying,
        "device_info" jsonb,
        "user_agent" text,
        "ip_address" inet,
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analytics_events" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_analytics_events_user_id" ON "analytics_events" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analytics_events_event_type" ON "analytics_events" ("event_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analytics_events_timestamp" ON "analytics_events" ("timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analytics_events_user_timestamp" ON "analytics_events" ("user_id", "timestamp")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_analytics_events_user_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_analytics_events_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_analytics_events_event_type"`);
    await queryRunner.query(`DROP INDEX "IDX_analytics_events_user_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "analytics_events"`);
  }
}