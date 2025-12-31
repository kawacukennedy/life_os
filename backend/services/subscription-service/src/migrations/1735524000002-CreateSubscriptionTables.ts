import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscriptionTables1735524000002 implements MigrationInterface {
  name = "CreateSubscriptionTables1735524000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create plans table
    await queryRunner.query(`
      CREATE TYPE "plan_type_enum" AS ENUM('free', 'premium', 'enterprise')
    `);
    await queryRunner.query(`
      CREATE TYPE "billing_interval_enum" AS ENUM('monthly', 'yearly')
    `);
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "type" "plan_type_enum" NOT NULL DEFAULT 'free',
        "price" numeric(10,2) NOT NULL,
        "billingInterval" "billing_interval_enum" NOT NULL DEFAULT 'monthly',
        "features" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "maxUsers" integer NOT NULL DEFAULT 0,
        "maxProjects" integer NOT NULL DEFAULT 0,
        "storageLimitGb" integer NOT NULL DEFAULT 0,
        "stripePriceId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_4c88e956195bba85977da21b8f4" ON "plans" ("name")
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TYPE "subscription_status_enum" AS ENUM('active', 'inactive', 'cancelled', 'past_due', 'unpaid', 'trialing')
    `);
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "planId" uuid NOT NULL,
        "status" "subscription_status_enum" NOT NULL DEFAULT 'active',
        "currentPeriodStart" TIMESTAMP,
        "currentPeriodEnd" TIMESTAMP,
        "trialEnd" TIMESTAMP,
        "cancelAtPeriodEnd" TIMESTAMP,
        "stripeSubscriptionId" character varying,
        "stripeCustomerId" character varying,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_a87248d73155605cf782be9d5e4" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_a87248d73155605cf782be9d5e4" ON "subscriptions" ("userId")
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "FK_a87248d73155605cf782be9d5e4"
      FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM('pending', 'succeeded', 'failed', 'cancelled', 'refunded')
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_method_enum" AS ENUM('card', 'bank_account', 'paypal')
    `);
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscriptionId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'USD',
        "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "paymentMethod" "payment_method_enum" NOT NULL DEFAULT 'card',
        "stripePaymentIntentId" character varying,
        "stripeChargeId" character varying,
        "failureReason" text,
        "metadata" jsonb,
        "paidAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f5" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_4c88e956195bba85977da21b8f5" ON "payments" ("userId")
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_4c88e956195bba85977da21b8f5"
      FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_4c88e956195bba85977da21b8f5"`);
    await queryRunner.query(`DROP INDEX "IDX_4c88e956195bba85977da21b8f5"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "payment_status_enum"`);

    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_a87248d73155605cf782be9d5e4"`);
    await queryRunner.query(`DROP INDEX "IDX_a87248d73155605cf782be9d5e4"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "subscription_status_enum"`);

    await queryRunner.query(`DROP INDEX "IDX_4c88e956195bba85977da21b8f4"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TYPE "billing_interval_enum"`);
    await queryRunner.query(`DROP TYPE "plan_type_enum"`);
  }
}