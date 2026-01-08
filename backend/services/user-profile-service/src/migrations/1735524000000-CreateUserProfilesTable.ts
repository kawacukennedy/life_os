import { MigrationInterface, QueryRunner, Table, Index } from "typeorm";

export class CreateUserProfilesTable1735524000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "user_profiles",
        columns: [
          {
            name: "user_id",
            type: "uuid",
            isPrimary: true,
            isNullable: false,
          },
          {
            name: "display_name",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "bio",
            type: "text",
            isNullable: true,
          },
          {
            name: "avatar_url",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "date_of_birth",
            type: "date",
            isNullable: true,
          },
          {
            name: "timezone",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "location",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "language",
            type: "enum",
            enum: ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"],
            default: "'en'",
            isNullable: false,
          },
          {
            name: "theme",
            type: "enum",
            enum: ["light", "dark", "system"],
            default: "'system'",
            isNullable: false,
          },
          {
            name: "email_notifications",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "push_notifications",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "sms_notifications",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "ai_suggestions",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "data_sharing",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "analytics_tracking",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "profile_privacy",
            type: "enum",
            enum: ["public", "friends", "private"],
            default: "'private'",
            isNullable: false,
          },
          {
            name: "activity_privacy",
            type: "enum",
            enum: ["public", "friends", "private"],
            default: "'private'",
            isNullable: false,
          },
          {
            name: "custom_preferences",
            type: "json",
            isNullable: true,
          },
          {
            name: "notification_settings",
            type: "json",
            isNullable: true,
          },
          {
            name: "privacy_settings",
            type: "json",
            isNullable: true,
          },
          {
            name: "onboarding_completed",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "onboarding_progress",
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
      "user_profiles",
      new Index("idx_user_profiles_user_id", ["user_id"]),
    );

    await queryRunner.createIndex(
      "user_profiles",
      new Index("idx_user_profiles_language", ["language"]),
    );

    await queryRunner.createIndex(
      "user_profiles",
      new Index("idx_user_profiles_theme", ["theme"]),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("user_profiles");
  }
}