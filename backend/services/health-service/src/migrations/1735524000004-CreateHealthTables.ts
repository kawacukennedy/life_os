import { MigrationInterface, QueryRunner, Table, Index } from "typeorm";

export class CreateHealthTables1735524000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "vitals",
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
            name: "metric_type",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "value",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "unit",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "recorded_at",
            type: "timestamptz",
            default: "now()",
            isNullable: false,
          },
        ],
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      "vitals",
      new Index("idx_vitals_user_id", ["user_id"]),
    );

    await queryRunner.createIndex(
      "vitals",
      new Index("idx_vitals_metric_type", ["metric_type"]),
    );

    await queryRunner.createIndex(
      "vitals",
      new Index("idx_vitals_recorded_at", ["recorded_at"]),
    );

    await queryRunner.createIndex(
      "vitals",
      new Index("idx_vitals_user_metric_recorded", ["user_id", "metric_type", "recorded_at"]),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("vitals");
  }
}