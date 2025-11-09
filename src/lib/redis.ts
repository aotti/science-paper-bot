import { Redis } from "@upstash/redis"

export default function RedisClient() {
    return new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN
    })
} 