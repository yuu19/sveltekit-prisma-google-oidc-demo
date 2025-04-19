import { Redis } from "ioredis/built";
import { json } from "stream/consumers";

export class RedisClient<T> {
  /**
   * RedisClient
   */
  #redis;
  constructor(redis: Redis) {
    this.#redis = redis;
  }
  async get(key: string): Promise<T | null> {
    const raw =  await this.#redis.get(key);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw) as T;
  }

  async set(key: string, value: T): Promise<void> {
    await this.#redis.set(key, JSON.stringify(value));
  }
}