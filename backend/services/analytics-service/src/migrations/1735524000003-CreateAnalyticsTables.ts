import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAnalyticsTables1735524000003 implements MigrationInterface {
  name = "CreateAnalyticsTables1735524000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create events table
    await queryRunner.query(`
      CREATE TYPE "event_type_enum" AS ENUM('user_action', 'system_event', 'business_metric', 'error', 'performance')
    `);
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "sessionId" uuid,
        "eventType" "event_type_enum" NOT NULL DEFAULT 'user_action',
        "eventName" character varying NOT NULL,
        "properties" jsonb NOT NULL,
        "context" jsonb,
        "ipAddress" character varying(45),
        "userAgent" character varying(500),
        "timestamp" TIMESTAMP NOT NULL,
        "timezone" character varying(10) NOT NULL DEFAULT 'UTC',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f6" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f6" ON "events" ("userId", "timestamp")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f7" ON "events" ("eventType", "timestamp")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f8" ON "events" ("userId")
    `);

    // Create metrics table
    await queryRunner.query(`
      CREATE TYPE "metric_type_enum" AS ENUM('counter', 'gauge', 'histogram', 'summary')
    `);
    await queryRunner.query(`
      CREATE TYPE "metric_granularity_enum" AS ENUM('minute', 'hour', 'day', 'week', 'month')
    `);
    await queryRunner.query(`
      CREATE TABLE "metrics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "type" "metric_type_enum" NOT NULL DEFAULT 'counter',
        "granularity" "metric_granularity_enum" NOT NULL DEFAULT 'hour',
        "category" character varying NOT NULL,
        "value" numeric(20,6) NOT NULL,
        "tags" jsonb,
        "metadata" jsonb,
        "timestamp" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f9" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f9" ON "metrics" ("name", "timestamp", "granularity")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f10" ON "metrics" ("category", "timestamp")
    `);

    // Create dashboards table
    await queryRunner.query(`
      CREATE TYPE "dashboard_type_enum" AS ENUM('user', 'system', 'public')
    `);
    await queryRunner.query(`
      CREATE TYPE "widget_type_enum" AS ENUM('chart', 'metric', 'table', 'map')
    `);
    await queryRunner.query(`
      CREATE TABLE "dashboards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "type" "dashboard_type_enum" NOT NULL DEFAULT 'user',
        "config" jsonb NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "permissions" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f11" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "dashboards"`);
    await queryRunner.query(`DROP TYPE "widget_type_enum"`);
    await queryRunner.query(`DROP TYPE "dashboard_type_enum"`);

    await queryRunner.query(`DROP INDEX "IDX_4c88e956195bba85977da21b8f10"`);
    await queryRunner.query(`DROP INDEX "IDX_4c88e956195bba85977da21b8f9"`);
    await queryRunner.query(`DROP TABLE "metrics"`);
    await queryRunner.query(`DROP TYPE "metric_granularity_enum"`);
    await queryRunner.query(`DROP TYPE "metric_type_enum"`);

    await queryRunner.query(`DROP INDEX "IDX_4c88e956195bba85977da21b8f8"`);
    await queryRunner.query(`DROP INDEX "IDX_4c88e956195bba85977da21b8f7"`);
    await queryRunner.query(`DROP INDEX "IDX_4c88e956195bba85977da21b8f6"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TYPE "event_type_enum"`);
  }
}