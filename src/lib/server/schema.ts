import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("user", {
	id: integer("id").primaryKey(),
	googleId: text("google_id").notNull().unique(),
	email: text("email").notNull().unique(),
	name: text("name").notNull(),
	picture: text("picture").notNull()
});

export const sessions = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => users.id),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull()
});

export const sessionRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
