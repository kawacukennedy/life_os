import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventSourcing1735526000000 implements MigrationInterface {
    name = 'AddEventSourcing1735526000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "events" (
                "eventId" uuid NOT NULL,
                "eventType" character varying NOT NULL,
                "aggregateId" character varying NOT NULL,
                "aggregateType" character varying NOT NULL,
                "eventData" jsonb NOT NULL,
                "metadata" jsonb NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_events" PRIMARY KEY ("eventId")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_events_aggregate_id_aggregate_type" ON "events" ("aggregateId", "aggregateType")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_events_event_type" ON "events" ("eventType")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_events_metadata" ON "events" USING GIN ("metadata")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_events_metadata"`);
        await queryRunner.query(`DROP INDEX "IDX_events_event_type"`);
        await queryRunner.query(`DROP INDEX "IDX_events_aggregate_id_aggregate_type"`);
        await queryRunner.query(`DROP TABLE "events"`);
    }
}