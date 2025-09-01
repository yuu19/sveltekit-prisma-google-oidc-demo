import { db } from "$lib/server/db";
import { users, type User } from "$lib/server/schema";
import { eq } from "drizzle-orm";

export async function createUser(googleId: string, email: string, name: string, picture: string): Promise<User> {
	const [row] = await db.insert(users).values({ googleId, email, name, picture }).returning();
	return row;
}

export async function getUserFromGoogleId(googleId: string): Promise<User | null> {
	const [row] = await db.select().from(users).where(eq(users.googleId, googleId));
	return row ?? null;
}
