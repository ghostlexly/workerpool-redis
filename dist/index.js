"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.availableQueues = exports.queuesPool = exports.Queue = void 0;
const cluster_1 = __importDefault(require("cluster"));
const dayjs_1 = __importDefault(require("dayjs"));
const redisClient_1 = require("./utils/redisClient");
Object.defineProperty(exports, "redisClient", { enumerable: true, get: function () { return redisClient_1.redisClient; } });
const queue_1 = require("./queue");
Object.defineProperty(exports, "availableQueues", { enumerable: true, get: function () { return queue_1.availableQueues; } });
Object.defineProperty(exports, "queuesPool", { enumerable: true, get: function () { return queue_1.queuesPool; } });
Object.defineProperty(exports, "Queue", { enumerable: true, get: function () { return queue_1.Queue; } });
/** Jobs Worker */
// run the jobs worker only on the first cluster worker (to avoid multiple workers doing same jobs)
if (!cluster_1.default || !cluster_1.default.worker || cluster_1.default.worker.id === 1) {
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        // search for new jobs
        Object.entries(queue_1.availableQueues).map(([key, queue]) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            try {
                for (var _d = true, _e = __asyncValues(redisClient_1.redisClient.scanIterator({ MATCH: `jobs:${queue.name}:*`, COUNT: 1000 })), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const key = _c;
                    try {
                        const cache = yield redisClient_1.redisClient.get(key);
                        // check if cache is not null
                        if (!cache) {
                            continue;
                        }
                        // parse the job data
                        const jobData = JSON.parse(cache);
                        // retry staled jobs
                        if (jobData.status === "running" &&
                            (0, dayjs_1.default)(jobData.startDate) < (0, dayjs_1.default)().subtract(queue.retryInMinutes, "minutes")) {
                            console.log(`The job [${key}] is staled, retrying...`);
                            redisClient_1.redisClient.set(key, JSON.stringify(Object.assign(Object.assign({}, jobData), { status: "pending" })));
                        }
                        // check if the job is already running
                        if (jobData.status === "running") {
                            continue;
                        }
                        // set the job status to running
                        redisClient_1.redisClient.set(key, JSON.stringify(Object.assign(Object.assign({}, jobData), { status: "running", startDate: (0, dayjs_1.default)() })));
                        queue_1.queuesPool.exec(queue.process, [...jobData.args]).then((result) => {
                            console.log(`The job [${key}] is done, removing key...`);
                            redisClient_1.redisClient.del(key);
                            // call the onComplete callback
                            if (queue.onComplete) {
                                queue.onComplete(result);
                            }
                        });
                    }
                    catch (err) {
                        console.log(`An error occured while processing the job [${key}]...`, err);
                        redisClient_1.redisClient.del(key);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }));
    }), 500);
}
//# sourceMappingURL=index.js.map