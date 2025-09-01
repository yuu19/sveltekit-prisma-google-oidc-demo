import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/lib/server/schema.ts",
	out: "./drizzle",
	driver: "better-sqlite3",
	dbCredentials: {
		url: process.env.DATABASE_URL?.replace("file:", "") ?? "./dev.db"
	}
});
