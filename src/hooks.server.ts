import { TokenBucket } from "$lib/server/rate-limit";
import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie } from "$lib/server/session";
import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";
import { Redis } from "ioredis/built";
import { RedisClient } from "$lib/server/redis";
import type { Bucket } from "$lib/server/rate-limit";
import { REDIS_HOSTNAME, REDIS_PORT } from "$env/static/private";
const redisClient = new RedisClient<Bucket>(
	new Redis({
		host: REDIS_HOSTNAME,
		port: Number(REDIS_PORT)
	})
);

const bucket = new TokenBucket(100, 1, redisClient);

const rateLimitHandle: Handle = async ({ event, resolve }) => {
	// Note: Assumes X-Forwarded-For will always be defined.
	// const clientIP = event.request.headers.get("X-Forwarded-For");

	const clientIP = event.getClientAddress();
	if (clientIP === null) {
		return resolve(event);
	}
	let cost: number;
	if (event.request.method === "GET" || event.request.method === "OPTIONS") {
		cost = 1;
	} else {
		cost = 3;
	}

	const allowed = await bucket.consume(clientIP, cost);
	if (!allowed) {
		return new Response("Too many requests", {
			status: 429
		});
	}
	return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get("session") ?? null;
	if (token === null) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(token);
	if (session !== null) {
		setSessionTokenCookie(event, token, session.expiresAt);
	} else {
		deleteSessionTokenCookie(event);
	}

	event.locals.session = session;
	event.locals.user = user;
	return resolve(event);
};

export const handle = sequence(rateLimitHandle, authHandle);
