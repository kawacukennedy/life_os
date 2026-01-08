import { MigrationInterface, QueryRunner, Table, Index } from "typeorm";

export class CreateSocialTables1735524000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "connections",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "requester_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "addressee_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "status",
            type: "enum",
            enum: ["pending", "accepted", "blocked", "muted"],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: "type",
            type: "enum",
            enum: ["friend", "colleague", "mentor", "mentee", "family", "acquaintance"],
            default: "'acquaintance'",
            isNullable: false,
          },
          {
            name: "message",
            type: "text",
            isNullable: true,
          },
          {
            name: "shared_goals",
            type: "json",
            isNullable: true,
          },
          {
            name: "shared_interests",
            type: "json",
            isNullable: true,
          },
          {
            name: "is_mutual",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "accepted_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "blocked_at",
            type: "timestamptz",
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
      "connections",
      new Index("idx_connections_requester_id", ["requester_id"]),
    );

    await queryRunner.createIndex(
      "connections",
      new Index("idx_connections_addressee_id", ["addressee_id"]),
    );

    await queryRunner.createIndex(
      "connections",
      new Index("idx_connections_status", ["status"]),
    );

    await queryRunner.createIndex(
      "connections",
      new Index("idx_connections_type", ["type"]),
    );

    await queryRunner.createIndex(
      "connections",
      new Index("idx_connections_requester_status", ["requester_id", "status"]),
    );

    await queryRunner.createIndex(
      "connections",
      new Index("idx_connections_addressee_status", ["addressee_id", "status"]),
    );

    await queryRunner.createIndex(
      "connections",
      new Index("idx_connections_unique_pair", ["requester_id", "addressee_id"], { isUnique: true }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("connections");
  }
}