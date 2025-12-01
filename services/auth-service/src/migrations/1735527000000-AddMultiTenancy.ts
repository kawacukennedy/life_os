import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMultiTenancy1735527000000 implements MigrationInterface {
    name = 'AddMultiTenancy1735527000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create tenants table
        await queryRunner.query(`
            CREATE TYPE "tenants_status_enum" AS ENUM('active', 'suspended', 'inactive')
        `);

        await queryRunner.query(`
            CREATE TYPE "tenants_plan_enum" AS ENUM('free', 'basic', 'pro', 'enterprise')
        `);

        await queryRunner.query(`
            CREATE TABLE "tenants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "domain" character varying NOT NULL,
                "status" "tenants_status_enum" NOT NULL DEFAULT 'active',
                "plan" "tenants_plan_enum" NOT NULL DEFAULT 'free',
                "settings" jsonb,
                "owner_id" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "subscription_expires_at" TIMESTAMP,
                CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_tenants_name" ON "tenants" ("name")
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_tenants_domain" ON "tenants" ("domain")
        `);

        // Add tenant_id column to users table
        await queryRunner.query(`
            ALTER TABLE "user" ADD "tenant_id" character varying
        `);

        await queryRunner.query(`
            ALTER TABLE "user" ADD CONSTRAINT "FK_user_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Create default tenant
        await queryRunner.query(`
            INSERT INTO "tenants" ("id", "name", "domain", "owner_id", "plan", "settings")
            VALUES ('00000000-0000-0000-0000-000000000000', 'Default Tenant', 'default', 'system', 'free', '{"maxUsers": 100, "maxStorage": 1073741824, "features": ["all_features"]}')
        `);

        // Assign all existing users to default tenant
        await queryRunner.query(`
            UPDATE "user" SET "tenant_id" = '00000000-0000-0000-0000-000000000000' WHERE "tenant_id" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove tenant assignment from users
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_user_tenant"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tenant_id"`);

        // Drop tenants table
        await queryRunner.query(`DROP INDEX "IDX_tenants_domain"`);
        await queryRunner.query(`DROP INDEX "IDX_tenants_name"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP TYPE "tenants_plan_enum"`);
        await queryRunner.query(`DROP TYPE "tenants_status_enum"`);
    }
}