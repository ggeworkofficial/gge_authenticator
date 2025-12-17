import { Request, Response, NextFunction } from "express";
import { RedisClient } from "../connections/redis";
import { ToManyRequestError } from "../errors/rate.error";

const redis = RedisClient.getInstance();

type RateLimiterOptions = {
  windowSeconds: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
};

export function rateLimiter(options: RateLimiterOptions) {
  const {
    windowSeconds,
    maxRequests,
    keyGenerator,
  } = options;

  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const key =
        keyGenerator?.(req) ??
        `rl:ip:${req.ip}`;

      const redisKey = `rate-limit:${key}`;
      const current = await redis.incr(redisKey);

      if (current === 1) await redis.expire(redisKey, windowSeconds);
      if (current > maxRequests) throw new ToManyRequestError("Too many request please try again");
      

      next();
    } catch (err) {
      next(err);
    }
  };
}
