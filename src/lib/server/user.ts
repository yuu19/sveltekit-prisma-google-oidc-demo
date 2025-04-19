import { db } from "$lib/server/prisma";
import type { User } from "@prisma-app/client";
export async function createUser(googleId: string, email: string, name: string, picture: string): Promise<User> {

	const user = await db.user.create({
		data: {
			googleId,
			email,
			name,
			picture,
		},
	});

	return user;
}

export async function getUserFromGoogleId(googleId: string): Promise<User | null> {
	const user = await db.user.findUnique({
		where: {
			googleId
		}
});

	return user;
}
