import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from "typeorm";

export class CreateLearningTables1735524000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create courses table
    await queryRunner.createTable(
      new Table({
        name: "courses",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "title",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "category",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "total_lessons",
            type: "int",
            isNullable: false,
          },
          {
            name: "duration",
            type: "int",
            default: 0,
            isNullable: false,
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "is_micro_course",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "estimated_time",
            type: "int",
            default: 5,
            isNullable: false,
          },
          {
            name: "learning_objectives",
            type: "json",
            isNullable: true,
          },
          {
            name: "prerequisites",
            type: "json",
            isNullable: true,
          },
          {
            name: "tags",
            type: "json",
            isNullable: true,
          },
          {
            name: "difficulty",
            type: "float",
            default: 0,
            isNullable: false,
          },
          {
            name: "spaced_repetition",
            type: "json",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
            isNullable: false,
          },
        ],
      }),
    );

    // Create progress table
    await queryRunner.createTable(
      new Table({
        name: "progress",
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
            name: "course_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "completed_lessons",
            type: "int",
            default: 0,
            isNullable: false,
          },
          {
            name: "progress_percent",
            type: "decimal",
            precision: 5,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: "last_lesson_id",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "last_accessed_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "started_at",
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
          {
            name: "review_count",
            type: "int",
            default: 0,
            isNullable: false,
          },
          {
            name: "easiness_factor",
            type: "float",
            default: 2.5,
            isNullable: false,
          },
          {
            name: "next_review_date",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "interval_days",
            type: "int",
            default: 1,
            isNullable: false,
          },
        ],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      "progress",
      new ForeignKey({
        columnNames: ["course_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "courses",
        onDelete: "CASCADE",
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      "courses",
      new Index("idx_courses_category", ["category"]),
    );

    await queryRunner.createIndex(
      "courses",
      new Index("idx_courses_is_micro_course", ["is_micro_course"]),
    );

    await queryRunner.createIndex(
      "courses",
      new Index("idx_courses_difficulty", ["difficulty"]),
    );

    await queryRunner.createIndex(
      "progress",
      new Index("idx_progress_user_id", ["user_id"]),
    );

    await queryRunner.createIndex(
      "progress",
      new Index("idx_progress_course_id", ["course_id"]),
    );

    await queryRunner.createIndex(
      "progress",
      new Index("idx_progress_user_course", ["user_id", "course_id"], { isUnique: true }),
    );

    await queryRunner.createIndex(
      "progress",
      new Index("idx_progress_next_review_date", ["next_review_date"]),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("progress");
    await queryRunner.dropTable("courses");
  }
}