import { MigrationInterface, QueryRunner, Table, Index } from "typeorm";

export class CreateNotificationTables1735524000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notifications table
    await queryRunner.createTable(
      new Table({
        name: "notifications",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "user_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "title",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "message",
            type: "text",
            isNullable: false,
          },
          {
            name: "type",
            type: "enum",
            enum: ["info", "success", "warning", "error"],
            default: "'info'",
            isNullable: false,
          },
          {
            name: "channel",
            type: "enum",
            enum: ["in_app", "email", "push", "sms"],
            default: "'in_app'",
            isNullable: false,
          },
          {
            name: "is_read",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "action_url",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "metadata",
            type: "json",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
            isNullable: false,
          },
          {
            name: "read_at",
            type: "timestamptz",
            isNullable: true,
          },
        ],
      }),
    );

    // Create push_subscriptions table
    await queryRunner.createTable(
      new Table({
        name: "push_subscriptions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "user_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "endpoint",
            type: "varchar",
            length: "500",
            isNullable: false,
          },
          {
            name: "p256dh",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "auth",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "user_agent",
            type: "json",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
            isNullable: false,
          },
          {
            name: "updated_at",
            type: "timestamptz",
            default: "now()",
            isNullable: false,
          },
        ],
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      "notifications",
      new Index("idx_notifications_user_id", ["user_id"]),
    );

    await queryRunner.createIndex(
      "notifications",
      new Index("idx_notifications_type", ["type"]),
    );

    await queryRunner.createIndex(
      "notifications",
      new Index("idx_notifications_channel", ["channel"]),
    );

    await queryRunner.createIndex(
      "notifications",
      new Index("idx_notifications_is_read", ["is_read"]),
    );

    await queryRunner.createIndex(
      "notifications",
      new Index("idx_notifications_created_at", ["created_at"]),
    );

    await queryRunner.createIndex(
      "push_subscriptions",
      new Index("idx_push_subscriptions_user_id", ["user_id"]),
    );

    await queryRunner.createIndex(
      "push_subscriptions",
      new Index("idx_push_subscriptions_is_active", ["is_active"]),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("push_subscriptions");
    await queryRunner.dropTable("notifications");
  }
}