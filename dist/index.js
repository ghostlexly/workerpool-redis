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
exports.Queue = exports.pool = void 0;
const workerpool_1 = __importDefault(require("workerpool"));
const redis_1 = require("redis");
const crypto_1 = __importDefault(require("crypto"));
const cluster_1 = __importDefault(require("cluster"));
const dayjs_1 = __importDefault(require("dayjs"));
const queues = [];
/** Load Redis */
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
});
redisClient.on("error", (err) => {
    console.log("[Redis] - error: ", err);
});
redisClient.connect();
/**
 * Add Queues Mechanism (Workerpool)
 */
exports.pool = workerpool_1.default.pool({
    maxWorkers: require("os").cpus().length,
});
class Queue {
    constructor(name, process) {
        this.name = name;
        this.process = process;
        // add this to the queues array
        queues[name] = this;
    }
    add(args) {
        return __awaiter(this, void 0, void 0, function* () {
            redisClient.set(`jobs:${this.name}:${crypto_1.default.randomUUID()}`, JSON.stringify({ status: "pending", args: args }));
        });
    }
}
exports.Queue = Queue;
/** Jobs Worker */
// run the jobs worker only on the first cluster worker (to avoid multiple workers doing same jobs)
if (cluster_1.default.worker.id === 1) {
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        // search for new jobs
        Object.entries(queues).map(([key, queue]) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            try {
                for (var _d = true, _e = __asyncValues(redisClient.scanIterator({ MATCH: `jobs:${queue.name}:*`, COUNT: 1000 })), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const key = _c;
                    try {
                        const cache = yield redisClient.get(key);
                        // check if cache is not null
                        if (!cache) {
                            continue;
                        }
                        // parse the job data
                        const jobData = JSON.parse(cache);
                        // retry staled jobs
                        if (jobData.status === "running" && (0, dayjs_1.default)(jobData.startDate) < (0, dayjs_1.default)().subtract(5, "minutes")) {
                            console.log(`The job [${key}] is staled, retrying...`);
                            redisClient.set(key, JSON.stringify(Object.assign(Object.assign({}, jobData), { status: "pending" })));
                        }
                        // check if the job is already running
                        if (jobData.status === "running") {
                            continue;
                        }
                        // set the job status to running
                        redisClient.set(key, JSON.stringify(Object.assign(Object.assign({}, jobData), { status: "running", startDate: (0, dayjs_1.default)() })));
                        exports.pool.exec(queue.process, [...jobData.args]).then(() => {
                            console.log(`The job [${key}] is done, removing key...`);
                            redisClient.del(key);
                        });
                    }
                    catch (err) {
                        console.log(`An error occured while processing the job [${key}]...`, err);
                        redisClient.del(key);
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