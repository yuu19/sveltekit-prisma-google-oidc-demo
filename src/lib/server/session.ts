import { db } from "$lib/server/prisma";
import type { User } from "../../../generated/prisma";
import type { Session } from "../../../generated/prisma";
import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import type { RequestEvent } from "@sveltejs/kit";
import { Prisma } from "@prisma/client";

const fifteenDays = 1000 * 60 * 60 * 24 * 15;
const thirtyDays = 1000 * 60 * 60 * 24 * 30;

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const row = await db.session.findUnique({
		where: {
			id: sessionId
		},
		include: {
			user: true
		}
	});
	if (row === null) {
		return { session: null, user: null };
	}
  
	const { user, ...session } = row;

	
	/**
	 * セッションが期限切れの場合は、セッションを削除してnullを返す
	 */
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.session.delete({
			where: {
				id: session.id
			}
		});
		return { session: null, user: null };
	}


	/**
	 * セッションの有効期限が15日以内の場合は、30日延長する
	 */
	if (Date.now() >= session.expiresAt.getTime() - fifteenDays) {
		session.expiresAt = new Date(Date.now() + thirtyDays);
		await db.session.update({
			where: {
				id: session.id
			},
			data: {
				expiresAt: session.expiresAt
			}
		});
	}
	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.session.delete({
		where: {
			id: sessionId
		}
	})
}

export async function invalidateUserSessions(userId: number): Promise<void> {
  await db.session.deleteMany({
		where: {
			userId
		}
	})
	// await db.execute("DELETE FROM session WHERE user_id = ?", [userId]);
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set("session", token, {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		expires: expiresAt
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set("session", "", {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		maxAge: 0
	});
}

export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32(tokenBytes).toLowerCase();
	return token;
}

export async function createSession(token: string, userId: number): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + thirtyDays)
	};

	await db.session.create({
		data: {
			id: session.id,
			userId: session.userId,
			expiresAt: session.expiresAt
		}
	});
	return session;
}


type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
