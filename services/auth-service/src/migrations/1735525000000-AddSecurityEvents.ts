import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSecurityEvents1735525000000 implements MigrationInterface {
    name = 'AddSecurityEvents1735525000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "security_events_event_type_enum" AS ENUM(
                'login_success',
                'login_failed',
                'logout',
                'password_reset_request',
                'password_reset_success',
                'password_change',
                'suspicious_activity',
                'account_locked',
                'account_unlocked',
                'session_expired',
                'token_refresh',
                'api_access_denied',
                'rate_limit_exceeded'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "security_events_risk_level_enum" AS ENUM(
                'low',
                'medium',
                'high',
                'critical'
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "security_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" character varying,
                "event_type" "security_events_event_type_enum" NOT NULL,
                "risk_level" "security_events_risk_level_enum" NOT NULL DEFAULT 'low',
                "ip_address" character varying,
                "user_agent" character varying,
                "metadata" jsonb,
                "description" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "resolved_at" TIMESTAMP,
                "resolved_by" character varying,
                CONSTRAINT "PK_security_events" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_security_events_user_id_created_at" ON "security_events" ("user_id", "created_at")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_security_events_event_type_created_at" ON "security_events" ("event_type", "created_at")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_security_events_ip_address" ON "security_events" ("ip_address")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_security_events_ip_address"`);
        await queryRunner.query(`DROP INDEX "IDX_security_events_event_type_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_security_events_user_id_created_at"`);
        await queryRunner.query(`DROP TABLE "security_events"`);
        await queryRunner.query(`DROP TYPE "security_events_risk_level_enum"`);
        await queryRunner.query(`DROP TYPE "security_events_event_type_enum"`);
    }
}