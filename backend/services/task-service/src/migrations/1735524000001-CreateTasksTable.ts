import { MigrationInterface, QueryRunner, Table, Index } from "typeorm";

export class CreateTasksTable1735524000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tasks",
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
            length: "512",
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "status",
            type: "enum",
            enum: ["pending", "in_progress", "completed", "cancelled"],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: "priority",
            type: "enum",
            enum: ["low", "medium", "high", "urgent"],
            default: "'medium'",
            isNullable: false,
          },
          {
            name: "due_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "duration_minutes",
            type: "int",
            isNullable: true,
          },
          {
            name: "completed_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "tags",
            type: "json",
            isNullable: true,
          },
          {
            name: "metadata",
            type: "json",
            isNullable: true,
          },
          {
            name: "reminder_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "reminder_sent",
            type: "boolean",
            default: false,
            isNullable: false,
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
      "tasks",
      new Index("idx_tasks_user_id", ["user_id"]),
    );

    await queryRunner.createIndex(
      "tasks",
      new Index("idx_tasks_user_status_due", ["user_id", "status", "due_at"]),
    );

    await queryRunner.createIndex(
      "tasks",
      new Index("idx_tasks_user_priority", ["user_id", "priority"]),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("tasks");
  }
}