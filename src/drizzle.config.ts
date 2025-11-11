import { defineConfig } from "drizzle-kit";
import { readConfig } from "./config"

const config = readConfig();

export default defineConfig({
  schema: "src/schema.ts",
  out: "src/db",
  dialect: "postgresql",
  dbCredentials: {
    url: config.dbUrl,
  },
});
