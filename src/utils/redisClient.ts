import { createClient } from "redis";

/** Load Redis */
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.log("[Redis] - error: ", err);
});

redisClient.connect();

export { redisClient };
