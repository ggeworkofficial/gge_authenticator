import Redis from "ioredis";

export class RedisClient {
  private static instance: Redis;
  private constructor() {} // prevent external instantiation

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy(times) {
          console.log(`Redis reconnecting... attempt ${times}`);
          return Math.min(times * 50, 2000); // retry every 50ms up to 2s
        },
      });

      RedisClient.instance.on("connect", () => {
        console.log("🟢 Redis connected");
      });

      RedisClient.instance.on("error", (err) => {
        console.error("🔴 Redis error:", err);
      });
    }

    return RedisClient.instance;
  }
}

