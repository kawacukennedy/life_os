import { MigrationInterface, QueryRunner, Table, Index, TableForeignKey } from "typeorm";

export class CreatePluginTables1735524000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create plugins table
    await queryRunner.createTable(
      new Table({
        name: "plugins",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "slug",
            type: "varchar",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "description",
            type: "text",
            isNullable: false,
          },
          {
            name: "long_description",
            type: "text",
            isNullable: true,
          },
          {
            name: "version",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "author_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "author_name",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "category",
            type: "enum",
            enum: ["productivity", "health", "finance", "social", "integration", "utility", "customization"],
            isNullable: false,
          },
          {
            name: "status",
            type: "enum",
            enum: ["draft", "pending_review", "approved", "rejected", "published", "deprecated"],
            default: "'draft'",
            isNullable: false,
          },
          {
            name: "manifest",
            type: "json",
            isNullable: false,
          },
          {
            name: "screenshots",
            type: "json",
            isNullable: true,
          },
          {
            name: "icon_url",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "banner_url",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "tags",
            type: "json",
            isNullable: true,
          },
          {
            name: "average_rating",
            type: "decimal",
            precision: 3,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: "total_reviews",
            type: "int",
            default: 0,
            isNullable: false,
          },
          {
            name: "install_count",
            type: "int",
            default: 0,
            isNullable: false,
          },
          {
            name: "view_count",
            type: "int",
            default: 0,
            isNullable: false,
          },
          {
            name: "price",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "is_paid",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "pricing",
            type: "json",
            isNullable: true,
          },
          {
            name: "repository_url",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "documentation_url",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "support_url",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "changelog",
            type: "text",
            isNullable: true,
          },
          {
            name: "compatibility",
            type: "json",
            isNullable: true,
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "published_at",
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

    // Create indexes for plugins
    await queryRunner.createIndex(
      "plugins",
      new Index("idx_plugins_slug", ["slug"]),
    );
    await queryRunner.createIndex(
      "plugins",
      new Index("idx_plugins_author_id", ["author_id"]),
    );
    await queryRunner.createIndex(
      "plugins",
      new Index("idx_plugins_category", ["category"]),
    );
    await queryRunner.createIndex(
      "plugins",
      new Index("idx_plugins_status", ["status"]),
    );
    await queryRunner.createIndex(
      "plugins",
      new Index("idx_plugins_is_active", ["is_active"]),
    );

    // Create user_plugins table
    await queryRunner.createTable(
      new Table({
        name: "user_plugins",
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
            name: "plugin_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "status",
            type: "enum",
            enum: ["installing", "installed", "failed", "uninstalling", "uninstalled"],
            default: "'installing'",
            isNullable: false,
          },
          {
            name: "installed_version",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "settings",
            type: "json",
            isNullable: true,
          },
          {
            name: "permissions",
            type: "json",
            isNullable: true,
          },
          {
            name: "is_enabled",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "last_used_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "installation_metadata",
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

    // Create indexes for user_plugins
    await queryRunner.createIndex(
      "user_plugins",
      new Index("idx_user_plugins_user_id", ["user_id"]),
    );
    await queryRunner.createIndex(
      "user_plugins",
      new Index("idx_user_plugins_plugin_id", ["plugin_id"]),
    );
    await queryRunner.createIndex(
      "user_plugins",
      new Index("idx_user_plugins_status", ["status"]),
    );
    await queryRunner.createIndex(
      "user_plugins",
      new Index("idx_user_plugins_user_plugin", ["user_id", "plugin_id"], { isUnique: true }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      "user_plugins",
      new TableForeignKey({
        columnNames: ["plugin_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "plugins",
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable("user_plugins");
    const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("plugin_id") !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey("user_plugins", foreignKey);
    }

    // Drop indexes
    await queryRunner.dropIndex("user_plugins", "idx_user_plugins_user_plugin");
    await queryRunner.dropIndex("user_plugins", "idx_user_plugins_status");
    await queryRunner.dropIndex("user_plugins", "idx_user_plugins_plugin_id");
    await queryRunner.dropIndex("user_plugins", "idx_user_plugins_user_id");

    await queryRunner.dropIndex("plugins", "idx_plugins_is_active");
    await queryRunner.dropIndex("plugins", "idx_plugins_status");
    await queryRunner.dropIndex("plugins", "idx_plugins_category");
    await queryRunner.dropIndex("plugins", "idx_plugins_author_id");
    await queryRunner.dropIndex("plugins", "idx_plugins_slug");

    // Drop tables
    await queryRunner.dropTable("user_plugins");
    await queryRunner.dropTable("plugins");
  }
}