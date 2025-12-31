import { DataSource } from "typeorm";
import { Event } from "./analytics/event.entity";
import { Metric } from "./analytics/metric.entity";
import { Dashboard } from "./analytics/dashboard.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "lifeos_analytics",
  entities: [Event, Metric, Dashboard],
  migrations: ["src/migrations/*.ts"],
  synchronize: false,
});