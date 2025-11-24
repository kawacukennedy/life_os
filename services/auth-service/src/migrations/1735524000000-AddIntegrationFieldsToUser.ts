import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIntegrationFieldsToUser1735524000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("user", [
      new TableColumn({
        name: "googleTokens",
        type: "json",
        isNullable: true,
      }),
      new TableColumn({
        name: "fitbitTokens",
        type: "json",
        isNullable: true,
      }),
      new TableColumn({
        name: "plaidTokens",
        type: "json",
        isNullable: true,
      }),
      new TableColumn({
        name: "preferences",
        type: "json",
        isNullable: true,
      }),
      new TableColumn({
        name: "lastActiveAt",
        type: "timestamp",
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("user", "lastActiveAt");
    await queryRunner.dropColumn("user", "preferences");
    await queryRunner.dropColumn("user", "plaidTokens");
    await queryRunner.dropColumn("user", "fitbitTokens");
    await queryRunner.dropColumn("user", "googleTokens");
  }
}
