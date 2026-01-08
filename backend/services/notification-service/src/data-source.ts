import { DataSource } from "typeorm";
import { Notification } from "./notifications/notification.entity";
import { PushSubscription } from "./notifications/push-subscription.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "lifeos",
  entities: [Notification, PushSubscription],
  migrations: ["src/migrations/*.ts"],
  synchronize: false,
});