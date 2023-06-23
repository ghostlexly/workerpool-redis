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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = exports.queuesPool = exports.availableQueues = void 0;
const workerpool_1 = __importDefault(require("workerpool"));
const redisClient_1 = require("./utils/redisClient");
const crypto_1 = __importDefault(require("crypto"));
exports.availableQueues = [];
/**
 * Add Queues Mechanism (Workerpool)
 */
exports.queuesPool = workerpool_1.default.pool({
    maxWorkers: require("os").cpus().length,
});
class Queue {
    constructor(name, process, retryInMinutes) {
        this.retryInMinutes = 5;
        this.name = name;
        this.process = process;
        if (retryInMinutes) {
            this.retryInMinutes = retryInMinutes;
        }
        // add this to the available queues array
        exports.availableQueues[name] = this;
    }
    add(args) {
        return __awaiter(this, void 0, void 0, function* () {
            redisClient_1.redisClient.set(`jobs:${this.name}:${crypto_1.default.randomUUID()}`, JSON.stringify({ status: "pending", args: args }));
        });
    }
}
exports.Queue = Queue;
//# sourceMappingURL=queue.js.map