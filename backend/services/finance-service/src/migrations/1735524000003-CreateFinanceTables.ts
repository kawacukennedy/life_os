import { MigrationInterface, QueryRunner, Table, Index } from "typeorm";

export class CreateFinanceTables1735524000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "transactions",
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
            name: "account_id",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "amount",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: "currency",
            type: "varchar",
            length: "3",
            default: "'USD'",
            isNullable: false,
          },
          {
            name: "category",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "description",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "posted_at",
            type: "timestamptz",
            default: "now()",
            isNullable: false,
          },
        ],
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      "transactions",
      new Index("idx_transactions_user_id", ["user_id"]),
    );

    await queryRunner.createIndex(
      "transactions",
      new Index("idx_transactions_account_id", ["account_id"]),
    );

    await queryRunner.createIndex(
      "transactions",
      new Index("idx_transactions_category", ["category"]),
    );

    await queryRunner.createIndex(
      "transactions",
      new Index("idx_transactions_posted_at", ["posted_at"]),
    );

    await queryRunner.createIndex(
      "transactions",
      new Index("idx_transactions_user_posted", ["user_id", "posted_at"]),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("transactions");
  }
}