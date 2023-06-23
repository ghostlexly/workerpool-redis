"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("redis");
/** Load Redis */
exports.redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
});
exports.redisClient.on("error", (err) => {
    console.log("[Redis] - error: ", err);
});
exports.redisClient.connect();
//# sourceMappingURL=redisClient.js.map