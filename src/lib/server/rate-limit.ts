import { threadId } from "worker_threads";

import { RedisClient } from "./redis";
export class TokenBucket {
	public max: number;
	public refillIntervalSeconds: number;
	public redisClient: RedisClient<Bucket>;

	constructor(max: number, refillIntervalSeconds: number, redisClient: RedisClient<Bucket>) {
		this.max = max;
		this.refillIntervalSeconds = refillIntervalSeconds;
		this.redisClient = redisClient;
	}

	public async check(key: string, cost: number): Promise<boolean> {
		const bucket = await this.redisClient.get(key);
		// const bucket = this.storage.get(key) ?? null;
		if (bucket === null) {
			return true;
		}
		const now = Date.now();
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
		if (refill > 0) {
			return Math.min(bucket.count + refill, this.max) >= cost;
		}
		return bucket.count >= cost;
	}

	public async consume(key: string, cost: number): Promise<boolean> {
		let bucket = (await this.redisClient.get(key)) ?? null;
		const now = Date.now();
		if (bucket === null) {
			bucket = {
				count: this.max - cost,
				refilledAt: now
			};
			await this.redisClient.set(key, bucket);
			return true;
		}
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
		if (refill > 0) {
			bucket.count = Math.min(bucket.count + refill, this.max);
			bucket.refilledAt = now;
		}
		if (bucket.count < cost) {
			await this.redisClient.set(key, bucket);
			return false;
		}
		bucket.count -= cost;
		this.redisClient.set(key, bucket);
		return true;
	}
}
export interface Bucket {
	count: number;
	refilledAt: number;
}
